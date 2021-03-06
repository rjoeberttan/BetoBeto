//jshint esversion: 6
const { application } = require("express");
const express = require("express");
const mysql = require("mysql");
const { createLogger, transports, format } = require("winston");
const helmet = require("helmet");
const cors = require("cors");
const { parse } = require("dotenv");
require("dotenv").config();

// Configure Express Application
const app = express();
app.use(express.json());
app.use(helmet());
app.use(
  cors({
    origin: [process.env.FRONTEND],
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true }));

// Configure Winston Logging
// For this environment it sends to console first
const logger = createLogger({
  format: format.combine(
    format.timestamp({ format: "MMM-DD-YYYY HH:mm:ss" }),
    format.printf(
      (info) => `${info.timestamp} -- ${(info.level).toUpperCase()} -- ${info.message}`
    )
  ),
  transports: [new transports.File({filename: '/var/log/app/bankmanager.log'})],
});

const getDurationInMilliseconds = (start) => {
  const NS_PER_SEC = 1e9
  const NS_TO_MS = 1e6
  const diff = process.hrtime(start)

  return `${((diff[0] * NS_PER_SEC + diff[1])/ NS_TO_MS).toFixed(2)}ms`
}

// Configure Database Connection
const db = mysql.createConnection({
  user: process.env.MYSQL_USERNAME,
  host: process.env.MYSQL_HOST,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.PORT,
  multipleStatements: true,
});

