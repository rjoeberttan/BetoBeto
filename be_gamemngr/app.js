//jshint esversion: 6
const express = require("express");
const mysql = require("mysql");
const { createLogger, transports, format } = require("winston");
const io = require("socket.io-client");
const helmet = require("helmet");
const cors = require("cors");
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

// Configure websocket domain
// const socket = io.connect("http://localhost:3010")

// Configure Winston Logging
// For this environment it sends to console first
const logger = createLogger({
  format: format.combine(
    format.timestamp({ format: "MMM-DD-YYYY HH:mm:ss" }),
    format.printf(
      (info) => `${info.timestamp} -- ${(info.level).toUpperCase()} -- ${info.message}`
    )
  ),
  transports: [new transports.File({filename: '/var/log/app/gamemanager.log'})],
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
});

// GET getGamesList
// Requires: apiKey
// Responses:
//  401 - Unauthorized Request
//  500 - Server Error
//  200 - Successful
app.get("/getGamesList", (req, res) => {
  const start = process.hrtime()

  const apiKey = req.header("Authorization");

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  // Process 1. Get All games from database
  var sqlQuery = "SELECT game_id, name, min_bet, max_bet, is_live FROM games";
  db.query(sqlQuery, [], (err, result) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, error:${err}`)
      res.status(500).json({ message: "Server Error /getGamesList" });
    } else if (result) {
      logger.info(`${req.originalUrl} request successful, duration:${getDurationInMilliseconds(start)}`)
      res.status(200).json({ message: "Request successful", data: result });
    }
  });
});

app.get("/getGameDetails/:gameId", (req, res) => {
  const start = process.hrtime()

  const apiKey = req.header("Authorization");
  const gameId = req.params.gameId;

  // Check if body is complete
  if (!gameId) {
    logger.warn(`${req.originalUrl} request has missing body parameters, gameId:${gameId}`)
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
  // Select the game details from the database
  sqlQuery = "SELECT * FROM games WHERE game_id = ?";
  db.query(sqlQuery, [gameId], (err, result) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, gameId:${gameId}, error:${err}`)
      res.status(500).json({ message: "Server error" });
    } else if (result.length <= 0) {
      logger.warn(`${req.originalUrl} request warning, game is not found in database, gameId:${gameId}`);
      res.status(409).json({ message: "gameId not found" });
    } else {
      logger.info(`${req.originalUrl} request successful, gameId:${gameId} duration:${getDurationInMilliseconds(start)}`)
      res.status(200).json({ message: "Request successful", data: result[0] });
    }
  });
});

