//jshint esversion: 6
const express = require("express");
const mysql = require("mysql");
const { createLogger, transports, format } = require("winston");
const io = require("socket.io-client");
const helmet = require("helmet");
const cors = require("cors");
const fs = require("fs");
const { parse } = require("querystring");

require("dotenv").config();

// Configure Express Application
const app = express();
app.use(express.json());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [process.env.FRONTEND],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// Configure websocket domain
const socket = io.connect("http://localhost:3010");

// Configure Winston Logging
// For this environment it sends to console first
// Configure Winston Logging
// For this environment it sends to console first
const logger = createLogger({
  format: format.combine(
    format.timestamp({ format: "MMM-DD-YYYY HH:mm:ss" }),
    format.printf(
      (info) =>
        `${info.timestamp} -- ${info.level.toUpperCase()} -- ${info.message}`
    )
  ),
  transports: [
    new transports.File({ filename: "/var/log/app/betmanager.log" }),
  ],
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

const getDurationInMilliseconds = (start) => {
  const NS_PER_SEC = 1e9;
  const NS_TO_MS = 1e6;
  const diff = process.hrtime(start);

  return `${((diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS).toFixed(2)}ms`;
};

db.connect((err) => {
  if (err) {
    console.log(err);
  }
});


function checkApiKey(reqApiKey) {
  if (reqApiKey !== process.env.API_KEY) {
    return false;
  } else {
    return true;
  }
}

async function checkIfWalletIsEnough(accountId, stake){
  return new Promise((resolve, reject) => {
    sqlQuery = "SELECT wallet FROM accounts WHERE account_id = ?"
    db.query(sqlQuery, [accountId], (err, result) => {
      if (err) {
        logger.error(`Error in checking wallet for accountId: ${accountId} error: ${err}`)
        return (reject(err.message))
      } else {
        const isWalletEnough = parseFloat(stake) < parseFloat(result[0].wallet)
        logger.info(`Wallet checked if stake is enough to cover the bet accountId:${accountId} wallet:${result[0].wallet} stake:${stake} isEnough:${isWalletEnough}`)
        return (resolve(isWalletEnough, result[0].wallet))
      }
    })
  })
}

async function checkIfMarketIsOpen(marketId){
  return new Promise((resolve, reject) => {
    sqlQuery = "SELECT status FROM markets WHERE market_id = ? ORDER BY lastedit_date DESC LIMIT 1"
    db.query(sqlQuery, [marketId], (err, result) => {
      if (err) {
        logger.error(`Error in fetching status for marketId: ${marketId} error: ${err}`)
        return (reject(err.message))
      } else {
        logger.info(`Fetched market status for marketId:${marketId}`)
        return (resolve(result))
      }
    })
  })
}

async function checkTotals(marketId, gameName, choice, choiceId){
  return new Promise((resolve, reject) => {
    sqlQuery = `SELECT REPLACE(description, '${gameName} : ', '') as color, SUM(stake) as total FROM bets where market_id = ? GROUP BY description;`;
    db.query(sqlQuery, [marketId], (err, result) => {
      if (err) {
        logger.error(`Error in fetching totals for choice: ${choice} error: ${err}`)
        return (reject(err.message))
      } else {
        var currentTotal = 0;

        if (result.length === 0){
          logger.info(`Successfully retrieved current BetTotals for choice:${choice} choiceId:${choiceId} marketId:${marketId} totalBet:${currentTotal}`)
          return (resolve(currentTotal))
        } else {
          for (let i = 0; i < result.length; i++) {
            console.log
            if (result[i].color.replace() === choice) {
              currentTotal = result[i].total;
              break
            }
          }
          logger.info(`Successfully retrieved current BetTotals for choice:${choice} choiceId:${choiceId} marketId:${marketId} totalBet:${currentTotal}`)
          return (resolve(currentTotal))
        }
      }
    })
  })
}


async function fetchManipulateValue(choiceId){
  return new Promise((resolve, reject) => {
    sqlQuery = `SELECT manipulate_val FROM choices WHERE choice_id = ?`;
    db.query(sqlQuery, [choiceId], (err, result) => {
      if (err) {
        logger.error(`Error in fetching manipulateValue for choice: ${choiceId} error: ${err}`)
        return (reject(err.message))
      } else {
        logger.info(`Fetched manipulate value for choice:${choiceId}`)
        return (resolve(result))
      }
    })
  })
}

async function decreasePlayerWallet(accountId, amount){
  return new Promise((resolve, reject) => {
    sqlQuery = `UPDATE accounts SET wallet = wallet - ? WHERE account_id = ?`;
    db.query(sqlQuery, [amount, accountId], (err, result) => {
      if (err) {
        logger.error(`Error in decreasing player wallet amount:${amount} accountId:${accountId} error: ${err}`)
        return (reject(err.message))
      } else {
        logger.info(`Decreased player wallet amount:${amount} accountId:${accountId}`)
        return (resolve(result))
      }
    })
  })
}

async function insertBetsTable(gameName, choice, marketId, gameId, accountId, stake){
  return new Promise((resolve, reject) => {
    const description = gameName + ' : ' + choice;

    sqlQuery = "INSERT INTO bets (description, market_id, game_id, account_id, stake, cummulative, status, placement_date) VALUES \
    (?,?,?,?,?, (SELECT wallet FROM accounts WHERE account_id = ?), ?, NOW())";
    db.query(sqlQuery, [description, marketId, gameId, accountId, stake, accountId, 0], (err, result) => {
      if (err) {
        logger.error(`Error in decreasing player wallet amount:${amount} accountId:${accountId} error: ${err}`)
        return (reject(err.message))
      } else {
        logger.info(`Inserted new bet in bets table betId:${result.insertId}`)
        return (resolve(result))
      }
    })
  })
}

async function retrieveAgentDetails(accountId){
  return new Promise((resolve, reject) => {
    sqlQuery ="SELECT account_id, commission, wallet FROM accounts WHERE account_id = (SELECT agent_id FROM accounts WHERE account_id = ?)";
    db.query(sqlQuery, [accountId], (err, result) => {
      if (err) {
        logger.error(`Error in fetching agent for playerAccount:${accountId} error: ${err}`)
        return (reject(err.message))
      } else {
        logger.info(`Fetched agent for playerId:${accountId} agentId:${result[0].account_id}`)
        return (resolve(result))
      }
    })
  })
}


async function retrieveMasterAgentDetails(accountId){
  return new Promise((resolve, reject) => {
    sqlQuery = "SELECT account_id, commission, wallet FROM accounts WHERE account_id = (SELECT agent_id FROM accounts WHERE account_id = (SELECT agent_id FROM accounts WHERE account_id = ?))";
    db.query(sqlQuery, [accountId], (err, result) => {
      if (err) {
        logger.error(`Error in fetching master agent for playerAccount:${accountId} error: ${err}`)
        return (reject(err.message))
      } else {
        logger.info(`Fetched master agent for playerId:${accountId} agentId:${result[0].account_id}`)
        return (resolve(result))
      }
    })
  })
}

async function retrieveGrandMasterDetails(accountId){
  return new Promise((resolve, reject) => {
    sqlQuery = "SELECT account_id, commission, wallet FROM accounts WHERE account_id IN (SELECT agent_id FROM accounts WHERE account_id IN (SELECT agent_id FROM accounts WHERE account_id IN (SELECT agent_id FROM accounts WHERE account_id = ?))) AND account_type = 5;";
    db.query(sqlQuery, [accountId], (err, result) => {
      if (err) {
        logger.error(`Error in fetching grand master for playerAccount:${accountId} error: ${err}`)
        return (reject(err.message))
      } else if (result.length === 0) {
        logger.info(`No Grand Master Account for player:${accountId}`)
        return (resolve(result))
      } else {
        logger.info(`Fetched grand master for playerId:${accountId} agentId:${result[0].account_id}`)
        return (resolve(result))
      }
    })
  })
}

async function increaseCommissionWallet(accountId, increaseValue, betId){
  return new Promise((resolve, reject) => {
    sqlQuery = `UPDATE accounts SET wallet = wallet + ? WHERE account_id = ?; SELECT wallet FROM accounts WHERE account_id = ?;`;
    db.query(sqlQuery, [increaseValue, accountId, accountId ], (err, result) => {
      if (err) {
        logger.error(`Error in increase account wallet amount:${increaseValue} accountId:${accountId} error: ${err}`)
        return (reject(err.message))
      } else {
        logger.info(`Increased account wallet amount:${increaseValue} accountId:${accountId} as commission for BetId:${betId} newWallet:${result[1][0].wallet}`)
        return (resolve(result))
      }
    })
  })
}

async function insertCommissionTransactions(accountId, betId, increaseValue, gameId){
  const description = "Commission from BetID: " + betId
  return new Promise((resolve, reject) => {
    sqlQuery = "INSERT INTO transactions (description, account_id, amount, cummulative, status, placement_date, transaction_type, game_id) VALUES (?,?,?,(SELECT wallet FROM accounts WHERE account_id = ?),1, NOW(), 6, ?)";    ;
    db.query(sqlQuery, [description, accountId, increaseValue, accountId, gameId], (err, result) => {
      if (err) {
        logger.error(`Error in increase account wallet amount:${increaseValue} accountId:${accountId} error: ${err}`)
        return (reject(err.message))
      } else {
        logger.info(`Commission sent successfully for account:${accountId} betId:${betId}`)
        return (resolve(result))
      }
    })
  })
}

async function sendAgentCommission(playerAccountId, betId, stake, gameId){
  // For Agent
  const agentAccount = await retrieveAgentDetails(playerAccountId)
  const increaseValue = (parseFloat(stake) * parseFloat(agentAccount[0].commission) / 100).toFixed(2)
  const increaseAgentViaCommission = await increaseCommissionWallet(agentAccount[0].account_id, increaseValue, betId)
  const insertCommissionInTransaction = await insertCommissionTransactions(agentAccount[0].account_id, betId, increaseValue, gameId)

  // For Master Agent
  const masterAgentAccount = await retrieveMasterAgentDetails(playerAccountId)
  const increaseValueMA = ((parseFloat(stake) * parseFloat(masterAgentAccount[0].commission) / 100) - increaseValue).toFixed(2)
  const increaseMasterAgentViaCommission = await increaseCommissionWallet(masterAgentAccount[0].account_id, increaseValueMA, betId)
  const insertCommissionInTransactionForMasterAgent = await insertCommissionTransactions(masterAgentAccount[0].account_id, betId, increaseValueMA, gameId)

  // For Grand Master
  const gmAccount = await retrieveGrandMasterDetails(playerAccountId)
  if (gmAccount.length !==0 ){
    const increaseValueGM = (parseFloat(stake) * parseFloat(gmAccount[0].commission) / 100).toFixed(2)
    const increseGMViaCommission = await increaseCommissionWallet(gmAccount[0].account_id, increaseValueGM, betId)
    const insertCommissionInTransactionForGM = await insertCommissionTransactions(gmAccount[0].account_id, betId, increaseValueGM, gameId)
  }
}


app.post("/placeBet", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");
  const marketId = req.body.marketId;
  const gameId = req.body.gameId;
  const accountId = req.body.accountId;
  const gameName = req.body.gameName;
  const choice = req.body.choice;
  const stake = req.body.stake;
  const maxBet = req.body.maxBet;

  // Check if body is complete
  if (
    !marketId ||
    !gameId ||
    !accountId ||
    !gameName ||
    !choice ||
    !stake
  ) {
    logger.warn(
      `${req.originalUrl} request has missing body parameters, accountId:${accountId}`
    );
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  console.log(apiKey, process.env.API_KEY);

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(
      `${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`
    );
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }


  // Process 0
  // Check if wallet is enough
  sqlQueryWallet = "SELECT wallet from accounts where account_id = ?"
  db.query(sqlQueryWallet, [accountId], (err, result0) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 0, accountId:${accountId}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else if (parseFloat(result0[0].wallet) < parseFloat(stake)) {
      logger.error(
        `${req.originalUrl} request has an error during process 0, accountId:${accountId}, wallet not enough error:${err}`
      );
      res.status(400).json({ message: "You do not have enough funds for this transaction"})
    } else {
        // Process 1
        // Check if market is still open
        wallet = result0[0].wallet
        sqlQuery =
        "SELECT status from markets WHERE game_id = ? AND market_id = ? ORDER BY LASTEDIT_DATE DESC LIMIT 1";
      db.query(sqlQuery, [gameId, marketId], (err, result1) => {
        if (err) {
          logger.error(
            `${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`
          );
          res.status(500).json({ message: "Server error" });
        } else if (result1.length <= 0) {
          logger.warn(
            `${req.originalUrl} request warning, market not found, marketId:${marketId} accountId:${accountId}`
          );
          res.status(409).json({ message: "Market not found" });
        } else if (result1[0].status !== 0) {
          logger.warn(
            `${req.originalUrl} request warning, market not not open, marketId:${marketId} accountId:${accountId}`
          );
          res.status(409).json({ message: "Market not open" });
        } else {
          // Check if bet is still okay. Process 7
          // Get the totals for the markets on the bets table
          sqlQuery = `SELECT REPLACE(description, '${gameName} - ', '') as color, SUM(stake) as total FROM bets where market_id = ? GROUP BY description;`;
          db.query(sqlQuery, [marketId], (err, resultTot) => {
            if (err) {
              logger.error(
                `${req.originalUrl} request has an error during process 7, marketId:${marketId} accountId:${accountId}, error:${err}`
              );
              res.status(500).json({ message: "Error in checking quota" });
            } else {
              var currentTotal = 0;
              for (let i = 0; i < resultTot.length; i++) {
                if (resultTot[i].color === choice) {
                  console.log(resultTot[i].total);
                  currentTotal = resultTot[i].total;
                }
              }

              // Process 8
              var supposedTotal = parseFloat(currentTotal) + parseFloat(stake);
              if (supposedTotal > parseFloat(maxBet)) {
                logger.warn(
                  `${req.originalUrl} request has an warning during process 8, bet is bigger than koto, marketId:${marketId} accountId:${accountId}, error:${err}`
                );
                res
                  .status(500)
                  .json({
                    message: `Stake is bigger than accepted koto, available bet amount is ${
                      parseFloat(maxBet) - parseFloat(currentTotal)
                    }`,
                  });
              } else {
                // Process 2
                // Decrease Player Wallet
                const cummulative = (wallet - stake).toFixed(2);
                sqlQuery = "UPDATE accounts SET wallet = wallet - ? WHERE account_id = ?";
                db.query(sqlQuery, [stake, accountId], (err, result2) => {
                  if (err) {
                    logger.error(
                      `${req.originalUrl} request has an error during process 2, marketId:${marketId} accountId:${accountId}, error:${err}`
                    );
                    res
                      .status(500)
                      .json({ message: "Error during managing player wallet" });
                  } else if (result2.affectedRows <= 0) {
                    logger.warn(
                      `${req.originalUrl} request warning, player account cannot be found, marketId:${marketId} accountId:${accountId}`
                    );
                    res
                      .status(409)
                      .json({
                        message:
                          "Bet not placed successfully. Please check accountId",
                      });
                  } else {
                    // Now that the player wallet has been decreased
                    // Process 3
                    // We insert the bet in the bets table
                    const description = gameName + " - " + choice;

                    sqlQuery =
                      "INSERT INTO bets (description, market_id, game_id, account_id, stake, cummulative, status, placement_date) VALUES (?,?,?,?,?,?,?,NOW())";
                    db.query(
                      sqlQuery,
                      [
                        description,
                        marketId,
                        gameId,
                        accountId,
                        stake,
                        cummulative,
                        0,
                      ],
                      (err, result3) => {
                        if (err) {
                          logger.error(
                            `${req.originalUrl} request has an error during process 3, marketId:${marketId} accountId:${accountId}, error:${err}`
                          );
                          res.status(500).json({ message: "Server error" });
                        } else if (result3.affectedRows <= 0) {
                          logger.warn(
                            `${req.originalUrl} request warning, bet not placed, marketId:${marketId} accountId:${accountId}`
                          );
                          res
                            .status(409)
                            .json({
                              message:
                                "Bet not placed successfully. Please try again",
                            });
                        } else {
                          const betId = result3.insertId;
                          logger.info(
                            `${req.originalUrl} request successful, bet placed successfully, marketId:${marketId} accountId:${accountId} betId:${betId}`
                          );
                          res
                            .status(200)
                            .json({
                              message: "Bet Placed successfully",
                              data: {
                                betId: betId,
                                description: description,
                                stake: stake,
                                cummulative: cummulative,
                              },
                            });

                          socketData = {
                            betId: betId,
                            accountId: accountId,
                            description: description,
                            stake: stake,
                            status: 0,
                            date: new Date(),
                          };
                          socket.emit("bet_placement", socketData);

                          // Adding the commissions to the transactions table for the agent and master_agent

                          // Process 4 Agent Part
                          sqlQueryAgent =
                            "SELECT account_id, commission, wallet FROM accounts WHERE account_id = (SELECT agent_id FROM accounts WHERE account_id = ?)";
                          db.query(
                            sqlQueryAgent,
                            [accountId],
                            (err, resultAgent) => {
                              if (err) {
                                logger.error(
                                  `${req.originalUrl} request has an error during process 4, marketId:${marketId} accountId:${accountId}, error:${err}`
                                );
                              } else if (resultAgent.length <= 0) {
                                logger.warn(
                                  `${req.originalUrl} request warning, no associated agent to give commission to, marketId:${marketId} accountId:${accountId}`
                                );
                              } else if (!resultAgent[0].commission) {
                                logger.warn(
                                  `${req.originalUrl} request warning, agent has no set commission, agent:${resultAgent[0].account_id} marketId:${marketId} accountId:${accountId}`
                                );
                              } else {
                                const agentCommission = parseFloat(
                                  parseFloat(stake / 100) *
                                    parseFloat(resultAgent[0].commission)
                                ).toFixed(2);
                                const agentCummulative = (
                                  parseFloat(resultAgent[0].wallet) +
                                  parseFloat(agentCommission)
                                ).toFixed(2);

                                // Process 5
                                // Increase Agent Wallet
                                sqlQueryAgent2 =
                                  "UPDATE accounts SET wallet = ? WHERE account_id = ?";
                                db.query(
                                  sqlQueryAgent2,
                                  [agentCummulative, resultAgent[0].account_id],
                                  (err, resultAgent2) => {
                                    if (err) {
                                      logger.error(
                                        `${req.originalUrl} request has an error during process 5, agent:${resultAgent[0].account_id} marketId:${marketId} accountId:${accountId}, error:${err}`
                                      );
                                    } else if (resultAgent2.affectedRows <= 0) {
                                      logger.warn(
                                        `${req.originalUrl} request warning, update was successful in increase agent wallet, agent:${resultAgent[0].account_id} marketId:${marketId} accountId:${accountId}`
                                      );
                                    } else {
                                      logger.info(
                                        `${req.originalUrl} request successful, agent commission was given, agent:${resultAgent[0].account_id} commission:${agentCommission} marketId:${marketId} accountId:${accountId} betId:${betId}`
                                      );

                                      // Process 6
                                      // Insert to transactions table
                                      transDescription =
                                        "Commission from BetId " + betId;
                                      sqlQueryAgent3 =
                                        "INSERT INTO transactions (description, account_id, amount, cummulative, status, placement_date, transaction_type, game_id) VALUES (?,?,?,?,1, NOW(), 6, ?)";
                                      db.query(
                                        sqlQueryAgent3,
                                        [
                                          transDescription,
                                          resultAgent[0].account_id,
                                          agentCommission,
                                          agentCummulative,
                                          gameId
                                        ],
                                        (err, resultAgent3) => {
                                          if (err) {
                                            logger.error(
                                              `${req.originalUrl} request has an error during process 6, agent:${resultAgent[0].account_id} marketId:${marketId} accountId:${accountId}, error:${err}`
                                            );
                                          } else if (
                                            resultAgent3.affectedRows <= 0
                                          ) {
                                            logger.warn(
                                              `${req.originalUrl} request warning, update was not successful in increase agent wallet, insert to transactions table, agent:${resultAgent[0].account_id} marketId:${marketId} accountId:${accountId}`
                                            );
                                          } else {
                                            logger.info(
                                              `${req.originalUrl} request successful, agent commission was inserted to transactions table, agent:${resultAgent[0].account_id} commission:${agentCommission} marketId:${marketId} accountId:${accountId} betId:${betId}`
                                            );
                                          }
                                        }
                                      );
                                    }
                                  }
                                );

                                //Process 7 Master Agent Part
                                sqlQueryMasterAgent =
                                  "SELECT account_id, commission, wallet FROM accounts WHERE account_id = (SELECT agent_id FROM accounts WHERE account_id = (SELECT agent_id FROM accounts WHERE account_id = ?))";
                                db.query(
                                  sqlQueryMasterAgent,
                                  [accountId],
                                  (err, resultMasterAgent) => {
                                    if (err) {
                                      logger.error(
                                        `${req.originalUrl} request has an error during process 7, marketId:${marketId} accountId:${accountId}, error:${err}`
                                      );
                                    } else if (resultMasterAgent.length <= 0) {
                                      logger.warn(
                                        `${req.originalUrl} request warning, no associated master agent to give commission to, marketId:${marketId} accountId:${accountId}`
                                      );
                                    } else if (!resultMasterAgent[0].commission) {
                                      logger.warn(
                                        `${req.originalUrl} request warning, master agent has no set commission, masterAgent:${resultMasterAgent[0].account_id} marketId:${marketId} accountId:${accountId}`
                                      );
                                    } else {
                                      const masterCommission =
                                        parseFloat(
                                          parseFloat(stake / 100) *
                                            parseFloat(
                                              resultMasterAgent[0].commission
                                            )
                                        ).toFixed(2) - agentCommission;
                                      const supposedMasterCommission =
                                        parseFloat(masterCommission) +
                                        parseFloat(agentCommission);
                                      // console.log(`Agent Commission: ${agentCommission} supposed MA ${supposedMasterCommission} final MA ${masterCommission}`)
                                      const masterCummulative = (
                                        parseFloat(resultMasterAgent[0].wallet) +
                                        parseFloat(masterCommission)
                                      ).toFixed(2);

                                      // Process 8
                                      // Increase Master Agent Wallet
                                      sqlQueryMasterAgent2 =
                                        "UPDATE accounts SET wallet = ? WHERE account_id = ?";
                                      db.query(
                                        sqlQueryMasterAgent2,
                                        [
                                          masterCummulative,
                                          resultMasterAgent[0].account_id,
                                        ],
                                        (err, resultMasterAgent2) => {
                                          if (err) {
                                            logger.error(
                                              `${req.originalUrl} request has an error during process 8, masterAgent:${resultMasterAgent[0].account_id} marketId:${marketId} accountId:${accountId}, error:${err}`
                                            );
                                          } else if (
                                            resultMasterAgent2.affectedRows <= 0
                                          ) {
                                            logger.warn(
                                              `${req.originalUrl} request warning, update was not successful in increasing master agent wallet, agent:${resultMasterAgent[0].account_id} marketId:${marketId} accountId:${accountId}`
                                            );
                                          } else {
                                            logger.info(
                                              `${req.originalUrl} request successful, master agentagent commission was given, agent:${resultMasterAgent[0].account_id} commission:${masterCommission} marketId:${marketId} accountId:${accountId} betId:${betId}`
                                            );

                                            // Process 9
                                            // Insert to transactions table
                                            transDescription2 =
                                              "Commission from BetId " + betId;
                                            sqlQueryMasterAgent3 =
                                              "INSERT INTO transactions (description, account_id, amount, cummulative, status, placement_date, transaction_type, game_id) VALUES (?,?,?,?,1, NOW(), 6, ?)";
                                            db.query(
                                              sqlQueryMasterAgent3,
                                              [
                                                transDescription2,
                                                resultMasterAgent[0].account_id,
                                                masterCommission,
                                                masterCummulative,
                                                gameId
                                              ],
                                              (err, resultMasterAgent3) => {
                                                if (err) {
                                                  logger.error(
                                                    `${req.originalUrl} request has an error during process 9, masterAgent:${resultMasterAgent[0].account_id} marketId:${marketId} accountId:${accountId}, error:${err}`
                                                  );
                                                } else if (
                                                  resultMasterAgent3.affectedRows <=
                                                  0
                                                ) {
                                                  logger.warn(
                                                    `${req.originalUrl} request warning, update was not successful in increase master agent, insert to transactions table, agent:${resultAgent[0].account_id} marketId:${marketId} accountId:${accountId}`
                                                  );
                                                } else {
                                                  logger.info(
                                                    `${req.originalUrl} request successful, agent commission was inserted to transactions table, masterAgent:${resultMasterAgent[0].account_id} commission:${masterCommission} marketId:${marketId} accountId:${accountId} betId:${betId}`
                                                  );
                                                }
                                              }
                                            );
                                          }
                                        }
                                      );
                                    }
                                  }
                                );
                              }
                            }
                          );
                        }
                      }
                    );
                  }
                });
              }
            }
          });
        }
      });

    }
  })



});

