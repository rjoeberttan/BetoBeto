//jshint esversion: 6
const express = require("express");
const mysql = require("mysql");
const { createLogger, transports, format } = require("winston");
const io = require("socket.io-client");
const helmet = require("helmet");
const cors = require("cors");
const fs = require("fs");

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

app.post("/placeBet", (req, res) => {
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
  if (
    !marketId ||
    !gameId ||
    !accountId ||
    !gameName ||
    !choice ||
    !stake ||
    !wallet
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

  // Process 1
  // Check if market is still open
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
            sqlQuery = "UPDATE accounts SET wallet = ? WHERE account_id = ?";
            db.query(sqlQuery, [cummulative, accountId], (err, result2) => {
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
                                    "INSERT INTO transactions (description, account_id, amount, cummulative, status, placement_date, transaction_type) VALUES (?,?,?,?,1, NOW(), 6)";
                                  db.query(
                                    sqlQueryAgent3,
                                    [
                                      transDescription,
                                      resultAgent[0].account_id,
                                      agentCommission,
                                      agentCummulative,
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
                                          "INSERT INTO transactions (description, account_id, amount, cummulative, status, placement_date, transaction_type) VALUES (?,?,?,?,1, NOW(), 6)";
                                        db.query(
                                          sqlQueryMasterAgent3,
                                          [
                                            transDescription2,
                                            resultMasterAgent[0].account_id,
                                            masterCommission,
                                            masterCummulative,
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
});

app.post("/sendGrandMasterCommission", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");
  const betId = req.body.betId;
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
              "INSERT INTO transactions (description, account_id, amount, cummulative, status, placement_date, transaction_type) VALUES (?,?,?,?,1, NOW(), 6)";
            db.query(
              sqlGrandMaster2,
              [
                transDescription2,
                resultGM[0].account_id,
                gmCommission,
                gmCummulative,
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
  const cummulative = (wallet - amount).toFixed(2);
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
        "INSERT INTO transactions (description, account_id, amount, cummulative, status, placement_date, transaction_type) VALUES (?,?,?,?,1,NOW(), 7)";
      db.query(
        sqlQuery2,
        [description, accountId, amount, cummulative],
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
    sqlQuery = "SELECT bt.*, (SELECT result FROM markets WHERE market_id=bt.market_id AND settled_date IS NOT NULL) AS result, (SELECT username FROM accounts ac WHERE ac.account_id = bt.account_id) AS username FROM bets bt WHERE bt.placement_date BETWEEN ? AND ? ORDER BY bt.placement_date DESC;"
    sqlQuery = db.format(sqlQuery, [dateFrom, dateTo])
  } else if (accountType === "grandmaster") {
    sqlQuery = `SELECT bt.*, (SELECT result FROM markets WHERE market_id=bt.market_id AND settled_date IS NOT NULL) AS result, (SELECT username FROM accounts ac WHERE ac.account_id = bt.account_id) AS username FROM bets bt 
    WHERE account_id IN
    (SELECT account_id FROM accounts WHERE agent_id IN (SELECT account_id FROM accounts WHERE agent_id IN (SELECT account_id FROM accounts WHERE agent_id = ?))) AND placement_date BETWEEN ? AND ? ORDER BY bt.placement_date DESC;`
    sqlQuery = db.format(sqlQuery, [accountId, dateFrom, dateTo])
  } else if (accountType === "masteragent") {
    sqlQuery = `SELECT bt.*, (SELECT result FROM markets WHERE market_id=bt.market_id AND settled_date IS NOT NULL) AS result, (SELECT username FROM accounts ac WHERE ac.account_id = bt.account_id) AS username FROM bets bt 
    WHERE account_id IN
    (SELECT account_id FROM accounts WHERE agent_id = ? OR agent_id IN (SELECT account_id FROM accounts WHERE agent_id = ?)) AND placement_date BETWEEN ? AND ? ORDER BY bt.placement_date DESC;`
    sqlQuery = db.format(sqlQuery, [accountId, accountId, dateFrom, dateTo])
  } else if (accountType === "agent") {
    sqlQuery = `SELECT bt.*, (SELECT result FROM markets WHERE market_id=bt.market_id AND settled_date IS NOT NULL) AS result, (SELECT username FROM accounts ac WHERE ac.account_id = bt.account_id) AS username FROM bets bt 
    WHERE account_id IN
    (SELECT account_id FROM accounts WHERE agent_id = ?) AND placement_date BETWEEN ? AND ? ORDER BY bt.placement_date DESC;`
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

app.listen(4005, () => {
  console.log("Backend Bet Manager listentning at port 4005");
});