app.post("/updateLiveStatus", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");
  const gameId = req.body.gameId;
  const status = req.body.status; // Current Status
  const editor = req.body.editor;

  // Check if body is complete
  if (!gameId || !status || !editor) {
      logger.warn(`${req.originalUrl} request has missing body parameters, gameId:${gameId}`)
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
  // Update in the database
  const newStatus = status === "1" ? 0 : 1;
  sqlQuery =
    "UPDATE games set is_live = ?, lastedit_date = NOW(), edited_by = ? WHERE game_id = ?";
  db.query(sqlQuery, [newStatus, editor, gameId], (err, result) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, gameId:${gameId}, error:${err}`)
      res.status(500).json({ message: "Server error" });
    } else if (result.affectedRows <= 0) {
      logger.warn(`${req.originalUrl} request warning, game is not found in database, gameId:${gameId}`);
      res
        .status(409)
        .json({ message: "Nothing was updated, please check gameId" });
    } else {
      logger.info(`${req.originalUrl} request successful, gameId:${gameId} duration:${getDurationInMilliseconds(start)}`)
      res.status(200).json({
        message: "Request successful",
        data: { gameId: gameId, status: newStatus },
      });
    }
  });
});

app.post("/updateGameSettings", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");
  const gameId = req.body.gameId;
  const url = req.body.url; // Current Status
  const gameTitle = req.body.title;
  const description = req.body.description;
  const bannerMessage = req.body.bannerMessage;
  const editor = req.body.editor;

  // Check if body is complete
  if (!gameId || !url || !editor || !gameTitle || description || !bannerMessage) {
    logger.warn(`${req.originalUrl} request has missing body parameters, gameId:${gameId}`)
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
  // Update the url
  sqlQuery =
    "UPDATE games set youtube_url = ?, name=?, description=?, banner=?, lastedit_date = NOW(), edited_by = ? WHERE game_id = ?";
  db.query(
    sqlQuery,
    [url, gameTitle, description, bannerMessage, editor, gameId],
    (err, result) => {
      if (err) {
        logger.error(`${req.originalUrl} request has an error during process 1, gameId:${gameId}, error:${err}`)
        res.status(500).json({ message: "Server error" });
      } else if (result.affectedRows <= 0) {
        logger.warn(`${req.originalUrl} request warning, game is not found in database, gameId:${gameId}`);
        res
          .status(409)
          .json({ message: "Nothing was updated, please check gameId" });
      } else {
        logger.info(`${req.originalUrl} request successful, gameId:${gameId} duration:${getDurationInMilliseconds(start)}`)
        res.status(200).json({
          message: "Request successful",
          data: { gameId: gameId, url: url },
        });
      }
    }
  );
});

app.post("/updateBetThreshold", (req, res) => {
  const start = process.hrtime();
  
  const apiKey = req.header("Authorization");
  const gameId = req.body.gameId;
  const min_bet = req.body.min_bet;
  const max_bet = req.body.max_bet;
  const editor = req.body.editor;

  // Check if body is complete
  if (!gameId || !min_bet || !max_bet) {
    logger.warn(`${req.originalUrl} request has missing body parameters, gameId:${gameId}`)
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
  // Update the url
  sqlQuery =
    "UPDATE games set min_bet = ?, max_bet=?, lastedit_date = NOW(), edited_by = ? WHERE game_id = ?";
  db.query(sqlQuery, [min_bet, max_bet, editor, gameId], (err, result) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, gameId:${gameId}, error:${err}`)
      res.status(500).json({ message: "Server error" });
    } else if (result.affectedRows <= 0) {
      logger.warn(`${req.originalUrl} request warning, game is not found in database, gameId:${gameId}`);
      res
        .status(409)
        .json({ message: "Nothing was updated, please check gameId" });
    } else {
      logger.info(`${req.originalUrl} request successful, gameId:${gameId} duration:${getDurationInMilliseconds(start)}`)
      res.status(200).json({
        message: "Request successful",
        data: { gameId: gameId },
      });
    }
  });
});