app.post("/sendGrandMasterCommission", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");
  const betId = req.body.betId;
  const gameId = req.body.gameId
  const playerId = req.body.playerId;
  const amount = req.body.amount;

  // Check if body is complete
  if (!betId || !playerId || !amount) {
    logger.warn(
      `${req.originalUrl} request has missing body parameters, marketId:${marketId}`
    );
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(
      `${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`
    );
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  //Process 1 Grand Master
  sqlQueryGM =
    "select account_id, commission, wallet from accounts where account_id in (select agent_id from accounts where account_id in (select agent_id from accounts where account_id in ( select agent_id from accounts where account_id = ?))) and account_type = 5;";
  db.query(sqlQueryGM, [playerId], (err, resultGM) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, playerId:${playerId}, error:${err}`
      );
      res.status(500).json({ message: "Server Error" });
    } else if (resultGM.length <= 0) {
      logger.warn(
        `${req.originalUrl} request warning, no associated grand master to give commission to, playerId:${playerId}`
      );
      res.status(305).json({ message: "No GM Account associated" });
    } else {
      const gmCommission = parseFloat(
        parseFloat(amount / 100) * parseFloat(resultGM[0].commission)
      ).toFixed(2);
      const gmCummulative = (
        parseFloat(resultGM[0].wallet) + parseFloat(gmCommission)
      ).toFixed(2);
      // Process 2
      // Increase Master Agent Wallet
      sqlQueryGM2 =
        "UPDATE accounts SET wallet = ?, lastedit_date = NOW() WHERE account_id = ?";
      db.query(
        sqlQueryGM2,
        [gmCummulative, resultGM[0].account_id],
        (err, resultGM2) => {
          if (err) {
            logger.error(
              `${req.originalUrl} request has an error during process 2, grandMaster:${resultGM[0].account_id} playerId:${playerId}, error:${err}`
            );
            res.status(500).json({ message: "Server Error" });
          } else if (resultGM2.affectedRows <= 0) {
            logger.warn(
              `${req.originalUrl} request warning, update was not successful in increasing grand master wallet, grandMaster:${resultGM[0].account_id} playerId:${playerId}`
            );
            res.status(305).json({ message: "Error in updating GM wallet" });
          } else {
            logger.info(
              `${req.originalUrl} request successful, grand master commission was given, grandMaster:${resultGM[0].account_id} commission:${gmCommission} playerId:${playerId} betId:${betId}`
            );

            // Process 3
            // Insert to transactions table
            transDescription2 = "Commission from BetId " + betId;
            sqlGrandMaster2 =
              "INSERT INTO transactions (description, account_id, amount, cummulative, status, placement_date, transaction_type, game_id) VALUES (?,?,?,?,1, NOW(), 6, ?)";
            db.query(
              sqlGrandMaster2,
              [
                transDescription2,
                resultGM[0].account_id,
                gmCommission,
                gmCummulative,
                gameId
              ],
              (err, resultGM3) => {
                if (err) {
                  logger.error(
                    `${req.originalUrl} request has an error during process 3, grandMaster:${resultGM[0].account_id} betId:${betId}, error:${err}`
                  );
                  res.status(500).json({ message: "Server Error" });
                } else if (resultGM3.affectedRows <= 0) {
                  logger.warn(
                    `${req.originalUrl} request warning, update was not successful in increase grand master, insert to transactions table, grandMaster:${resultGM[0].account_id} betId:${betId}`
                  );
                  res
                    .status(305)
                    .json({ message: "Error in updating GM transaction" });
                } else {
                  logger.info(
                    `${req.originalUrl} request successful, grand master commission was inserted to transactions table, grandMaster:${resultGM[0].account_id} betId:${betId}, commission:${gmCommission} playerId:${playerId} betId:${betId}`
                  );
                  res.status(200).json({ message: "Commission given to GM" });
                }
              }
            );
          }
        }
      );
    }
  });
});

app.post("/settleColorGameBets", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");
  const gameId = req.body.gameId;
  const marketId = req.body.marketId;
  const marketResult = req.body.result;
  const gameName = req.body.gameName;

  // Check if body is complete
  if (!gameId || !marketId || marketResult.length !== 3 || !gameName) {
    logger.warn(
      `${req.originalUrl} request has missing body parameters, marketId:${marketId}`
    );
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(
      `${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`
    );
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  // Process 1
  // Get Win_multiplier details for the game
  sqlQuery =
    "SELECT win_multip1, win_multip2, win_multip3 FROM games where game_id = ?";
  db.query(sqlQuery, [gameId], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, gameId:${gameId}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else if (result.length <= 0) {
      logger.warn(
        `${req.originalUrl} request warning, market not found, marketId:${marketId} gameId:${gameId}`
      );
      res
        .status(409)
        .json({
          message: "Cannot settle color game bets. Game not found",
          data: { gameId: gameId },
        });
    } else {
      const winMultip1 = parseFloat(result[0].win_multip1);
      const winMultip2 = parseFloat(result[0].win_multip2);
      const winMultip3 = parseFloat(result[0].win_multip3);
      const winMultipArr = [winMultip1, winMultip2, winMultip3];

      // Process 2
      // Get all unsettled bets placed on the market
      sqlQuery2 =
        "SELECT bet_id, account_id, description, stake FROM bets WHERE status = 0 AND game_id = ? AND market_id = ? ORDER BY bet_id ASC";
      db.query(sqlQuery2, [gameId, marketId], (err, result2) => {
        if (err) {
          logger.error(
            `${req.originalUrl} request has an error during process 2, gameId:${gameId} marketId:${marketId}, error:${err}`
          );
          res.status(500).json({ message: "Server error" });
        } else if (result2.length > 0) {
          logger.info(
            `${req.originalUrl} bet setslement has been triggered, marketId:${marketId} gameId:${gameId} betCount:${result2.length}`
          );
          res
            .status(200)
            .json({
              message: "Bet settlement has been triggered",
              data: {
                gameId: gameId,
                marketId: marketId,
                betCount: result2.length,
              },
            });

          // Calculate Winnings
          const updateWalletDetailsArr = [];
          unsettledBets = result2;
          unsettledBets.forEach((bet) => {
            var choice = bet.description.replace(`${gameName} - `, "");
            var stake = bet.stake;
            var accountId = bet.account_id;
            var occurrences = 0;

            // Check occurrences of choice in the result
            marketResult.forEach((color) => {
              occurrences = color === choice ? occurrences + 1 : occurrences;
            });

            // Calculate winnings with occurrences
            multiplier = occurrences === 0 ? 0 : winMultipArr[occurrences - 1];
            const winnings = parseFloat(stake * multiplier).toFixed(2);
            const BetStatus = occurrences === 0 ? 1 : 2;

            updateWalletDetailsArr.push({
              betId: bet.bet_id,
              winnings: winnings,
              account_id: accountId,
              choice: choice,
              stake: stake,
              multiplier: multiplier,
              status: BetStatus,
            });
          });

          // Process 3
          // Update Wallet in accounts Table and Update Status in Bets Table
          // Prepare update statement for player winnings
          var updateWalletQuery = "";
          var updateWalletDetailString = "";
          updateWalletDetailsArr.forEach((entry) => {
            updateWalletDetailString += `{betId: ${entry.betId}, accountId: ${entry.account_id}, choice: ${entry.choice}, stake: ${entry.stake}, winnings: ${entry.winnings}} `;
            updateWalletQuery += db.format(
              "UPDATE accounts SET wallet=wallet+?, lastedit_date = NOW() WHERE account_id = ?; UPDATE bets SET cummulative = (SELECT wallet FROM accounts where account_id = ?), winnings=?, status = ?, settled_date = NOW() WHERE bet_id = ?;",
              [
                entry.winnings,
                entry.account_id,
                entry.account_id,
                entry.winnings,
                entry.status,
                entry.betId,
              ]
            );
          });

          db.query(updateWalletQuery, (err, result3) => {
            if (err) {
              logger.error(
                `${req.originalUrl} request has an error during process 3, gameId:${gameId} marketId:${marketId}, error:${err}`
              );
            } else {
              logger.info(
                `Wallet balance has been updated for settlement, marketId:${marketId} gameId:${gameId} result:${marketResult} duration:${getDurationInMilliseconds(
                  start
                )} bets:${updateWalletDetailString}`
              );
            }
          });
        } else {
          res
            .status(200)
            .json({
              message: "All bets has been setteled for the market",
              data: {
                gameId: gameId,
                marketId: marketId,
                betCount: result2.length,
              },
            });
        }
      });
    }
  });
});

app.post("/sendTip", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");
  const accountId = req.body.accountId;
  const amount = req.body.amount;
  const wallet = req.body.wallet;
  const adminAccountId = 16;

  // Check if body is complete
  if (!accountId || !amount || !wallet) {
    logger.warn(
      `${req.originalUrl} request has missing body parameters, accountId:${accountId}`
    );
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(
      `${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`
    );
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  // Process 1
  // Decrease Player Wallet
  // const cummulative = (wallet - amount).toFixed(2);
  toDecrease = 0 - amount;
  sqlQuery = "UPDATE accounts SET wallet = wallet+? WHERE account_id = ?";
  db.query(sqlQuery, [toDecrease, accountId], (err, result1) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`
      );
      res.status(500).json({ message: "Error during managing player wallet" });
    } else if (result1.affectedRows <= 0) {
      logger.warn(
        `${req.originalUrl} request warning, accountId not found, accountId:${accountId}`
      );
      res
        .status(409)
        .json({
          message: "Tip not placed successfully. Please check accountId",
        });
    } else {
      // Process 2
      // Insert the tips of player in transactions table
      description = "Send Tip - amount: Php " + amount;
      sqlQuery2 =
        "INSERT INTO transactions (description, account_id, amount, cummulative, status, placement_date, transaction_type) VALUES (?,?,?,(SELECT wallet FROM accounts WHERE account_id = ?),1,NOW(), 7)";
      db.query(
        sqlQuery2,
        [description, accountId, amount, accountId],
        (err, result2) => {
          if (err) {
            logger.error(
              `${req.originalUrl} request has an error during process 2, accountId:${accountId}, error:${err}`
            );
            res
              .status(500)
              .json({ message: "Error during managing player wallet" });
          } else if (result2.affectedRows <= 0) {
            logger.warn(
              `${req.originalUrl} request warning, transaction not inserted successfully for sender, accountId:${accountId}`
            );
            res
              .status(409)
              .json({
                message: "Tip not placed successfully. Please check accountId",
              });
          } else {
            transactionId = result2.insertId;
            logger.info(
              `${req.originalUrl} sender transaction inserted successfully, transactionId:${transactionId}`
            );

            // Process 3
            // Insert the received tips of player in transactions table
            cummulative2 = 99999;
            description =
              "Received Tip - amount: Php " +
              amount +
              " from player: " +
              accountId;
            sqlQuery2 =
              "INSERT INTO transactions (description, account_id, amount, cummulative, status, placement_date, transaction_type) VALUES (?,?,?,?,1,NOW(), 8)";
            db.query(
              sqlQuery2,
              [description, adminAccountId, amount, cummulative2],
              (err, result2) => {
                if (err) {
                  logger.error(
                    `${req.originalUrl} request has an error during process 2, accountId:${accountId}, error:${err}`
                  );
                  res
                    .status(500)
                    .json({ message: "Error during managing player wallet" });
                } else if (result2.affectedRows <= 0) {
                  logger.warn(
                    `${req.originalUrl} request warning, transaction not inserted successfully for Receiver, accountId:${accountId}`
                  );
                  res
                    .status(409)
                    .json({
                      message:
                        "Tip not placed successfully. Please check accountId",
                    });
                } else {
                  logger.info(
                    `${req.originalUrl} receiver transaction inserted successfully, transactionId:${result2.insertId}`
                  );
                }
              }
            );
            logger.info(
              `${req.originalUrl} done, duration:${getDurationInMilliseconds(
                start
              )}`
            );
            res
              .status(200)
              .json({ message: "Tip sent successfully. Thank you" });
          }
        }
      );
    }
  });
});