app.post("/requestDeposit", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");
  const accountId = req.body.accountId;
  const amount = req.body.amount;


  // Check if body is complete
  if (!accountId || !amount) {
    logger.warn(`${req.originalUrl} request has missing body parameters, accountId:${accountId}`)
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  // Process 1
  // Insert into database
  const description = "Deposit Request - Php " + amount;
  sqlQuery =
    "INSERT INTO transactions (description, account_id, transaction_type, amount, status, placement_date) VALUES (?, ?, 0, ?, 0, NOW());";
  db.query(sqlQuery, [description, accountId, amount], (err, result) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`)
      res.status(500).json({ message: "Server error" });
    } else if (result.affectedRows <= 0) {
      logger.warn(`${req.originalUrl} request warning, request was not inserted into database, accountId:${accountId}`);
      res.status(409).json({ message: "Deposit request not successful" });
    } else {
      logger.info(`${req.originalUrl} request successful, accountId:${accountId} amount:${amount} transactionId:${result.insertId} duration:${getDurationInMilliseconds(start)}`)
      res.status(200).json({
        message: "Deposit Request Successful",
        data: { transactionId: result.insertId },
      });
    }
  });
});

app.post("/acceptDeposit", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");
  const transactionId = req.body.transactionId;
  const accountId = req.body.accountId;
  const amount = req.body.amount;
  const accepterAccountId = req.body.accepterAccountId;
  const accepterUsername = req.body.accepterUsername;

  // Check if body is complete
  if (
    !transactionId ||
    !accountId ||
    !amount ||
    !accepterAccountId ||
    !accepterUsername
  ) {
    logger.warn(`${req.originalUrl} request has missing body parameters, accountId:${accountId}`)
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  var successful = true;
  // Process 1
  // Check current status from transactions
  sqlQuery1 = "SELECT status FROM transactions WHERE transaction_id = ?";
  db.query(sqlQuery1, [transactionId], (err, result1) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`)
      res.status(500).json({ message: "Server error" });
    } else if (result1.length <= 0) {
      logger.warn(`${req.originalUrl} request warning, transaction not found in database, transactionId:${transactionId}`);
      res.status(409).json({
        message: "Transaction ID cannot be found",
        data: { transactionId: transactionId },
      });
    } else if (result1[0].status != 0) {
      logger.warn(`${req.originalUrl} request warning, transaction is already settled, transactionId:${transactionId}`);
      res.status(409).json({
        message: "Transaction is already settled",
        data: { transactionId: transactionId },
      });
    } else {
      // Process 2
      // Check wallet of accepter if there is enough funds to transfer
      sqlQuery2 = "SELECT wallet FROM accounts WHERE account_id = ?";
      db.query(sqlQuery2, [accepterAccountId], (err, result2) => {
        if (err) {
          logger.error(`/${req.originalUrl} request has an error during process 2, transactionId:${transactionId}, error:${err}`)
        } else if (result2.length <= 0) {
          logger.warn(`${req.originalUrl} request warning, accepter wallet not found in database, transactionId:${transactionId} accepter:${accepterAccountId}`);
          res.status(409).json({ message: "Accepter accountId not found in database" });
          successful = false;
        } else if (result2[0].wallet < amount) {
          logger.warn(`${req.originalUrl} request warning, accepter does not have enough funds to accept transaction, transactionId:${transactionId} accepter:${accepterAccountId}`);
          res.status(409).json({
            message:
              "You dont have enough funds to continue with this transaction",
          });
          successful = false;
        } else {
          // Process 3
          // Increase Requester Wallet
          sqlQuery3 =
            "UPDATE accounts SET wallet=wallet+?, lastedit_date=NOW(), edited_by=? WHERE account_id=?";
          db.query(
            sqlQuery3,
            [amount, accepterUsername, accountId],
            (err, result3) => {
              if (err) {
                logger.error(`${req.originalUrl} request has an error during process 3, transactionId:${transactionId}, error:${err}`)
                successful = false;
              } else if (result3.affectedRows <= 0) {
                logger.warn(`${req.originalUrl} request warning during increasing requester wallet, can't find requester wallet, transactionId:${transactionId} requester:${accountId}`);
                successful = false;
              } else {
                logger.info(`${req.originalUrl} increased requester wallet thru acceptDeposit, accountId:${accountId} amount:${amount} transactionId:${transactionId} editor:${accepterUsername}`)

                // Process 4
                // Decrease Accepter Wallet
                decreasedAmount = 0 - amount;
                sqlQuery4 =
                  "UPDATE accounts SET wallet=wallet+?, lastedit_date=NOW(), edited_by=? WHERE account_id=?";
                db.query(
                  sqlQuery4,
                  [decreasedAmount, accepterUsername, accepterAccountId],
                  (err, result4) => {
                    if (err) {
                      logger.error(`${req.originalUrl} request has an error during process 4, transactionId:${transactionId}, error:${err}`)
                      successful = false;
                    } else if (result4.affectedRows <= 0) {
                      logger.warn(`${req.originalUrl} request warning during decreasing accepter wallet, can't find requester wallet, transactionId:${transactionId} accountId:${accepterAccountId}`);
                      successful = false;
                    } else {
                      logger.info(`${req.originalUrl} decreased accepter wallet thru acceptDeposit, accountId:${accepterAccountId} amount:${amount} transactionId:${transactionId} editor:${accepterUsername}`)
                      
                      // Process 5
                      // Insert acceptDeposit to the transactions table
                      sqlGetUsername = `SELECT username FROM accounts WHERE account_id = ${accountId}`
                      db.query(sqlGetUsername, (err, username) => {
                        sqlQuery5 =
                        "INSERT INTO transactions (description, account_id, transaction_type, amount, status, placement_date, settled_date, settled_by, cummulative) VALUES (?, ?, 1, ?, 1, NOW(), NOW(), ?, (SELECT wallet FROM accounts where account_id = ?)); ";
                      db.query(
                        sqlQuery5,
                        [
                          "Accept Deposit - " + username[0].username + " - " + transactionId,
                          accepterAccountId,
                          amount,
                          accepterUsername,
                          accepterAccountId,
                        ],
                        (err, result5) => {
                          if (err) {
                            logger.error(`${req.originalUrl} request has an error during process 5, transactionId:${transactionId}, error:${err}`)
                            successful = false;
                          } else {
                            logger.info(`${req.originalUrl} inserted acceptDeposit into transactions, accountId:${accountId} amount:${amount} transactionId:${transactionId} editor:${accepterUsername}`)
                          }
                        }
                      );
                      })

                    }
                  }
                );

                // Process 6
                // Update the transactions table
                sqlQuery6 =
                  "UPDATE transactions SET status = 1, cummulative=(SELECT wallet FROM accounts WHERE account_id=?), settled_date = NOW(), settled_by = ? WHERE transaction_id=?;";
                db.query(
                  sqlQuery6,
                  [accountId, accepterUsername, transactionId],
                  (err, result6) => {
                    if (err) {
                      logger.error(`${req.originalUrl} request has an error during process 6, transactionId:${transactionId}, error:${err}`)
                      successful = false;
                    } else {
                      logger.info(`${req.originalUrl} updated transactions, accountId:${accountId} amount:${amount} transactionId:${transactionId} editor:${accepterUsername} duration:${getDurationInMilliseconds(start)}`)
                      res.status(200).json({
                        message: "Successful Request, deposit settled",
                        data: { transactionId: transactionId },
                      });
                    }
                  }
                );
              }
            }
          );
        }
      });
    }
  });

  if (!successful) {
    res.status(500).json({ message: "Server error. Please raise to support" });
  }
});