app.post("/updateColorGameWinMultiplier", (req, res) => {
  const start = process.hrtime();
  
  const apiKey = req.header("Authorization");
  const gameId = req.body.gameId;
  const winMultiplier = req.body.winMultiplier; // Current Status
  const editor = req.body.editor;

  // Check if body is complete
  if (!gameId || !winMultiplier || !editor || winMultiplier.length !== 3) {
    logger.warn(`${req.originalUrl} request has missing body parameters, gameId:${gameId}`)
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
    "UPDATE games SET win_multip1 = ?, win_multip2 = ?, win_multip3 = ?, lastedit_date = NOW(), edited_by = ? WHERE game_id = ?";
  db.query(sqlQuery, [...winMultiplier, editor, gameId], (err, result) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, gameId:${gameId}, error:${err}`)
      res.status(500).json({ message: "Server error" });
    } else if (result.affectedRows <= 0) {
      logger.warn(`${req.originalUrl} request warning, game is not found in database, gameId:${gameId}`);
      res
        .status(409)
        .json({ message: "Nothing was updated, please check gameId" });
    } else {
      logger.info(`${req.originalUrl} request successful, gameId:${gameId} duration:${getDurationInMilliseconds(start)}`)
      res.status(200).json({
        message: "Request successful",
        data: { gameId: gameId, winMultiplier: winMultiplier },
      });
    }
  });
});

// ***************************************************************
// MARKET RELATED CALLS
//****************************************************************
app.post("/createColorGameMarket", (req, res) => {
  const start = process.hrtime();
  
  const apiKey = req.header("Authorization");
  const gameId = req.body.gameId;
  const description = req.body.description;
  const editor = req.body.editor;

  // Check if body is complete
  if (!gameId || !description || !editor) {
    logger.warn(`${req.originalUrl} request has missing body parameters, gameId:${gameId}`)
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  // Process 1: Get Latest Market entry for GameID entered
  sqlQuery =
    "SELECT * FROM markets WHERE game_id = ? ORDER BY lastedit_date DESC LIMIT 1";
  db.query(sqlQuery, [gameId], (err, result) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, gameId:${gameId}, error:${err}`)
      res.status(500).json({ message: "Server error" });
    } else if (result.length === 0) {
      // Process 2
      // Insert new Market. No Previous Market
      var newMarketId = 1;
      sqlQuery =
        "INSERT INTO markets (market_id, game_id, description, status, lastedit_date, edited_by) VALUES (?, ?, ?, ?,  NOW(), ?)";
      db.query(
        sqlQuery,
        [newMarketId, gameId, description, 0, editor],
        (err, result2) => {
          if (err) {
            logger.error(`${req.originalUrl} request has an error during process 2, gameId:${gameId}, error:${err}`)
            res.status(500).json({ message: "Server Error" });
          } else if (result2.affectedRows > 0) {
            logger.info(`${req.originalUrl} request successful, gameId:${gameId} marketId:${newMarketId} duration:${getDurationInMilliseconds(start)}`)
            res.status(200).json({
              message: "Successfully Created New Market.",
              data: { gameID: gameId, marketID: newMarketId, status: 0 },
            });
          }
        }
      );
    } else if (result[0].status === 2) {
      // Insert new market if latest found is already settled

      // Process 3
      // Get latest marketid for game
      sqlQuery =
        "SELECT distinct market_id from markets ORDER BY market_id DESC LIMIT 1";
      db.query(sqlQuery, [], (err, result3) => {
        if (err) {
          logger.error(`${req.originalUrl} request has an error during process 3, gameId:${gameId}, error:${err}`)
          res.status(500).json({ message: "Server Error" });
        } else {
          // Process 4
          // Insert new market. Previous Market is unsettled
          var newMarketId = result3[0].market_id + 1;
          console.log(newMarketId);
          sqlQuery4 =
            "INSERT INTO markets (market_id, game_id, description, status, lastedit_date, edited_by) VALUES (?, ?, ?, ?,  NOW(), ?)";
          db.query(
            sqlQuery4,
            [newMarketId, gameId, description, 0, editor],
            (err, result4) => {
              if (err) {
                logger.error(`${req.originalUrl} request has an error during process 4, gameId:${gameId}, error:${err}`)
                res.status(500).json({ message: "Server Error" });
              } else if (result4.affectedRows > 0) {
                logger.info(`${req.originalUrl} request successful, gameId:${gameId} marketId:${newMarketId} duration:${getDurationInMilliseconds(start)}`)
                res.status(200).json({
                  msg: "Successfully Created New Market.",
                  data: { gameID: gameId, marketID: newMarketId, status: 0 },
                });
                socketData = {
                  gameId: gameId,
                  marketID: newMarketId,
                  status: 0,
                  date: new Date(),
                };
                // socket.emit("color_game_market_update", socketData);
              }
            }
          );
        }
      });
    } else if (result[0].status < 2) {
      logger.warn(`${req.originalUrl} request warning, there is an unsettled market, marketId:${result[0].market_id} gameId:${gameId}`);
      res.status(409).json({
        message:
          "There are still unsettled market for the game. Settle first before creating new market",
        data: {
          gameId: gameId,
          marketID: result[0].market_id,
          status: result[0].status,
        },
      });
    }
  });
});