app.get("/getBetHistory/:accountId/:dateFrom/:dateTo", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");
  const accountId = req.params.accountId;
  const dateFrom = req.params.dateFrom;
  const dateTo = req.params.dateTo;

  // Check if body is complete
  if (!accountId) {
    logger.warn(
      `${req.originalUrl} request has missing body parameters, accountId:${accountId}`
    );
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(
      `${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`
    );
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  sqlQuery =
    "SELECT bt.*, (select result from markets where market_id=bt.market_id and settled_date is not null) as result FROM bets bt WHERE account_id = ? AND placement_date BETWEEN ? AND ? ORDER BY placement_date DESC";
  db.query(sqlQuery, [accountId, dateFrom, dateTo], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`
      );
    } else {
      logger.info(
        `${req.originalUrl} successful, duration:${getDurationInMilliseconds(
          start
        )}`
      );
      res.status(200).json({ message: "Request Successful", data: result });
    }
  });
});

app.get("/getAllBetHistory/:accountId/:accountType/:dateFrom/:dateTo", (req, res) => {
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
    sqlQuery = "SELECT bt.*, ac.username FROM bets bt \
    LEFT JOIN accounts ac ON \
    bt.account_id = ac.account_id \
    WHERE bt.placement_date BETWEEN ? AND ? ORDER BY bt.placement_date DESC;"
    sqlQuery = db.format(sqlQuery, [dateFrom, dateTo])
  } else if (accountType === "grandmaster") {
    sqlQuery = "SELECT  bt.*, ac.username FROM bets bt  \
    LEFT JOIN accounts ac ON \
    bt.account_id = ac.account_id \
    WHERE ac.agent_id = ? OR ac.agent_id IN (SELECT account_id FROM accounts WHERE agent_id IN (SELECT account_id FROM accounts WHERE agent_id = ?)) AND placement_date BETWEEN ? AND ? ORDER BY bt.placement_date DESC ;"   
    sqlQuery = db.format(sqlQuery, [accountId, accountId, dateFrom, dateTo])
  } else if (accountType === "masteragent") {
    sqlQuery = "SELECT  bt.*,  ac.username FROM bets bt  \
    LEFT JOIN accounts ac ON \
    bt.account_id = ac.account_id \
    WHERE ac.agent_id = ? OR ac.agent_id IN (SELECT account_id FROM accounts WHERE agent_id = ?)AND placement_date BETWEEN ? AND ? ORDER BY bt.placement_date DESC ;"   
    sqlQuery = db.format(sqlQuery, [accountId, accountId, dateFrom, dateTo])
  } else if (accountType === "agent") {
    sqlQuery =  "SELECT  bt.*, m.result, ac.username FROM bets bt  \
    LEFT JOIN accounts ac ON \
    bt.account_id = ac.account_id \
    WHERE ac.agent_id = ? AND placement_date BETWEEN ? AND ? ORDER BY bt.placement_date DESC ;"    
    sqlQuery = db.format(sqlQuery, [accountId, dateFrom, dateTo])
  }

  console.log(sqlQuery)
  if (sqlQuery !== "") {
    db.query(sqlQuery, (err, result) => {
      if (err) {
        logger.error(
          `${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err} sqlQuery:${sqlQuery}`
        );
      } else {
        var finalResult = []
        result.forEach((bet) => {
          if (finalResult.some(e => e.bet_id === bet.bet_id)){
            // console.log(bet.bet_id, "found")
          } else {
            finalResult.push(bet)
          }
        })
        logger.info(
          `${
            req.originalUrl
          } request successful, accountId:${accountId} duration:${getDurationInMilliseconds(
            start
          )}`
        );
        res.status(200).json({ message: "Request Successful", data: finalResult });
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

app.get("/getBetMarketList/:marketId", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");
  const marketId = req.params.marketId;

  // Check if body is complete
  if (!marketId) {
    logger.warn(
      `${req.originalUrl} request has missing body parameters, marketId:${marketId}`
    );
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(
      `${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`
    );
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  sqlQuery = "SELECT * from bets WHERE market_id=?";
  db.query(sqlQuery, [marketId], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, marketId:${marketId}, error:${err}`
      );
    } else {
      logger.info(
        `${req.originalUrl} successful, duration:${getDurationInMilliseconds(
          start
        )}`
      );
      res.status(200).json({ message: "Request Successful", data: result });
    }
  });
});

