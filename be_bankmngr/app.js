//jshint esversion: 6
const { application } = require("express");
const express = require("express");
const mysql = require("mysql");
const { createLogger, transports, format } = require("winston");
const helmet = require("helmet");
const cors = require("cors");
require("dotenv").config();

// Configure Express Application
const app = express();
app.use(express.json());
app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true }));

// Configure Winston Logging
// For this environment it sends to console first
const logger = createLogger({
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DDTHH:mm:ss.ms" }),
    format.printf(
      (info) =>
        `${JSON.stringify({
          timestamp: info.timestamp,
          level: info.level,
          message: info.message,
        })}`
    )
  ),
  transports: [new transports.Console()],
});

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
  const apiKey = req.header("Authorization");
  const accountId = req.body.accountId;
  const amount = req.body.amount;
  console.log(accountId, amount);

  // Check if body is complete
  if (!accountId || !amount) {
    logger.warn("requestDeposit request has missing body parameters");
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn("requestDeposit request has missing/wrong API_KEY");
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
      logger.error(
        "Process 1: Error in requestDeposit request. for accountId:" +
          accountId +
          " " +
          err
      );
      res.status(500).json({ message: "Server error" });
    } else if (result.affectedRows <= 0) {
      logger.warn(
        "Warn in requestDeposit request, request not successful for accountId:" +
          accountId
      );
      res.status(409).json({ message: "Deposit request no successful" });
    } else {
      logger.info(
        "Successful requestDeposit request from accountId:" +
          accountId +
          " amount:" +
          amount
      );
      res.status(200).json({
        message: "Deposit Request Successful",
        data: { transactionId: result.insertId },
      });
    }
  });
});