app.post("/closeMarket", (req, res) => {
  const start = process.hrtime();
  
  const apiKey = req.header("Authorization");
  const gameId = req.body.gameId;
  const marketId = req.body.marketId;
  const editor = req.body.editor;

  // Check if body is complete
  if (!gameId || !editor || !marketId) {
    logger.warn(`${req.originalUrl} request has missing body parameters, gameId:${gameId}`)
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
  // Get Current Status of the market
  sqlQuery =
    "SELECT * FROM markets WHERE game_id = ? AND market_id = ? ORDER BY lastedit_date DESC LIMIT 1";
  db.query(sqlQuery, [gameId, marketId], (err, result) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, marketId:${marketId} gameId:${gameId}, error:${err}`)
      res.status(500).json({ message: "Server error" });
    } else if (result.length === 0) {
      logger.warn(`${req.originalUrl} request warning, market is not found in database, marketId:${marketId} gameId:${gameId}`);
      res
        .status(409)
        .json({ message: "No market found for marketId:" + marketId });
    } else if (result[0].status != 0) {
      logger.warn(`${req.originalUrl} request warning, market is already closed or settled, marketId:${marketId} gameId:${gameId}`);
      res.status(409).json({
        message: "Market is already closed or settled",
        data: { marketId: marketId, status: result[0].status },
      });
    } else {
      // Process 2
      // Insert into markets with new market status
      const description = result[0].description;
      const blue = result[0].bb_manip_blue;
      const yellow = result[0].bb_manip_yellow;
      const red = result[0].bb_manip_red;
      const white = result[0].bb_manip_white;
      const green = result[0].bb_manip_green;
      const purple = result[0].bb_manip_purple;

      sqlQuery =
        "INSERT INTO markets (market_id, game_id, description, status, bb_manip_blue, bb_manip_yellow, bb_manip_red, bb_manip_white, bb_manip_green, bb_manip_purple, lastedit_date, edited_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)";
      db.query(
        sqlQuery,
        [
          marketId,
          gameId,
          description,
          1,
          blue,
          yellow,
          red,
          white,
          green,
          purple,
          editor,
        ],
        (err, result2) => {
          if (err) {
            logger.error(`${req.originalUrl} request has an error during process 2, marketId:${marketId} gameId:${gameId}, error:${err}`)
            res.status(500).json({ message: "Server Error" });
          } else if (result2.affectedRows > 0) {
            logger.info(`${req.originalUrl} request successful, gameId:${gameId} marketId:${marketId} duration:${getDurationInMilliseconds(start)}`)
            res.status(200).json({
              message: "Market closed successfully",
              data: { gameId: gameId, marketId: marketId, status: 1 },
            });

            socketData = {
              gameId: gameId,
              marketID: marketId,
              status: 1,
              date: new Date(),
            };
            // socket.emit("color_game_market_update", socketData);
          }
        }
      );
    }
  });
});

app.post("/openMarket", (req, res) => {
  const start = process.hrtime();
  
  const apiKey = req.header("Authorization");
  const gameId = req.body.gameId;
  const marketId = req.body.marketId;
  const editor = req.body.editor;

  // Check if body is complete
  if (!gameId || !editor || !marketId) {
    logger.warn(`${req.originalUrl} request has missing body parameters, gameId:${gameId}`)
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
  // Get Current Status of the market
  sqlQuery =
    "SELECT * FROM markets WHERE game_id = ? AND market_id = ? ORDER BY lastedit_date DESC LIMIT 1";
  db.query(sqlQuery, [gameId, marketId], (err, result) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, marketId:${marketId} gameId:${gameId}, error:${err}`)
      res.status(500).json({ message: "Server error" });
    } else if (result.length === 0) {
      logger.warn(`${req.originalUrl} request warning, market is not found in database, marketId:${marketId} gameId:${gameId}`);
      res
        .status(409)
        .json({ message: "No market found for marketId:" + marketId });
    } else if (result[0].status != 1) {
      logger.warn(`${req.originalUrl} request warning, market is already open or settled, marketId:${marketId} gameId:${gameId}`);
      res.status(409).json({
        message: "Market is already open or settled",
        data: { marketId: marketId, status: result[0].status },
      });
    } else {
      // Process 2
      // Insert into markets with new market status
      const description = result[0].description;
      const blue = result[0].bb_manip_blue;
      const yellow = result[0].bb_manip_yellow;
      const red = result[0].bb_manip_red;
      const white = result[0].bb_manip_white;
      const green = result[0].bb_manip_green;
      const purple = result[0].bb_manip_purple;

      sqlQuery =
        "INSERT INTO markets (market_id, game_id, description, status, bb_manip_blue, bb_manip_yellow, bb_manip_red, bb_manip_white, bb_manip_green, bb_manip_purple, lastedit_date, edited_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)";
      db.query(
        sqlQuery,
        [
          marketId,
          gameId,
          description,
          0,
          blue,
          yellow,
          red,
          white,
          green,
          purple,
          editor,
        ],
        (err, result2) => {
          if (err) {
            logger.error(`${req.originalUrl} request has an error during process 2, marketId:${marketId} gameId:${gameId}, error:${err}`)
            res.status(500).json({ message: "Server Error" });
          } else if (result2.affectedRows > 0) {
            logger.info(`${req.originalUrl} request successful, gameId:${gameId} marketId:${marketId} duration:${getDurationInMilliseconds(start)}`)
            res.status(200).json({
              message: "Market opened successfully",
              data: { gameId: gameId, marketId: marketId, status: 0 },
            });

            socketData = {
              gameId: gameId,
              marketID: marketId,
              status: 0,
              date: new Date(),
            };
            // socket.emit("color_game_market_update", socketData);
          }
        }
      );
    }
  });
});