app.get("/getAccountBetslips/:accountId/:marketId", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");
  const accountId = req.params.accountId;
  const marketId = req.params.marketId;

  // Check if body is complete
  if (!marketId || !accountId) {
    logger.warn(
      `${req.originalUrl} request has missing body parameters, marketId:${marketId}`
    );
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(
      `${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`
    );
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  sqlQuery = "SELECT * from bets WHERE market_id=? and account_id=?";
  db.query(sqlQuery, [marketId, accountId], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, marketId:${marketId}, error:${err}`
      );
    } else {
      logger.info(
        `${req.originalUrl} successful, duration:${getDurationInMilliseconds(
          start
        )}`
      );
      res.status(200).json({ message: "Request Successful", data: result });
    }
  });
});



app.post("/placeTotalisatorBet", (req, res) => {
  const start = process.hrtime();
  
  const apiKey = req.header("Authorization");
  const marketId = req.body.marketId;
  const gameId = req.body.gameId;
  const accountId = req.body.accountId;
  const gameName = req.body.gameName;
  const choice = req.body.choice;
  const stake = req.body.stake;
  const wallet = req.body.wallet;
  const maxBet = req.body.maxBet;

  // Check if body is complete
  if (!marketId ||!gameId || !accountId || !gameName || !choice || !stake || !wallet) {
    logger.warn(`${req.originalUrl} request has missing body parameters, accountId:${accountId}`);
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  sqlQuery = "SELECT status from markets WHERE game_id = ? AND market_id = ? ORDER BY lastedit_date DESC LIMIT 1";
  db.query(sqlQuery, [gameId, marketId], (err, result) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`);
      res.status(500).json({ message: "Server error" });
    } else if (result.length <= 0 ){
      logger.warn(`${req.originalUrl} request warning, market not found, marketId:${marketId} accountId:${accountId}`);
      res.status(409).json({ message: "Market not found" });
    } else if (result[0].status !== 0){
      logger.warn(`${req.originalUrl} request warning, market not not open, marketId:${marketId} accountId:${accountId}`);
      res.status(409).json({ message: "Market not open" });
    } else {
      
      // Process 2 - Check if bet is still okay
      sqlQuery = `SELECT REPLACE(description, '${gameName} - ', '') as choice, SUM(stake) AS total FROM bets WHERE market_id = ? GROUP BY description;`
      db.query(sqlQuery, [marketId], (err, resultTotal) => {
        if (err) {
          logger.error(`${req.originalUrl} request has an error during process 2, marketId:${marketId} accountId:${accountId}, error:${err}`);
          res.status(500).json({ message: "Error in checking quota" });
        } else {

          // Check if bet is supposed total is still okay
          currentTotal = 0;
          for (let i = 0; i < resultTotal.length; i++){
            if (resultTotal[i].choices === choice) {
              currentTotal = resultTotal[i].total;
            }
          }

          var supposedTotal = parseFloat(currentTotal) + parseFloat(stake);
          if (supposedTotal > parseFloat(maxBet)) {
            logger.warn(`${req.originalUrl} request has an warning during process 2, bet is bigger than koto, marketId:${marketId} accountId:${accountId}, error:${err}`)
            res.status(500).json({message: `Stake is bigger than accepted koto, available bet amount is ${parseFloat(maxBet) - parseFloat(currentTotal)}`})
          }else{

            // Process 3 - Decrease Player Wallet
            const cummulative = (wallet - stake).toFixed(2);
            sqlQuery = "UPDATE accounts SET wallet=? WHERE account_id=?";
            db.query(sqlQuery, [cummulative, accountId], (err, result3) => {
              if (err) {
                logger.error(`${req.originalUrl} request has an error during process 3, marketId:${marketId} accountId:${accountId}, error:${err}`);
                res.status(500).json({ message: "Error during managing player wallet" });
              } else if (result3.affectedRows <= 0) {
                logger.warn(`${req.originalUrl} request warning, player account cannot be found, marketId:${marketId} accountId:${accountId}`);
                res.status(409).json({message:"Bet not placed successfully. Please check accountId"});
              } else {

                // Process 4 - Insert Bet in Bets Table
                const description = gameName + " - " + choice;
                sqlQuery = "INSERT INTO bets (description, market_id, game_id, account_id, stake, cummulative, status, placement_date) VALUES (?,?,?,?,?,?,?, NOW())";
                db.query(sqlQuery, [description, marketId, gameId, accountId, stake, cummulative, 0], (err, result3) => {
                  if (err) {
                    logger.error(`${req.originalUrl} request has an error during process 4, marketId:${marketId} accountId:${accountId}, error:${err}`);
                    res.status(500).json({ message: "Server error" });
                  } else if (result3.affectedRows <= 0) {
                    logger.warn(`${req.originalUrl} request warning, bet not placed, marketId:${marketId} accountId:${accountId}`);
                    res.status(409).json({message:"Bet not placed successfully. Please try again"});
                  } else {
                    const betId = result3.insertId;
                    logger.info(`${req.originalUrl} request successful, bet placed successfully, marketId:${marketId} accountId:${accountId} betId:${betId}`);
                    res.status(200).json({message: "Bet Placed successfully", data: {betId: betId, description: description, stake: stake, cummulative: cummulative}});
                  }
                })
              }
            })
          }
        }
      })

    }
  })
})