app.post("/requestWithdrawal", (req, res) => {
  const start = process.hrtime()

  const apiKey = req.header("Authorization");
  const accountId = req.body.accountId;
  const amount = req.body.amount;

  // Check if body is complete
  if (!accountId || !amount) {
    logger.warn(`${req.originalUrl} request has missing body parameters, accountId:${accountId}`)
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  // Process 1
  // Insert into database
  const description = "Withdrawal Request - Php " + amount;
  sqlQuery =
    "INSERT INTO transactions (description, account_id, transaction_type, amount, status, placement_date) VALUES (?, ?, 2, ?, 0, NOW());";
  db.query(sqlQuery, [description, accountId, amount], (err, result) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`)
      res.status(500).json({ message: "Server error" });
    } else if (result.affectedRows <= 0) {
      logger.warn(`${req.originalUrl} request warning, transaction was not inserted into database, accountId:${accountId}`);
      res.status(409).json({ message: "Withdrawal request not successful" });
    } else {
      logger.info(`${req.originalUrl} request successful, accountId:${accountId} transactionId:${result.insertId} amount:${amount} duration:${getDurationInMilliseconds(start)} `)
      res.status(200).json({
        message: "Withdrawal Request Successful",
        data: { transactionId: result.insertId },
      });
    }
  });
});



app.post("/cancelTransaction", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");
  const transactionId = req.body.transactionId;
  const accountId = req.body.accountId;
  const cancellerUsername = req.body.cancellerUsername;

  // Check if body is complete
  if (!transactionId || !accountId || !cancellerUsername) {
    logger.warn(`${req.originalUrl} request has missing body parameters, accountId:${accountId}`)
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  sqlQuery1 = "SELECT status FROM transactions WHERE transaction_id = ?"
  db.query(sqlQuery1, [transactionId], (err, result1) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, transactionId:${transactionId}, error:${err}`)
      res.status(500).json({ message: "Server error" });
    } else if (result1.length <= 0) {
      logger.warn(`${req.originalUrl} request warning, transaction not found in database, transactionId:${transactionId}`);
      res.status(409).json({
        message: "Transaction ID cannot be found",
        data: { transactionId: transactionId },
      });
    } else if (result1[0].status != 0) {
      logger.warn(`${req.originalUrl} request warning, transaction already settled/cancelled, transactionId:${transactionId}`);
      res.status(409).json({
        message: "Transaction is already settled/cancelled",
        data: { transactionId: transactionId },
      });
    } else {
        // Update transactions with status = 2
        sqlQuery2 = "UPDATE transactions SET status = 2, cummulative=(SELECT wallet FROM accounts WHERE account_id=?), settled_date = NOW(), settled_by = ? WHERE transaction_id=?;";
        db.query(sqlQuery2, [accountId, cancellerUsername, transactionId],(err, result2) => {
            if (err) {
              logger.error(`${req.originalUrl} request has an error during process 2, transactionId:${transactionId}, error:${err}`)
              successful = false;
            } else {
              logger.info(`${req.originalUrl} request successful, transactionId:${transactionId} duration:${getDurationInMilliseconds(start)}`)
              res.status(200).json({
                message: "Transaction Cancelled",
                data: { transactionId: transactionId },
              });
            }
          }
        );
    }

  })
})