app.post("/resultMarket", (req, res) => {
  const start = process.hrtime();
  
  const apiKey = req.header("Authorization");
  const gameId = req.body.gameId;
  const marketId = req.body.marketId;
  const marketResult = req.body.result;
  const editor = req.body.editor;

  // Check if body is complete
  if (!gameId || !editor || !marketId || marketResult.length !== 3) {
    logger.warn(`${req.originalUrl} request has missing body parameters, gameId:${gameId}`)
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
  // Get current status of the market
  sqlQuery =
    "SELECT * FROM markets WHERE game_id = ? AND market_id = ? ORDER BY lastedit_date DESC LIMIT 1";
  db.query(sqlQuery, [gameId, marketId], (err, result) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, marketId:${marketId} gameId:${gameId}, error:${err}`)
      res.status(500).json({ message: "Server error" });
    } else if (result.length <= 0) {
      logger.warn(`${req.originalUrl} request warning, market is not found in database, marketId:${marketId} gameId:${gameId}`);
      res
        .status(409)
        .json({ message: "No market found for marketId:" + marketId });
    } else if (result[0].status !== 1) {
      logger.warn(`${req.originalUrl} request warning, market is still open or already settled, marketId:${marketId} gameId:${gameId}`);
      res.status(409).json({
        message: "Market is still open or already settled",
        data: { marketId: marketId, status: result[0].status },
      });
    } else {
      // Process 2
      // Insert into markets with resulted market status
      const description = result[0].description;
      const blue = result[0].bb_manip_blue;
      const yellow = result[0].bb_manip_yellow;
      const red = result[0].bb_manip_red;
      const white = result[0].bb_manip_white;
      const green = result[0].bb_manip_green;
      const purple = result[0].bb_manip_purple;
      const resultText = marketResult.toString();

      sqlQuery =
        "INSERT INTO markets (market_id, game_id, description, status, result, bb_manip_blue, bb_manip_yellow, bb_manip_red, bb_manip_white, bb_manip_green, bb_manip_purple, settled_date, lastedit_date, edited_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)";
      db.query(
        sqlQuery,
        [
          marketId,
          gameId,
          description,
          2,
          resultText,
          blue,
          yellow,
          red,
          white,
          green,
          purple,
          editor,
        ],
        (err, result2) => {
          if (err) {
            logger.error(`${req.originalUrl} request has an error during process 2, marketId:${marketId} gameId:${gameId}, error:${err}`)
            res.status(500).json({ message: "Server Error" });
          } else if (result2.affectedRows > 0) {
            logger.info(`${req.originalUrl} request successful, gameId:${gameId} marketId:${marketId} duration:${getDurationInMilliseconds(start)}`)
            res.status(200).json({
              message: "Market resulted successfully",
              data: {
                gameId: gameId,
                marketId: marketId,
                status: 2,
                result: resultText,
              },
            });

            socketData = {
              gameId: gameId,
              marketID: marketId,
              status: 2,
              result: resultText,
              date: new Date(),
            };
            // socket.emit("color_game_market_update", socketData);
          }
        }
      );
    }
  });
});

app.get("/getLatestMarketDetails/:gameId", (req, res) => {
  const start = process.hrtime();
  
  const apiKey = req.header("Authorization");
  const gameId = req.params.gameId;

  // Check if body is complete
  if (!gameId) {
    logger.warn(`${req.originalUrl} request has missing body parameters, gameId:${gameId}`)
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
  // Get latest market detail
  sqlQuery =
    "SELECT market_id, game_id, description, result, status FROM markets WHERE game_id = ? ORDER BY lastedit_date DESC LIMIT 1";
  db.query(sqlQuery, [gameId], (err, result) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, gameId:${gameId}, error:${err}`)
      res.status(500).json({ message: "Server error" });
    } else if (result.length <= 0) {
      logger.warn(`${req.originalUrl} request warning, market is not found in database, gameId:${gameId}`);
      res.status(409).json({ message: "No markets found" });
    } else {
      logger.info(`${req.originalUrl} request successful, gameId:${gameId} duration:${getDurationInMilliseconds(start)}`)
      res
        .status(200)
        .json({ message: "Request successful", data: { market: result[0] } });
    }
  });
});