app.post("/sendAgentCommission", (req, res) => {
  const apiKey = req.header("Authorization");
  const betId = req.body.betId;
  const stake = req.body.stake;
  const playerId = req.body.playerId;
  const gameId = req.body.gameId;

  // Check if body is complete
  if (!betId || !playerId || !stake) {
    logger.warn(`${req.originalUrl} request has missing body parameters, marketId:${marketId}`);
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  // Process 1 Get Agent Details
  sqlQuery = "SELECT account_id, commission, wallet FROM accounts WHERE account_id in (SELECT agent_id FROM accounts WHERE account_id = ?);"
  db.query(sqlQuery, [playerId], (err, result) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, error for account: ${playerId}, error:${err}`);
      res.status(500).json({message: "Error in giving commission to agent", data:{error: err}})
    } else if (result.length <= 0) {
      logger.warn(`${req.originalUrl} request warning, no associated agent to give commission for account: ${playerId}`);
      res.status(409).json({message: "Error in giving commission to agent"})
    } else {
      const agentCommission = (parseFloat(stake/100) * parseFloat(result[0].commission)).toFixed(2)
      const agentCummulative = (parseFloat(result[0].wallet) + parseFloat(agentCommission)).toFixed(2)

      // Process 2 Increase wallet and insert transaction
      trDescription = "Commission from BetId " + betId;
      sqlQueryIncrease = "UPDATE accounts SET wallet = ? WHERE account_id = ?; INSERT INTO transactions (description, account_id, amount, cummulative, status, placement_date, transaction_type, game_id) VALUES (?,?,?,?,1,NOW(), 6, ?)";
      db.query(sqlQueryIncrease, [agentCummulative, result[0].account_id, trDescription, result[0].account_id, agentCommission, agentCummulative, gameId], (err, result2) =>{
        if (err){
          logger.error(`${req.originalUrl} request has an error during process 2, missing agent for account: ${playerId}, error:${err}`);
          res.status(500).json({message: "Error in giving commission to agent", data:{agentId: result[0].account_id, commission: agentCommission, error: err}})
        } else if (result2.affectedRows <= 0) {
          logger.warn(`${req.originalUrl} request warning, update was not successful in increase agent wallet, insert to transactions table, agent:${result[0].account_id}`);
          res.status(409).json({message: "Error in giving commission to agent", data:{agentId: result[0].account_id, commission: agentCommission}})
        } else {
          logger.info(`${req.originalUrl} request successful, agent commission was inserted to transactions table and wallet updated, agent:${result[0].account_id} commission:${agentCommission} betId:${betId}`);
          res.status(200).json({message: "Commission sent to agent", data:{agentId: result[0].account_id, commission: agentCommission}})
        }
      });
    }
  });
});


app.post("/sendMasterAgentCommission", (req, res) => {
  const apiKey = req.header("Authorization");
  const betId = req.body.betId;
  const stake = req.body.stake;
  const agentId = req.body.agentId;
  const agentCommission = req.body.agentCommission;
  const gameId = req.body.gameId;

  // Check if body is complete
  if (!betId || !agentId || !stake || !agentCommission) {
    logger.warn(`${req.originalUrl} request has missing body parameters, marketId:${marketId}`);
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  // Process 1 Get Master Agent Details
  sqlQuery = "SELECT account_id, commission, wallet FROM accounts WHERE account_id in (SELECT agent_id FROM accounts WHERE account_id = ?);"
  db.query(sqlQuery, [agentId], (err, result) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, error for agent: ${agentId}, error:${err}`);
      res.status(500).json({message: "Error in giving commission to master agent", data:{error: err}})
    } else if (result.length <= 0) {
      logger.warn(`${req.originalUrl} request warning, no associated master agent to give commission for agent: ${agentId}`);
      res.status(409).json({message: "Error in giving commission to master agent"})
    } else {
      const masterCommission = (parseFloat(stake/100) * parseFloat(result[0].commission)).toFixed(2) - parseFloat(agentCommission)
      const masterCummulative = (parseFloat(result[0].wallet) + parseFloat(masterCommission)).toFixed(2)

      // Process 2 Increase wallet and insert transaction
      trDescription = "Commission from BetId " + betId;
      sqlQueryIncrease = "UPDATE accounts SET wallet = ? WHERE account_id = ?; INSERT INTO transactions (description, account_id, amount, cummulative, status, placement_date, transaction_type, game_id) VALUES (?,?,?,?,1,NOW(), 6, ?)";
      db.query(sqlQueryIncrease, [masterCummulative, result[0].account_id, trDescription, result[0].account_id, masterCommission, masterCummulative, gameId], (err, result2) =>{
        if (err){
          logger.error(`${req.originalUrl} request has an error during process 2, missing master agent for agent: ${agentId}, error:${err}`);
          res.status(500).json({message: "Error in giving commission to master agent", data:{masterAgentId: result[0].account_id, commission: masterCommission, error: err}})
        } else if (result2.affectedRows <= 0) {
          logger.warn(`${req.originalUrl} request warning, update was not successful in increase master agent wallet, insert to transactions table, masterAgent:${result[0].account_id}`);
          res.status(409).json({message: "Error in giving commission to master agent", data:{masterAgentId: result[0].account_id, commission: masterCommission}})
        } else {
          logger.info(`${req.originalUrl} request successful, master agent commission was inserted to transactions table and wallet updated, agent:${result[0].account_id} commission:${masterCommission} betId:${betId}`);
          res.status(200).json({message: "Commission sent to master agent", data:{masterAgentId: result[0].account_id, commission: masterCommission}})
        }
      });
    }
  });
});