app.post("/acceptWithdrawal", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");
  const transactionId = req.body.transactionId;
  const accountId = req.body.accountId;
  const amount = req.body.amount;
  const accepterAccountId = req.body.accepterAccountId;
  const accepterUsername = req.body.accepterUsername;

  // Check if body is complete
  if (
    !transactionId ||
    !accountId ||
    !amount ||
    !accepterAccountId ||
    !accepterUsername
  ) {
    logger.warn(`${req.originalUrl} request has missing body parameters, accountId:${accountId}`)
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  var successful = true;
  // Process 1
  // Check current status from transactions
  sqlQuery1 = "SELECT status FROM transactions WHERE transaction_id = ?";
  db.query(sqlQuery1, [transactionId], (err, result1) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`)
      res.status(500).json({ message: "Server error" });
    } else if (result1.length <= 0) {
      logger.warn(`${req.originalUrl} request warning, transaction not found in database, transactionId:${transactionId}`);
      res.status(409).json({
        message: "Transaction ID cannot be found",
        data: { transactionId: transactionId },
      });
    } else if (result1[0].status != 0) {
      logger.warn(`${req.originalUrl} request warning, transaction is already settled, transactionId:${transactionId}`);
      res.status(409).json({
        message: "Transaction is already settled",
        data: { transactionId: transactionId },
      });
    } else {
      // Process 2
      // Check wallet of requester if there is enough funds to transfer
      sqlQuery2 = "SELECT wallet FROM accounts WHERE account_id = ?";
      db.query(sqlQuery2, [accountId], (err, result2) => {
        if (err) {
          logger.error(`/${req.originalUrl} request has an error during process 2, transactionId:${transactionId}, error:${err}`)
        } else if (result2.length <= 0) {
          logger.warn(`${req.originalUrl} request warning, requester wallet not found in database, transactionId:${transactionId} requester:${accountId}`);
          res.status(409).json({ message: "Requester account_id not found" });
          successful = false;
        } else if (result2[0].wallet < amount) {
          logger.warn(`${req.originalUrl} request warning, request does not have enough funds to continue transaction, transactionId:${transactionId} requester:${acountId}`);
          res.status(409).json({
            message:
              "Requester doesn't have enough funds to continue with this transaction",
          });
          successful = false;
        } else {
          // Process 3
          // Decrease Requester Wallet
          decreasedAmount = 0 - amount;
          sqlQuery3 =
            "UPDATE accounts SET wallet=wallet+?, lastedit_date=NOW(), edited_by=? WHERE account_id=?";
          db.query(
            sqlQuery3,
            [decreasedAmount, accepterUsername, accountId],
            (err, result3) => {
              if (err) {
                logger.error(`${req.originalUrl} request has an error during process 3, transactionId:${transactionId}, error:${err}`)
                successful = false;
              } else if (result3.affectedRows <= 0) {
                logger.warn(`${req.originalUrl} request warning during decreasing requester wallet, can't find requester wallet, transactionId:${transactionId} requester:${accountId}`);
                successful = false;
              } else {
                logger.info(`${req.originalUrl} decreased requester wallet thru acceptWithdrawal, accountId:${accountId} amount:${amount} transactionId:${transactionId} editor:${accepterUsername}`)
                // Process 4
                // Increase Accepter Wallet
                sqlQuery4 =
                  "UPDATE accounts SET wallet=wallet+?, lastedit_date=NOW(), edited_by=? WHERE account_id=?";
                db.query(
                  sqlQuery4,
                  [amount, accepterUsername, accepterAccountId],
                  (err, result4) => {
                    if (err) {
                      logger.error(`${req.originalUrl} request has an error during process 4, transactionId:${transactionId}, error:${err}`)
                      successful = false;
                    } else if (result4.affectedRows <= 0) {
                      logger.warn(`${req.originalUrl} request warning during increasing accepter wallet, can't find accepter wallet, transactionId:${transactionId} accepter:${accepterAccountId}`);
                      successful = false;
                    } else {
                      logger.info(`${req.originalUrl} increased accepter wallet thru acceptWithdrawal, accountId:${accountId} amount:${amount} transactionId:${transactionId} editor:${accepterAccountId}`)

                      // Process 5
                      // Insert acceptWithdrawal to the transactions table
                      sqlGetUsername = `SELECT username FROM accounts WHERE account_id = ${accountId}`
                      db.query(sqlGetUsername, (err, username) => {
                        sqlQuery5 =
                        "INSERT INTO transactions (description, account_id, transaction_type, amount, status, placement_date, settled_date, settled_by, cummulative) VALUES (?, ?, 3, ?, 1, NOW(), NOW(), ?, (SELECT wallet FROM accounts where account_id = ?)); ";
                      db.query(
                        sqlQuery5,
                        [
                          "Accept Withdrawal - " +
                            username[0].username +
                            " - " +
                            transactionId,
                          accepterAccountId,
                          amount,
                          accepterUsername,
                          accepterAccountId,
                        ],
                        (err, result5) => {
                          if (err) {
                            logger.error(`${req.originalUrl} request has an error during process 5, transactionId:${transactionId}, error:${err}`)
                            successful = false;
                          } else {
                            logger.info(`${req.originalUrl} inserted acceptedWithdrawal into transactions, accountId:${accountId} amount:${amount} transactionId:${transactionId} editor:${accepterUsername}`)
                          }
                        }
                      );
                      })

                    }
                  }
                );

                // Process 6
                // Update the transactions table
                sqlQuery6 =
                  "UPDATE transactions SET status = 1, cummulative=(SELECT wallet FROM accounts WHERE account_id=?), settled_date = NOW(), settled_by = ? WHERE transaction_id=?;";
                db.query(
                  sqlQuery6,
                  [accountId, accepterUsername, transactionId],
                  (err, result6) => {
                    if (err) {
                      logger.error(`${req.originalUrl} request has an error during process 6, transactionId:${transactionId}, error:${err}`)
                      successful = false;
                    } else {
                      logger.info(`${req.originalUrl} updated transactions, accountId:${accountId} amount:${amount} transactionId:${transactionId} editor:${accepterUsername} duration:${getDurationInMilliseconds(start)}`)
                      res.status(200).json({
                        message: "Successful Request, withdrawal settled",
                        data: { transactionId: transactionId },
                      });
                    }
                  }
                );
              }
            }
          );
        }
      });
    }
  });

  if (!successful) {
    res.status(500).json({ message: "Server error. Please raise to support" });
  }
});