app.post("/acceptDeposit", (req, res) => {
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
    logger.warn("acceptDeposit request has missing body parameters");
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn("acceptDeposit request has missing/wrong API_KEY");
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  var successful = true;
  // Process 1
  // Check current status from transactions
  sqlQuery1 = "SELECT status FROM transactions WHERE transaction_id = ?";
  db.query(sqlQuery1, [transactionId], (err, result1) => {
    if (err) {
      logger.error(
        "Error in acceptDeposit request for transactionId:" +
          transactionId +
          " " +
          err
      );
      res.status(500).json({ message: "Server error" });
    } else if (result1.length <= 0) {
      logger.warn(
        "Warn in accept deposit. Transaction id not found, transactionId: " +
          transactionId
      );
      res.status(409).json({
        message: "Transaction ID cannot be found",
        data: { transactionId: transactionId },
      });
    } else if (result1[0].status != 0) {
      logger.warn(
        "Warn in accept deposit. Transaction is already settled, transactionId: " +
          transactionId
      );
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
          logger.error(
            "Error in acceptDeposit request for transactionId:" +
              transactionId +
              " " +
              err
          );
        } else if (result2.length <= 0) {
          logger.warn(
            "Warn in accept deposit. accepter account_id not found, accountId: " +
              accepterAccountId
          );
          res.status(409).json({ message: "Accepter account_id not found" });
          successful = false;
        } else if (result2[0].wallet < amount) {
          logger.warn(
            "Warn in accept deposit. accepter does not have enough funds to process transaction, transactionId:" +
              transactionId
          );
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
                logger.error(
                  "Process 3: Error in acceptDeposit request for transactionId:" +
                    transactionId +
                    " " +
                    err
                );
                successful = false;
              } else if (result3.affectedRows <= 0) {
                logger.warn(
                  "Warn in acceptDeposit request during increasing requester wallet, request not found, transactionId:" +
                    transactionId
                );
                successful = false;
              } else {
                logger.info(
                  "Increased requester account wallet thru acceptDeposit request, transactionId:" +
                    transactionId
                );

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
                      logger.error(
                        "Process 4: Error in acceptDeposit request for transactionId:" +
                          transactionId +
                          " " +
                          err
                      );
                      successful = false;
                    } else if (result4.affectedRows <= 0) {
                      logger.warn(
                        "Warn in acceptDeposit request during decreasing accepter wallet, accepter not found, transactionId:" +
                          transactionId
                      );
                      successful = false;
                    } else {
                      logger.info(
                        "Decreased accepter account wallet thru acceptDeposit request, transactionId:" +
                          transactionId
                      );

                      // Process 5
                      // Insert acceptDeposit to the transactions table
                      sqlQuery5 =
                        "INSERT INTO transactions (description, account_id, transaction_type, amount, status, placement_date, settled_date, settled_by, cummulative) VALUES (?, ?, 1, ?, 1, NOW(), NOW(), ?, (SELECT wallet FROM accounts where account_id = ?)); ";
                      db.query(
                        sqlQuery5,
                        [
                          "Accept Deposit - " + accountId + ":" + transactionId,
                          accepterAccountId,
                          amount,
                          accepterUsername,
                          accepterAccountId,
                        ],
                        (err, result5) => {
                          if (err) {
                            logger.error(
                              "Process 5: Error in acceptDeposit request for transactionId:" +
                                transactionId +
                                " " +
                                err
                            );
                            successful = false;
                          } else {
                            logger.info(
                              "Inserted transactions table for acceptedDeposited Request, transactionId:" +
                                transactionId +
                                " inserted transactionId:" +
                                result5.insertId
                            );
                          }
                        }
                      );
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
                      logger.error(
                        "Process 6: Error in acceptDeposit request for transactionId:" +
                          transactionId +
                          " " +
                          err
                      );
                      successful = false;
                    } else {
                      logger.info(
                        "Updated transactions table for acceptedDeposited Request, transactionId:" +
                          transactionId
                      );
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
  const apiKey = req.header("Authorization");
  const accountId = req.body.accountId;
  const amount = req.body.amount;

  // Check if body is complete
  if (!accountId || !amount) {
    logger.warn("requestWithdrawal request has missing body parameters");
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn("requestWithdrawal request has missing/wrong API_KEY");
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
      logger.error(
        "Process 1: Error in requestWithdrawal request. for accountId:" +
          accountId +
          " " +
          err
      );
      res.status(500).json({ message: "Server error" });
    } else if (result.affectedRows <= 0) {
      logger.warn(
        "Warn in requestWithdrawal request, request not successful for accountId:" +
          accountId
      );
      res.status(409).json({ message: "Withdrawal request not successful" });
    } else {
      logger.info(
        "Successful requestWithdrawal request from accountId:" +
          accountId +
          " amount:" +
          amount
      );
      res.status(200).json({
        message: "Withdrawal Request Successful",
        data: { transactionId: result.insertId },
      });
    }
  });
});

app.post("/acceptWithdrawal", (req, res) => {
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
    logger.warn("acceptWithdrawal request has missing body parameters");
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn("acceptWithdrawal request has missing/wrong API_KEY");
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  var successful = true;
  // Process 1
  // Check current status from transactions
  sqlQuery1 = "SELECT status FROM transactions WHERE transaction_id = ?";
  db.query(sqlQuery1, [transactionId], (err, result1) => {
    if (err) {
      logger.error(
        "Error in acceptWithdrawal request for transactionId:" +
          transactionId +
          " " +
          err
      );
      res.status(500).json({ message: "Server error" });
    } else if (result1.length <= 0) {
      logger.warn(
        "Warn in accept withdrawal. Transaction id not found, transactionId: " +
          transactionId
      );
      res.status(409).json({
        message: "Transaction ID cannot be found",
        data: { transactionId: transactionId },
      });
    } else if (result1[0].status != 0) {
      logger.warn(
        "Warn in accept withdrawal. Transaction is already settled, transactionId: " +
          transactionId
      );
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
          logger.error(
            "Error in acceptWithdrawal request for transactionId:" +
              transactionId +
              " " +
              err
          );
        } else if (result2.length <= 0) {
          logger.warn(
            "Warn in accept withdrawal. requester account_id not found, accountId: " +
              accepterAccountId
          );
          res.status(409).json({ message: "Requester account_id not found" });
          successful = false;
        } else if (result2[0].wallet < amount) {
          logger.warn(
            "Warn in accept withdrawal. Requester does not have enough funds to process transaction, transactionId:" +
              transactionId
          );
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
                logger.error(
                  "Process 3: Error in acceptWithdrawal request for transactionId:" +
                    transactionId +
                    " " +
                    err
                );
                successful = false;
              } else if (result3.affectedRows <= 0) {
                logger.warn(
                  "Warn in acceptWithdrawal request during decreasing requester wallet, request not found, transactionId:" +
                    transactionId
                );
                successful = false;
              } else {
                logger.info(
                  "Decreased requester account wallet thru acceptWithdrawal request, transactionId:" +
                    transactionId
                );

                // Process 4
                // Increase Accepter Wallet
                sqlQuery4 =
                  "UPDATE accounts SET wallet=wallet+?, lastedit_date=NOW(), edited_by=? WHERE account_id=?";
                db.query(
                  sqlQuery4,
                  [amount, accepterUsername, accepterAccountId],
                  (err, result4) => {
                    if (err) {
                      logger.error(
                        "Process 4: Error in acceptWithdrawal request for transactionId:" +
                          transactionId +
                          " " +
                          err
                      );
                      successful = false;
                    } else if (result4.affectedRows <= 0) {
                      logger.warn(
                        "Warn in acceptWithdrawal request during increasing accepter wallet, accepter not found, transactionId:" +
                          transactionId
                      );
                      successful = false;
                    } else {
                      logger.info(
                        "Increased accepter account wallet thru acceptWithdrawal request, transactionId:" +
                          transactionId
                      );

                      // Process 5
                      // Insert acceptWithdrawal to the transactions table
                      sqlQuery5 =
                        "INSERT INTO transactions (description, account_id, transaction_type, amount, status, placement_date, settled_date, settled_by, cummulative) VALUES (?, ?, 3, ?, 1, NOW(), NOW(), ?, (SELECT wallet FROM accounts where account_id = ?)); ";
                      db.query(
                        sqlQuery5,
                        [
                          "Accept Withdrawal - " +
                            accountId +
                            ":" +
                            transactionId,
                          accepterAccountId,
                          amount,
                          accepterUsername,
                          accepterAccountId,
                        ],
                        (err, result5) => {
                          if (err) {
                            logger.error(
                              "Process 5: Error in acceptWithdrawal request for transactionId:" +
                                transactionId +
                                " " +
                                err
                            );
                            successful = false;
                          } else {
                            logger.info(
                              "Inserted transactions table for acceptWithdrawal Request, transactionId:" +
                                transactionId +
                                " inserted transactionId:" +
                                result5.insertId
                            );
                          }
                        }
                      );
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
                      logger.error(
                        "Process 6: Error in acceptWithdrawal request for transactionId:" +
                          transactionId +
                          " " +
                          err
                      );
                      successful = false;
                    } else {
                      logger.info(
                        "Updated transactions table for acceptWithdrawal Request, transactionId:" +
                          transactionId
                      );
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
  const apiKey = req.header("Authorization");
  const fromAccountId = req.body.fromAccountId;
  const fromUsername = req.body.fromUsername;
  const toAccountId = req.body.toAccountId;
  const toUsername = req.body.toUsername;
  const amount = req.body.amount;
  console.log(apiKey);
  // Check if body is complete
  if (
    !fromAccountId ||
    !fromUsername ||
    !amount ||
    !toUsername ||
    !toAccountId
  ) {
    logger.warn("transferFunds request has missing body parameters");
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn("transferFunds request has missing/wrong API_KEY");
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  // Process 1
  // Check if fromAccount has enough funds
  sqlQuery1 =
    "SELECT wallet FROM accounts where account_id = ? OR account_id = ? ORDER BY account_type ASC";
  db.query(sqlQuery1, [fromAccountId, toAccountId], (err, result1) => {
    if (err) {
      logger.error(
        " Process 1: Error in transferFunds request from accountId:" +
          fromAccountId
      );
    } else if (result1.length <= 1) {
      logger.warn(
        "Warn in transfer funds. Accounts not found, accountIds:" +
          fromAccountId +
          "," +
          toAccountId
      );
      res.status(409).json({ message: "Requester account_id not found" });
      successful = false;
    } else if (result1[0].wallet < amount) {
      logger.warn(
        "Warn in transfer funds. Requester does not have enough funds to process transfer of amount:" +
          amount +
          ". Requester accountId:" +
          fromAccountId
      );
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
      console.log(sqlQueryFormatted);
      db.query(sqlQueryFormatted, (err, result2) => {
        if (err) {
          logger.error(
            "Process 2: Error in transferFunds request from accountId:" +
              fromAccountId +
              err
          );
          res.status(500).json({ message: "Server Error" });
        } else {
          // Process 3
          // Insert the transaction in the transactions table
          // From
          sqlQuery3 =
            "INSERT INTO transactions (description, account_id, transaction_type, amount, status, placement_date, settled_date, settled_by, cummulative) VALUES (?, ?, 4, ?, 1, NOW(), NOW(), ?, (SELECT wallet FROM accounts where account_id = ?)); ";
          db.query(
            sqlQuery3,
            [
              "Transfer funds to: " + toAccountId,
              fromAccountId,
              amount,
              fromUsername,
              fromAccountId,
            ],
            (err, result3) => {
              if (err) {
                logger.error(
                  "Process 3: Error in transferFunds request from accountId:" +
                    fromAccountId
                );
                successful = false;
              } else {
                logger.info(
                  "Inserted transactions table for transferFunds Request,  inserted transactionId:" +
                    result3.insertId
                );
              }
            }
          );

          // Process 4
          // Insert the transaction in the transactions table
          // To
          sqlQuery4 =
            "INSERT INTO transactions (description, account_id, transaction_type, amount, status, placement_date, settled_date, settled_by, cummulative) VALUES (?, ?, 5, ?, 1, NOW(), NOW(), ?, (SELECT wallet FROM accounts where account_id = ?)); ";
          db.query(
            sqlQuery4,
            [
              "Fund Increase from: " + fromAccountId,
              toAccountId,
              amount,
              fromUsername,
              toAccountId,
            ],
            (err, result4) => {
              if (err) {
                logger.error(
                  "Process 4: Error in transferFunds request from accountId:" +
                    fromAccountId
                );
                successful = false;
              } else {
                logger.info(
                  "Inserted transactions table for transferFunds Request,  inserted transactionId:" +
                    result4.insertId
                );
              }
            }
          );

          res.status(200).json({ message: "Fund transfer successful" });
        }
      });
    }
  });
});

app.get(
  "/getUnsettledRequest/:accountId/:accountType/:transactionType",
  (req, res) => {
    const apiKey = req.header("Authorization");
    const accountId = req.params.accountId;
    const accountType = req.params.accountType;
    const transactionType = req.params.transactionType;

    // Check if body is complete
    if (!accountType || !accountId || !transactionType) {
      logger.warn("transferFunds request has missing body parameters");
      res.status(400).json({ message: "Missing body parameters" });
      return;
    }

    // Check if apiKey is correct
    if (!apiKey || apiKey !== process.env.API_KEY) {
      logger.warn("transferFunds request has missing/wrong API_KEY");
      res.status(401).json({ message: "Unauthorized Request" });
      return;
    }

    sqlQuery = "";
    // Create SQL query depending on the accountType
    if (accountType === "0") {
      // Administrator
      sqlQuery =
        "SELECT tr.transaction_id, ac.account_id, ac.username, ac.phone_num, ac.account_type, tr.amount, tr.placement_date FROM transactions tr JOIN accounts ac on tr.account_id=ac.account_id WHERE tr.transaction_type=? and tr.status=0;";
      sqlQuery = db.format(sqlQuery, [transactionType]);
      console.log(sqlQuery);
    } else if (accountType === "1") {
      // Master Agent
      sqlQuery =
        "SELECT tr.transaction_id, ac.account_id,  tr.description, ac.username, ac.phone_num, ac.account_type, tr.amount, tr.placement_date FROM transactions tr JOIN accounts ac on tr.account_id=ac.account_id WHERE tr.transaction_type = ? and tr.status = 0 and ac.account_id in (select account_id from accounts where agent_id = ? OR agent_id in (SELECT account_id from accounts where agent_id = ?));";
      sqlQuery = db.format(sqlQuery, [transactionType, accountId, accountId]);
      console.log(sqlQuery);
    } else if (accountType === "2") {
      // Agent Agent
      sqlQuery =
        "SELECT tr.transaction_id, ac.account_id,  tr.description, ac.username, ac.phone_num, ac.account_type, tr.amount, tr.placement_date FROM transactions tr JOIN accounts ac on tr.account_id=ac.account_id WHERE tr.transaction_type = ? and tr.status = 0 and ac.account_id in (select account_id from accounts where agent_id = ?);";
      sqlQuery = db.format(sqlQuery, [transactionType, accountId]);
      console.log(sqlQuery);
    }

    if (sqlQuery !== "") {
      db.query(sqlQuery, (err, result) => {
        if (err) {
          logger.error(
            " Process 1: Error in getUnsettledRequest request from accountId:" +
              accountId
          );
        } else {
          res.status(200).json({ message: "Request Successful", data: result });
        }
      });
    } else {
      res
        .status(401)
        .json({ message: "User type is not authorized to ask this request" });
    }
  }
);

app.get("/getTransactionHistory/:accountId/:dateFrom/:dateTo", (req, res) => {
  const apiKey = req.header("Authorization");
  const accountId = req.params.accountId;
  const dateFrom = req.params.dateFrom;
  const dateTo = req.params.dateTo;

  // Check if body is complete
  if (!accountId) {
    logger.warn("transferFunds request has missing body parameters");
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn("transferFunds request has missing/wrong API_KEY");
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  sqlQuery =
    "SELECT * from transactions WHERE account_id = ? AND placement_date BETWEEN ? AND ?;";
  db.query(sqlQuery, [accountId, dateFrom, dateTo], (err, result) => {
    if (err) {
      logger.error(
        " Process 1: Error in getTransactionHistory request from accountId:" +
          accountId
      );
    } else {
      res.status(200).json({ message: "Request Successful", data: result });
    }
  });
});

app.listen(4006, () => {
  console.log("Backend Bank Manager listentning at port 4006");
});