app.post("/settleTotalisatorBets", (req, res) => {
  const start = process.hrtime()

  const apiKey = req.header("Authorization");
  const gameId = req.body.gameId;
  const marketId = req.body.marketId;
  const choice1 = req.body.choice1;
  const choice2 = req.body.choice2;
  const oddChoice1 = req.body.oddChoice1;
  const oddChoice2 = req.body.oddChoice2;
  const oddDraw = req.body.oddDraw
  const marketResult = req.body.marketResult;
  const gameName = req.body.gameName;
  const settler = req.body.settler

  // Check if body is complete
  if (!gameId || !marketId || !choice1 || !choice2 || !oddChoice1 || !oddChoice2 || !oddDraw || !marketResult || !gameName || !settler) {
    logger.warn(`${req.originalUrl} request has missing body parameters, marketId:${marketId}`);
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, marketId:${marketId} received:${apiKey}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  // Process 1 Get All unsettled bets
  sqlQuery = "SELECT bet_id, account_id, description, stake FROM bets WHERE status = 0 AND game_id = ? AND market_id = ? ORDER BY bet_id ASC;";
  db.query(sqlQuery, [gameId, marketId], (err, result) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, gameId:${gameId} marketId:${marketId}, error:${err}`)
      res.status(500).json({ message: "Server error" });
    } else if (result.length > 0) {
      logger.info(`${req.originalUrl} bet settlement has been triggered, marketId:${marketId} gameId:${gameId} betCount:${result.length}`)
      
      var updateBetWalletDetails = []
      var unsettledBets = result;

      if (marketResult === "DRAW"){
        unsettledBets.forEach((bet) => {
          var choice = bet.description.replace(`${gameName} - `, "");
          var stake = bet.stake;
          var accountId = bet.account_id;
          var betId = bet.bet_id;

          walletUpdate = (choice === marketResult) ? parseFloat(stake)*parseFloat(oddDraw) : parseFloat(stake)
          var status = (choice === marketResult) ? 2 : 1
          // console.log(betId, stake, accountId, choice, walletUpdate, status)

          updateBetWalletDetails.push({
            betId: betId,
            winnings: parseFloat(walletUpdate).toFixed(2),
            accountId : accountId,
            choice: choice,
            stake: stake,
            status: status     
          })
        
        })
      } else if (marketResult === choice1){
        unsettledBets.forEach((bet) => {
          var choice = bet.description.replace(`${gameName} - `, "");
          var stake = bet.stake;
          var accountId = bet.account_id;
          var betId = bet.bet_id;

          walletUpdate = (choice === choice1) ? parseFloat(stake)*parseFloat(oddChoice1) : 0
          var status = (choice === marketResult) ? 2 : 1
          // console.log(bet.bet_id, stake, accountId, choice, walletUpdate, status)

          updateBetWalletDetails.push({
            betId: betId,
            winnings: parseFloat(walletUpdate).toFixed(2),
            accountId : accountId,
            choice: choice,
            stake: stake,
            status: status     
          })
        
        })
      } else if (marketResult === choice2){
        unsettledBets.forEach((bet) => {
          var choice = bet.description.replace(`${gameName} - `, "");
          var stake = bet.stake;
          var accountId = bet.account_id;
          var betId = bet.bet_id;

          walletUpdate = (choice === choice2) ? parseFloat(stake)*parseFloat(oddChoice2) : 0
          var status = (choice === marketResult) ? 2 : 1
          // console.log(bet.bet_id, stake, accountId, choice, walletUpdate, status)

          updateBetWalletDetails.push({
            betId: betId,
            winnings: parseFloat(walletUpdate).toFixed(2),
            accountId : accountId,
            choice: choice,
            stake: stake,
            status: status     
          })
        })
      }

  
      var updateWalletQuery = "";
      var updateWalletDetailString = "";
      updateBetWalletDetails.forEach((entry) => {
        updateWalletDetailString += `{betId: ${entry.betId}, accountId: ${entry.accountId}, choice: ${entry.choice}, stake: ${entry.stake}, winnings: ${entry.winnings}} `;
        updateWalletQuery += db.format( "UPDATE accounts SET wallet=wallet+?, lastedit_date = NOW() WHERE account_id = ?; UPDATE bets SET cummulative = (SELECT wallet FROM accounts where account_id = ?), winnings=?, status = ?, settled_date = NOW() WHERE bet_id = ?;", [entry.winnings, entry.accountId, entry.accountId, entry.winnings, entry.status, entry.betId])
      })
      console.log(updateWalletQuery)
      db.query(updateWalletQuery, (err, result2) => {
        if (err) {
          logger.error(`${req.originalUrl} request has an error during process 2, gameId:${gameId} marketId:${marketId}, error:${err}`)
        } else {
          logger.info(
            `Wallet balance has been updated for settlement, marketId:${marketId} gameId:${gameId} result:${marketResult} duration:${getDurationInMilliseconds(
              start
            )} bets:${updateWalletDetailString}`
          );
          res.status(200).json({ message: "All bets has been setteled for the market", data: {gameId: gameId, marketId: marketId, betCount: result.length, bets: result}});
        }
      })   
    } else {
      res.status(200).json({ message: "No bets settled", data: {gameId: gameId, marketId: marketId, betCount: 0}});
    }
  })
})


app.post("/sendTotalisatorCommissions", (req, res) => {
  const start = process.hrtime()

  const apiKey = req.header("Authorization");
  const gameId = req.body.gameId;
  const marketId = req.body.marketId;
  const choice1 = req.body.choice1;
  const choice2 = req.body.choice2;
  const oddChoice1 = req.body.oddChoice1;
  const oddChoice2 = req.body.oddChoice2;
  const oddDraw = req.body.oddDraw
  const marketResult = req.body.marketResult;
  const gameName = req.body.gameName;
  const settler = req.body.settler

  // Check if body is complete
  if (!gameId || !marketId || !choice1 || !choice2 || !oddChoice1 || !oddChoice2 || !oddDraw || !marketResult || !gameName || !settler) {
    logger.warn(`${req.originalUrl} request has missing body parameters, marketId:${marketId}`);
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, marketId:${marketId} received:${apiKey}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  // Process 1 Get All unsettled bets
  sqlQuery = "SELECT bet_id, account_id, description, stake FROM bets WHERE game_id = ? AND market_id = ? ORDER BY bet_id ASC;";

  db.query(sqlQuery, [gameId, marketId], (err, result) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, gameId:${gameId} marketId:${marketId}, error:${err}`)
      res.status(500).json({ message: "Server error" });
    } else if (result.length > 0) {
      logger.info(`${req.originalUrl} commission settlement has been triggered, marketId:${marketId} gameId:${gameId} betCount:${result.length}`)
      var bets = result

      // Agent Part
      var agentCommissionArr = []
      sqlQueryIncreaseStr = []
      bets.forEach((bet) => {
        sqlGetAccountDetail = "SELECT account_id, commission, wallet FROM accounts WHERE account_id in (SELECT agent_id FROM accounts WHERE account_id = ?);"
        db.query(sqlGetAccountDetail, (bet.account_id), (err, resultAgentDetail) => {
          if (err) {
            logger.error(`${req.originalUrl} request has an error during process 1, error for account: ${bet.account_id}, error:${err}`);
            res.status(500).json({message: "Error in giving commission to agent", data:{error: err}})
            return
          } else {
            var stake = bet.stake
            var commissionsPercentage = resultAgentDetail[0].commission
            var agentCommission = (parseFloat(stake/100) * parseFloat(commissionsPercentage)).toFixed(2)
            var agentCummulative = (parseFloat(resultAgentDetail[0].wallet) + parseFloat(agentCommission)).toFixed(2)
            var agentId = resultAgentDetail[0].account_id
            var trAgentDescription = "Commission from BetId " + bet.bet_id
            agentCommissionArr.push({agentCommission: agentCommission, agentId: agentId, description: trAgentDescription})

            logger.info(`Sending commission to agent: ${agentId} commission: ${agentCommission} agentCummulative: ${agentCummulative} stake:${stake} betId: ${bet.bet_id}`)

            sqlQueryIncrease = "UPDATE accounts SET wallet = wallet + ? WHERE account_id = ?; INSERT INTO transactions (description, account_id, amount, cummulative, status, placement_date, transaction_type) VALUES (?,?,?,?,1,NOW(), 6)";
            db.query(sqlQueryIncrease, [agentCommission, agentId, trAgentDescription, agentId, agentCommission, agentCummulative], (err, result2) =>{
              if (err){
                logger.error(`${req.originalUrl} request has an error during process 2, missing agent for account: ${bet.account_id}, error:${err}`);
              } else if (result2.affectedRows <= 0) {
                logger.warn(`Update was not successful in increase agent wallet, insert to transactions table, agent:${agentId}`);
              } else {
                logger.info(`Agent commission was inserted to transactions table and wallet updated, agent:${agentId} commission:${agentCommission} betId:${bet.bet_id}`);
              }

            });
          }
        })
      })     
    }
  })
});