app.post("/transferFunds", (req, res) => {
  const start = process.hrtime()

  const apiKey = req.header("Authorization");
  const fromAccountId = req.body.fromAccountId;
  const fromUsername = req.body.fromUsername;
  const toAccountId = req.body.toAccountId;
  const toUsername = req.body.toUsername;
  const amount = req.body.amount;

  // Check if body is complete
  if (!fromAccountId || !fromUsername || !toAccountId || !toUsername || !amount) {
    logger.warn(`${req.originalUrl} request has missing body parameters, accountId:${toAccountId}`)
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  // Process 1
  // Check if fromAccount has enough funds
  sqlQuery1 =
    "SELECT wallet FROM accounts where account_id = ?";
  db.query(sqlQuery1, [fromAccountId, toAccountId], (err, result1) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, accountId:${fromAccountId}, error:${err}`)
    } else if (result1[0].wallet < amount) {
      console.log(result1)
      logger.warn(`${req.originalUrl} request warning, requester does not have enough funds to transfer, from:${fromAccountId}`);
      res.status(409).json({
        message:
          "Requester doesn't have enough funds to continue with this transaction",
      });
      successful = false;
    } else {
      decreasedAmount = 0 - amount;
      newAmount = 0 + parseFloat(amount);
      // Process 2
      // Update the wallet for user and
      sqlQuery2 =
        "UPDATE accounts SET wallet=wallet+?, lastedit_date=NOW(), edited_by=? WHERE account_id=?;\nUPDATE accounts SET wallet=wallet+?, lastedit_date=NOW(), edited_by=? WHERE account_id=?";
      sqlQueryFormatted = db.format(sqlQuery2, [
        decreasedAmount,
        fromUsername,
        fromAccountId,
        newAmount,
        fromUsername,
        toAccountId,
      ]);

      db.query(sqlQueryFormatted, (err, result2) => {
        if (err) {
          logger.error(`${req.originalUrl} request has an error during process 2, error:${err}`)
          res.status(500).json({ message: "Server Error" });
        } else {
          // Process 3
          // Insert the transaction in the transactions table
          // From
          sqlGetUsername = `SELECT username FROM accounts WHERE account_id = ${toAccountId}`
          db.query(sqlGetUsername, (err, resultUsernameTo) => {
            sqlQuery3 =
            "INSERT INTO transactions (description, account_id, transaction_type, amount, status, placement_date, settled_date, settled_by, cummulative) VALUES (?, ?, 4, ?, 1, NOW(), NOW(), ?, (SELECT wallet FROM accounts where account_id = ?)); ";
          db.query(
            sqlQuery3,
            [
              "Transfer funds to: " + resultUsernameTo[0].username,
              fromAccountId,
              amount,
              fromUsername,
              fromAccountId,
            ],
            (err, result3) => {
              if (err) {
                logger.error(`${req.originalUrl} request has an error during process 3, error:${err}`)
                successful = false;
              } else {
                logger.info(`${req.originalUrl} request has been inserted into transactions, from:${fromAccountId} transactionId:${result3.insertId}`)
              }
            }
          );
          })




          // Process 4
          // Insert the transaction in the transactions table
          // To
          sqlGetUsernameFrom = `SELECT username FROM accounts WHERE account_id = ${fromAccountId}`
          db.query(sqlGetUsernameFrom, (err, resultFrom) => {
            sqlQuery4 =
            "INSERT INTO transactions (description, account_id, transaction_type, amount, status, placement_date, settled_date, settled_by, cummulative) VALUES (?, ?, 5, ?, 1, NOW(), NOW(), ?, (SELECT wallet FROM accounts where account_id = ?)); ";
          db.query(
            sqlQuery4,
            [
              "Fund Increase from: " + resultFrom[0].username,
              toAccountId,
              amount,
              fromUsername,
              toAccountId,
            ],
            (err, result4) => {
              if (err) {
                logger.error(`${req.originalUrl} request has an error during process 4, error:${err}`)
                successful = false;
              } else {
                logger.info(`${req.originalUrl} request has been inserted into transactions, to:${toAccountId} transactionId:${result4.insertId}`)
              }
            }
          );
          })

          logger.info(`${req.originalUrl} request completed, duration:${getDurationInMilliseconds(start)}`)
          res.status(200).json({ message: "Fund transfer successful" });
        }
      });
    }
  });
});


app.post("/deductWallet", (req, res) => {
  const start = process.hrtime()
  
  const apiKey = req.header("Authorization");
  const deductedUsername = req.body.deductedUsername;
  const deductedAccountId = req.body.deductedAccountId;
  const deductorUsername = req.body.deductorUsername;
  const deductorAccountId = req.body.deductorAccountId;
  const amount = req.body.amount;

  // Check if body is complete
  if (!deductedUsername || !deductedAccountId || !deductorUsername || !deductorAccountId || !amount){
    console.log(deductedAccountId, deductedUsername, deductorAccountId, deductorUsername, deductedWallet, deductorWallet, amount)
    logger.warn(`${req.originalUrl} request has missing body parameters`)
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  // Check if deductedAccount has enough funds
  sqlQuery1 = "SELECT wallet FROM accounts where account_id = ?";
  db.query(sqlQuery1, [deductedAccountId], (err, result1) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, accountId:${deductedAccountId}, error:${err}`)
    } else if (parseFloat(result1[0].wallet) < parseFloat(amount)){
      logger.warn(`${req.originalUrl} request warning. Account does not have enough wallet balance to deduct from. accountId:${deductedAccountId} wallet:${result1[0].wallet} amount:${amount}`)
      res.status(409).json({message: "Account does not have enough funds to deduct from" });
    }else{

      // Process 2: Deduct Wallet From Account and Increase Wallet to User
      sqlQuery2 = "UPDATE accounts SET wallet=wallet-?, lastedit_date=NOW(), edited_by=? WHERE account_id=?;\n UPDATE accounts SET wallet=wallet+?, lastedit_date=NOW(), edited_by=? WHERE account_id=?"
      sqlQuery2Formatted = db.format(sqlQuery2, [parseFloat(amount), deductorUsername, deductedAccountId, parseFloat(amount), deductedUsername, deductorAccountId])
      console.log(sqlQuery2Formatted)
      db.query(sqlQuery2Formatted, (err, result2) => {
        if (err) {
          logger.error(`${req.originalUrl} request has an error during process 2, error:${err}`)
          res.status(500).json({ message: "Server Error" });
        } else {
          logger.info(`${req.originalUrl} request, wallets updated for deductedAccountId:${deductedAccountId} deductorAccountId:${deductorAccountId}`)

          // Process 3 Insert into transactions for deductedId
          deductedDescription = `Funds deducted by ${deductorUsername}`
          sqlQuery3 = "INSERT INTO transactions (description, account_id, transaction_type, amount, status, placement_date, settled_date, settled_by, cummulative) VALUES (?, ?, 9, ?, 1, NOW(), NOW(), ?, (SELECT wallet FROM accounts WHERE account_id =?));";
          db.query(sqlQuery3, [deductedDescription, deductedAccountId, amount, deductorUsername, deductedAccountId], (err, result3) => {
            if (err) {
              logger.error(`${req.originalUrl} request has an error during process 3, error:${err}`)
            } else {
              logger.info(`${req.originalUrl} request has been inserted into transactions, from:${deductedAccountId} transactionId:${result3.insertId}`)
            }
          })

          // Process 4 Insert into transactions for deductorAccountId
          deductorDescription = `Funds increase via wallet deduction on ${deductedUsername}`
          sqlQuery4 = "INSERT INTO transactions (description, account_id, transaction_type, amount, status, placement_date, settled_date, settled_by, cummulative) VALUES (?, ?, 10, ?, 1, NOW(), NOW(), ?, (SELECT wallet FROM accounts WHERE account_id =?));";
          db.query(sqlQuery4, [deductorDescription, deductorAccountId, amount, deductorUsername, deductorAccountId], (err, result4) => {
            if (err) {
              logger.error(`${req.originalUrl} request has an error during process 4, error:${err}`)
            } else {
              logger.info(`${req.originalUrl} request has been inserted into transactions, tp:${deductorAccountId} transactionId:${result4.insertId}`)
            }
          })

          logger.info(`${req.originalUrl} request completed, duration:${getDurationInMilliseconds(start)}`)
          res.status(200).json({ message: "Fund deduction successful" });
        }

      })
    }
  })
})