app.post("/manipulateBetTotals", (req, res) => {
  const start = process.hrtime();
  
  const apiKey = req.header("Authorization");
  const marketId = req.body.marketId;
  const editor = req.body.editor;
  const bb_manip = req.body.bb_manip; // array[0-5] in order of blue,yellow,red,white,green,purple

  // Check if body is complete
  if (!marketId || !editor || !bb_manip || bb_manip.length !== 6) {
    logger.warn(`${req.originalUrl} request has missing body parameters, marketId:${marketId}`)
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
  // Check if the market Id exists
  sqlQuery =
    "SELECT * FROM markets where market_id = ? ORDER BY lastedit_date DESC LIMIT 1";
  db.query(sqlQuery, [marketId], (err, result) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, marketId:${marketId}, error:${err}`)
      res.status(500).json({ message: "Server error" });
    } else if (result.length <= 0) {
      logger.warn(`${req.originalUrl} request warning, game is not found in database, marketId:${marketId}`);
      res.status(409).json({ message: "No markets found" });
    } else {
      // Process 2
      // Just update the latest row
      const rowId = result[0].id;
      sqlQuery =
        "UPDATE markets SET bb_manip_blue = ?, bb_manip_yellow = ?, bb_manip_red = ?, bb_manip_white = ?, bb_manip_green = ?, bb_manip_purple = ? WHERE id = ?";
      db.query(sqlQuery, [...bb_manip, rowId], (err, result2) => {
        if (err) {
          logger.error(`${req.originalUrl} request has an error during process 2, marketId:${marketId}, error:${err}`)
          res.status(500).json({ message: "Server error" });
        } else if (result.affectedRows <= 0) {
          logger.warn(`${req.originalUrl} request warning, market is not found in database, marketId:${marketId}`);
          res.status(409).json({ message: "Update not Successful" });
        } else {
          logger.info(`${req.originalUrl} request successful, marketId:${marketId} duration:${getDurationInMilliseconds(start)}`)
          res.status(200).json({
            message: "Successful manipulateBetTotals request",
            data: { bb_manip_values: bb_manip },
          });
        }
      });
    }
  });
});

app.get("/getManipulateValues/:gameId/:marketId", (req, res) => {
  const start = process.hrtime();
  
  const apiKey = req.header("Authorization");
  const gameId = req.params.gameId;
  const marketId = req.params.marketId;

  // Check if body is complete
  if (!gameId || !marketId) {
    logger.warn(`${req.originalUrl} request has missing body parameters, gameId:${gameId}`)
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
  // Get latest market detail
  sqlQuery =
    "SELECT bb_manip_blue, bb_manip_yellow, bb_manip_red, bb_manip_white, bb_manip_green, bb_manip_purple FROM markets WHERE game_id = ? AND market_id = ? ORDER BY lastedit_date DESC LIMIT 1";
  db.query(sqlQuery, [gameId, marketId], (err, result) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, gameId:${gameId} marketId:${marketId}, error:${err}`)
      res.status(500).json({ message: "Server error" });
    } else if (result.length <= 0) {
      logger.warn(`${req.originalUrl} request warning, market is not found in database, marketId:${marketId} gameId:${gameId}`);
      res.status(409).json({ message: "No markets found" });
    } else {
      logger.info(`${req.originalUrl} request successful, gameId:${gameId} marketId:${marketId} duration:${getDurationInMilliseconds(start)}`)
      res
        .status(200)
        .json({ message: "Request successful", data: { market: result[0] } });
    }
  });
});