app.post("/placeSaklaBet", async (req, res) => {
  const startTime = process.hrtime();

  // Headers and Data
  const apiKey = req.header("Authorization");
  const marketId = req.body.marketId;
  const gameId = req.body.gameId;
  const accountId = req.body.accountId;
  const gameName = req.body.gameName;
  const choiceId = req.body.choiceId;
  const choice = req.body.choice;
  const stake = req.body.stake;
  const maxBet = req.body.maxBet;

  // Check if apiKey is correct
  if (!checkApiKey(apiKey)) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received ${apiKey}, body: ${JSON.stringify(req.body)}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return
  }

  // Check if Body is complete
  if (!gameId || !marketId || !accountId || !gameName || !choiceId || !choice || !stake || !maxBet) {
    logger.warn(`${req.originalUrl} request has missing parameters, body: ${JSON.stringify(req.body)}`);
    res.status(422).json({ message: "Request has missing parameters"});
    return
  }

  // Get Latest Market entry for GameID Entered
  logger.info(`${req.originalUrl} started ${JSON.stringify(req.body)}`)

  // Check if wallet is enough
  const isEnoughWallet = await checkIfWalletIsEnough(accountId, stake)
    .catch((error) => {
      res.status(500).json({message: "Server Error"})
      return
    })

  if (!isEnoughWallet){
    res.status(409).json({message: "Not enough credits to place bet"})
    return
  }

  // Check if market is still open
  const marketStatus = await checkIfMarketIsOpen(marketId)
    .catch((error) => {
      res.status(500).json({message: "Server Error"})
      return
    })

  if (marketStatus[0].status !== 0){
    res.status(409).json({message: "Market is not open, place will not be placed", marketId: marketId, status: marketStatus[0].status})
    return
  }

  // Check MarketTotals and ManipulateBets
  const marketTotals = await checkTotals(marketId, gameName, choice, choiceId)
    .catch((error) => {
      res.status(500).json({message: "Server Error"})
      return
    })
  
  // Check MarketTotals and ManipulateBets
  const manipulateValue = await fetchManipulateValue(choiceId)
  .catch((error) => {
    res.status(500).json({message: "Server Error"})
    return
  })

  const supposedTotal = parseFloat(marketTotals) + parseFloat(manipulateValue[0].manipulate_val) + parseFloat(stake)
  if (supposedTotal > parseFloat(maxBet)){
    const remainingKoto = parseFloat(maxBet) - parseFloat(marketTotals) - parseFloat(manipulateValue[0].manipulate_val)
    logger.warn(`${req.original} request, stake amount is greater than acceptable max bet, stake:${stake} remainingKoto:${remainingKoto}`)
    res.status(409).json({message: `Bet amount is greater than acceptable koto, acceptableBetAmount: ${remainingKoto}`})
    return;
  }
 

  // Decrease Wallet and Insert in Bets Table
  const decPlayerWallet = decreasePlayerWallet(accountId, stake) 
  .catch((error) => {
    res.status(500).json({message: "Server Error"})
    return
  })

  const insertBet = await insertBetsTable(gameName, choice, marketId, gameId, accountId, stake)
  .catch((error) => {
    res.status(500).json({message: "Server Error"})
    return
  })
  
  //Send success status
  logger.info(`Bet Placed Successfully betId:${insertBet.insertId}`)
  res.status(200).json({message: "Bet Placed Successfully", betId: insertBet.insertId})

  // Insert Commissions
  // Send Agent Commission
  const agentCommission = await sendAgentCommission(accountId, insertBet.insertId, stake, gameId)
  .catch((error) => {
    res.status(500).json({message: "Server Error"})
    return
  })

});


app.listen(4005, () => {
  console.log("Backend Bet Manager listentning at port 4005");
});