app.get("/getUnsettledRequest/:accountId/:accountType/:transactionType",(req, res) => {
    const start = process.hrtime();

    const apiKey = req.header("Authorization");
    const accountId = req.params.accountId;
    const accountType = req.params.accountType;
    const transactionType = req.params.transactionType;

    // Check if body is complete
    if (!accountType || !accountId || !transactionType) {
      logger.warn(`${req.originalUrl} request has missing body parameters, accountId:${accountId}`)
      res.status(400).json({ message: "Missing body parameters" });
      return;
    }

    // Check if apiKey is correct
    if (!apiKey || apiKey !== process.env.API_KEY) {
      logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`);
      res.status(401).json({ message: "Unauthorized Request" });
      return;
    }

    sqlQuery = "SELECT tr.transaction_id, ac.account_id,  tr.description, ac.username, ac.phone_num, ac.account_type, tr.amount, tr.placement_date FROM transactions tr JOIN accounts ac on tr.account_id=ac.account_id WHERE tr.transaction_type = ? and tr.status = 0 and ac.account_id in (select account_id from accounts where agent_id = ?);";
    sqlQuery = db.format(sqlQuery, [transactionType, accountId]);
    
    // sqlQuery = "";
    // // Create SQL query depending on the accountType
    // if (accountType === "0") {
    //   // Administrator
    //   sqlQuery =
    //     "SELECT tr.transaction_id, ac.account_id, ac.username, ac.phone_num, ac.account_type, tr.amount, tr.placement_date FROM transactions tr JOIN accounts ac on tr.account_id=ac.account_id WHERE tr.transaction_type=? and tr.status=0;";
    //   sqlQuery = db.format(sqlQuery, [transactionType]);
    // } else if (accountType === "1") {
    //   // Master Agent
    //   sqlQuery =
    //     "SELECT tr.transaction_id, ac.account_id,  tr.description, ac.username, ac.phone_num, ac.account_type, tr.amount, tr.placement_date FROM transactions tr JOIN accounts ac on tr.account_id=ac.account_id WHERE tr.transaction_type = ? and tr.status = 0 and ac.account_id in (select account_id from accounts where agent_id = ? OR agent_id in (SELECT account_id from accounts where agent_id = ?));";
    //   sqlQuery = db.format(sqlQuery, [transactionType, accountId, accountId]);
    // } else if (accountType === "2") {
    //   // Agent Agent
    //   sqlQuery =
    //     "SELECT tr.transaction_id, ac.account_id,  tr.description, ac.username, ac.phone_num, ac.account_type, tr.amount, tr.placement_date FROM transactions tr JOIN accounts ac on tr.account_id=ac.account_id WHERE tr.transaction_type = ? and tr.status = 0 and ac.account_id in (select account_id from accounts where agent_id = ?);";
    //   sqlQuery = db.format(sqlQuery, [transactionType, accountId]);
    // }

    if (sqlQuery !== "") {
      db.query(sqlQuery, (err, result) => {
        if (err) {
          logger.error(`${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`)
          res.status(500).json({message: "Error in Request"})
        } else {
          logger.info(`${req.originalUrl} request successful, accountId:${accountId} duration:${getDurationInMilliseconds(start)}`)
          res.status(200).json({ message: "Request Successful", data: result });
        }
      });
    } else {
      logger.warn(`${req.originalUrl} request warning, account is not authorized to request, accountId:${accountId}`)
      res
        .status(401)
        .json({ message: "User type is not authorized to ask this request" });
    }
  }
);

app.get("/getTransactionHistory/:accountId/:dateFrom/:dateTo", (req, res) => {
  const start = process.hrtime()

  const apiKey = req.header("Authorization");
  const accountId = req.params.accountId;
  const dateFrom = req.params.dateFrom;
  const dateTo = req.params.dateTo;

  // Check if body is complete
  if (!accountId) {
    logger.warn(`${req.originalUrl} request has missing body parameters, accountId:${accountId}`)
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  sqlQuery =
    "SELECT * from transactions WHERE account_id = ? AND placement_date BETWEEN ? AND ? ORDER BY placement_date DESC;";
  db.query(sqlQuery, [accountId, dateFrom, dateTo], (err, result) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`)
    } else {
      logger.info(`${req.originalUrl} request successful, accountId:${accountId} duration:${getDurationInMilliseconds(start)}`)
      res.status(200).json({ message: "Request Successful", data: result });
    }
  });
});