app.get("/getColorGameBetTotals/:gameId/:marketId", (req, res) => {
  const start = process.hrtime();
  
  const apiKey = req.header("Authorization");
  const gameId = req.params.gameId;
  const marketId = req.params.marketId;

  logger.info("started getColorGameBetTotals")
  // Check if body is complete
  if (!gameId || !marketId) {
    logger.warn(`${req.originalUrl} request has missing body parameters, gameId:${gameId}`)
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
  // Get the totals for the markets on the bets table
  sqlQuery =
    "SELECT REPLACE(description, 'Color Game - ', '') as color, SUM(stake) as total FROM bets where market_id = ? GROUP BY description;";
  db.query(sqlQuery, [marketId], (err, result) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, gameId:${gameId} marketId:${marketId}, error:${err}`)
      res.status(500).json({ message: "Server error" });
    } else {
      // Process 2
      // Get Manipulate Values
      sqlQuery2 =
        "SELECT bb_manip_blue, bb_manip_yellow, bb_manip_red, bb_manip_white, bb_manip_green, bb_manip_purple FROM markets WHERE game_id = ? AND market_id = ? ORDER BY lastedit_date DESC LIMIT 1";
      db.query(sqlQuery2, [gameId, marketId], (err, result2) => {
        if (err) {
          logger.error(`${req.originalUrl} request has an error during process 2, gameId:${gameId} marketId:${marketId}, error:${err}`)
          res.status(500).json({ message: "Server error" });
        } else if (result.length <= 0) {
          logger.warn(`${req.originalUrl} request warning, market is not found in database, marketId:${marketId} gameId:${gameId}`);
          res.status(409).json({
            message: "Cannot calculate bet totals. market not found",
            data: { gameId: gameId },
          });
        } else {
          const colorTotal = result;
          const manipulateValues = result2[0];
          // const finalBetTotals = [{color, total}]
          colors = ["BLUE", "WHITE", "RED", "GREEN", "YELLOW", "PURPLE"];
          finalTotals = [];
          colors.forEach((colorValue) => {
            inserted = false;
            colorTotal.forEach((entry) => {
              if (colorValue === entry.color && colorValue === "RED") {
                totalAmount = entry.total + manipulateValues.bb_manip_red;
                finalTotals.push({ color: colorValue, total: totalAmount });
                inserted = true;
              } else if (colorValue === entry.color && colorValue === "GREEN") {
                totalAmount = entry.total + manipulateValues.bb_manip_green;
                finalTotals.push({ color: colorValue, total: totalAmount });
                inserted = true;
              } else if (colorValue === entry.color && colorValue === "BLUE") {
                totalAmount = entry.total + manipulateValues.bb_manip_blue;
                finalTotals.push({ color: colorValue, total: totalAmount });
                inserted = true;
              } else if (colorValue === entry.color && colorValue === "WHITE") {
                totalAmount = entry.total + manipulateValues.bb_manip_white;
                finalTotals.push({ color: colorValue, total: totalAmount });
                inserted = true;
              } else if (
                colorValue === entry.color &&
                colorValue === "YELLOW"
              ) {
                totalAmount = entry.total + manipulateValues.bb_manip_yellow;
                finalTotals.push({ color: colorValue, total: totalAmount });
                inserted = true;
              } else if (
                colorValue === entry.color &&
                colorValue === "PURPLE"
              ) {
                totalAmount = entry.total + manipulateValues.bb_manip_purple;
                finalTotals.push({ color: colorValue, total: totalAmount });
                inserted = true;
              }
            });

            if (!inserted) {
              if (colorValue === "RED") {
                totalAmount = manipulateValues.bb_manip_red;
                finalTotals.push({ color: colorValue, total: totalAmount });
                inserted = true;
              } else if (colorValue === "GREEN") {
                totalAmount = manipulateValues.bb_manip_green;
                finalTotals.push({ color: colorValue, total: totalAmount });
                inserted = true;
              } else if (colorValue === "BLUE") {
                totalAmount = manipulateValues.bb_manip_blue;
                finalTotals.push({ color: colorValue, total: totalAmount });
                inserted = true;
              } else if (colorValue === "WHITE") {
                totalAmount = manipulateValues.bb_manip_white;
                finalTotals.push({ color: colorValue, total: totalAmount });
                inserted = true;
              } else if (colorValue === "YELLOW") {
                totalAmount = manipulateValues.bb_manip_yellow;
                finalTotals.push({ color: colorValue, total: totalAmount });
                inserted = true;
              } else if (colorValue === "PURPLE") {
                totalAmount = manipulateValues.bb_manip_purple;
                finalTotals.push({ color: colorValue, total: totalAmount });
                inserted = true;
              }
            }
          });
          logger.info(`${req.originalUrl} request successful, gameId:${gameId} marketId:${marketId} duration:${getDurationInMilliseconds(start)}`) 
          res.status(200).json({
            message: "Bet Totals request is successful",
            data: finalTotals,
          });
        }
      });
    }
  });
});

app.listen(4004, () => {
  console.log("Backend Game Manager listentning at port 4004");
});