app.get("/getAllTransactionHistory/:accountId/:accountType/:dateFrom/:dateTo", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");
  const accountId = req.params.accountId;
  const accountType = req.params.accountType;
  const dateFrom = req.params.dateFrom;
  const dateTo = req.params.dateTo;

  // Check if body is complete
  if (!accountId || !accountType || !dateFrom || !dateTo) {
    logger.warn(`${req.originalUrl} request has missing body parameters, accountId:${accountId}`)
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  var sqlQuery = ""
  // Generate SQL Query
  if (accountType === "admin") {
    sqlQuery = "SELECT tr.placement_date, tr.transaction_id, tr.description, ac.username, tr.amount, tr.cummulative, tr.status, tr.settled_by, tr.transaction_type, ac.account_type from transactions tr LEFT JOIN accounts ac ON tr.account_id=ac.account_id WHERE tr.placement_date BETWEEN ? AND ? ORDER BY tr.placement_date DESC;"
    sqlQuery = db.format(sqlQuery, [dateFrom, dateTo])
  } else if (accountType === "grandmaster") {
    sqlQuery = `SELECT tr.placement_date, tr.transaction_id, tr.description, ac.username, ac.account_type, tr.amount, tr.cummulative, tr.transaction_type, tr.status, tr.settled_by FROM transactions tr LEFT JOIN accounts ac ON tr.account_id=ac.account_id WHERE ac.account_id IN
    (SELECT account_id FROM accounts WHERE agent_id = ?
    UNION
    SELECT account_id FROM accounts WHERE agent_id IN (SELECT account_id FROM accounts WHERE agent_id = ?)
    UNION
    SELECT account_id FROM accounts WHERE agent_id IN (SELECT account_id FROM accounts WHERE agent_id IN (SELECT account_id FROM accounts WHERE agent_id = ?))) AND placement_date BETWEEN ? AND ? ORDER BY tr.placement_date DESC;`
    sqlQuery = db.format(sqlQuery, [accountId, accountId, accountId, dateFrom, dateTo])
  } else if (accountType === "masteragent") {
    sqlQuery = `SELECT tr.placement_date, tr.transaction_id, tr.description, ac.username, ac.account_type, tr.amount, tr.transaction_type,  tr.cummulative, tr.status, tr.settled_by FROM transactions tr LEFT JOIN accounts ac ON tr.account_id=ac.account_id WHERE ac.account_id IN
    (SELECT account_id FROM accounts WHERE agent_id = ? OR agent_id IN (SELECT account_id FROM accounts WHERE agent_id = ?)) AND placement_date BETWEEN ? AND ? ORDER BY tr.placement_date DESC;`
    sqlQuery = db.format(sqlQuery, [accountId, accountId, dateFrom, dateTo])
  } else if (accountType === "agent") {
    sqlQuery = `SELECT tr.placement_date, tr.transaction_id, tr.description, ac.username, ac.account_type, tr.transaction_type,  tr.amount, tr.cummulative, tr.status, tr.settled_by FROM transactions tr LEFT JOIN accounts ac ON tr.account_id=ac.account_id WHERE ac.account_id IN
    (SELECT account_id FROM accounts WHERE agent_id = ?) AND placement_date BETWEEN ? AND ? ORDER BY tr.placement_date DESC;`
    sqlQuery = db.format(sqlQuery, [accountId, dateFrom, dateTo])
  }

  if (sqlQuery !== "") {
    db.query(sqlQuery, (err, result) => {
      if (err) {
        logger.error(
          `${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`
        );
      } else {
        logger.info(
          `${
            req.originalUrl
          } request successful, accountId:${accountId} duration:${getDurationInMilliseconds(
            start
          )}`
        );
        res.status(200).json({ message: "Request Successful", data: result });
      }
    });
  } else {
    logger.warn(
      `${req.originalUrl} request warning, account is not allowed to request the accountType, accountId:${accountId} accountType:${accountType}`
    );
    res
      .status(401)
      .json({ message: "User type is not authorized to ask this request" });
  }

})




app.get("/getBetCommissionEarnings/:dateFrom/:dateTo", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");
  const dateFrom = req.params.dateFrom;
  const dateTo = req.params.dateTo;

  var stake = 0
  var winnings = 0
  var commissions = 0

  // Check if body is complete
  if (!dateFrom || !dateTo) {
    logger.warn(`${req.originalUrl} request has missing body parameters, accountId:${accountId}`)
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  sqlQuery =
    "SELECT SUM(stake) as stake, SUM(winnings) as winnings from bets where placement_date AND placement_date BETWEEN ? AND ?;";
  db.query(sqlQuery, [dateFrom, dateTo], (err, result) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, error:${err}`)
    } else {
      // res.status(200).json({ message: "Request Successful", data: result });
      stake = result[0].stake
      winnings = result[0].winnings

      sqlQuery2 = "SELECT SUM(amount) as commission from transactions where  placement_date BETWEEN ? AND ? AND transaction_type = 6;";
      db.query(sqlQuery2, [dateFrom, dateTo], (err, result2) => {
      if (err) {
        logger.error(`${req.originalUrl} request has an error during process 2, error:${err}`)
      } else {
        commissions = result2[0].commission
        logger.info(`${req.originalUrl} request successful, duration:${getDurationInMilliseconds(start)}`)
        res.status(200).json({ message: "Request Successful", data: {stake: stake, winnings: winnings, commissions: commissions} });        
      }
      })
    }
  });
});

app.get("/getTotalCommissions/:accountId", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");
  const accountId = req.params.accountId;

    // Check if body is complete
    if (!accountId) {
      logger.warn(`${req.originalUrl} request has missing body parameters, accountId:${accountId}`)
      res.status(400).json({ message: "Missing body parameters" });
      return;
    }
  
    // Check if apiKey is correct
    if (!apiKey || apiKey !== process.env.API_KEY) {
      logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`);
      res.status(401).json({ message: "Unauthorized Request" });
      return;
    }

    sqlQuery = "SELECT SUM(amount) AS total FROM transactions WHERE account_id = ? AND transaction_type=6;"
    db.query(sqlQuery, [accountId], (err, result) => {
      if (err) {
        logger.error(`${req.originalUrl} request has an error during process 1, error:${err}`)
        res.status(500).json({message: "Server error"})
      } else {
          total = result[0].total === null ? 0 : result[0].total
          logger.info(`${req.originalUrl} request successful, duration:${getDurationInMilliseconds(start)}`)
          res.status(200).json({ message: "Request Successful", data: {accountId: accountId, total: total} });        
      }
    })
})


app.get("/getTransactionsFeed/:previousDate", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");
  const previousDate = req.params.previousDate;

    // Check if body is complete
    if (!previousDate) {
      logger.warn(`${req.originalUrl} request has missing body parameters, accountId:${accountId}`)
      res.status(400).json({ message: "Missing body parameters" });
      return;
    }
  
    // Check if apiKey is correct
    if (!apiKey || apiKey !== process.env.API_KEY) {
      logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`);
      res.status(401).json({ message: "Unauthorized Request" });
      return;
    }

    sqlQuery = "SELECT * FROM transactions WHERE placement_date >= ? - INTERVAL 1 day ORDER BY placement_date DESC LIMIT 15 "
    db.query(sqlQuery, [previousDate], (err, result) => {
      if (err) {
        logger.error(`${req.originalUrl} request has an error during process 1, error:${err}`)
        res.status(500).json({message: "Server error"})
      } else {
        logger.info(`${req.originalUrl} request successful, duration:${getDurationInMilliseconds(start)}`)
        res.status(200).json({ message: "Request Successful", transactions: result});        
      }
    })
})

app.get("/getBetsFeed/:previousDate", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");
  const previousDate = req.params.previousDate;

    // Check if body is complete
    if (!previousDate) {
      logger.warn(`${req.originalUrl} request has missing body parameters, accountId:${accountId}`)
      res.status(400).json({ message: "Missing body parameters" });
      return;
    }
  
    // Check if apiKey is correct
    if (!apiKey || apiKey !== process.env.API_KEY) {
      logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`);
      res.status(401).json({ message: "Unauthorized Request" });
      return;
    }

    sqlQuery = "SELECT * FROM bets WHERE placement_date >= ? - INTERVAL 1 day ORDER BY placement_date DESC LIMIT 15 "
    db.query(sqlQuery, [previousDate], (err, result) => {
      if (err) {
        logger.error(`${req.originalUrl} request has an error during process 1, error:${err}`)
        res.status(500).json({message: "Server error"})
      } else {
        logger.info(`${req.originalUrl} request successful, duration:${getDurationInMilliseconds(start)}`)
        res.status(200).json({ message: "Request Successful", transactions: result});        
      }
    })
})


app.listen(4006, () => {
  console.log("Backend Bank Manager listentning at port 4006");
});
