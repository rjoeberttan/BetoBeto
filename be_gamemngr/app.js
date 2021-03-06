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
      (info) =>
        `${info.timestamp} -- ${info.level.toUpperCase()} -- ${info.message}`
    )
  ),
  transports: [
    new transports.File({ filename: "/var/log/app/gamemanager.log" }),
  ],
});

const getDurationInMilliseconds = (start) => {
  const NS_PER_SEC = 1e9;
  const NS_TO_MS = 1e6;
  const diff = process.hrtime(start);

  return `${((diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS).toFixed(2)}ms`;
};

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
  const start = process.hrtime();

  const apiKey = req.header("Authorization");

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(
      `${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`
    );
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  // Process 1. Get All games from database
  var sqlQuery = "SELECT game_id, name, basename, min_bet, max_bet, is_live, type FROM games";
  db.query(sqlQuery, [], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, error:${err}`
      );
      res.status(500).json({ message: "Server Error /getGamesList" });
    } else if (result) {
      logger.info(
        `${
          req.originalUrl
        } request successful, duration:${getDurationInMilliseconds(start)}`
      );
      res.status(200).json({ message: "Request successful", data: result });
    }
  });
});


app.get("/getMarketResults", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(
      `${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`
    );
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  // Process 1
  // Select the game details from the database
  sqlQuery = "SELECT * FROM markets WHERE status = 2  AND settled_date >= NOW() - INTERVAL 7 DAY ORDER BY market_id DESC";
  db.query(sqlQuery, (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else if (result.length <= 0) {
      logger.warn(
        `${req.originalUrl} request warning, game is not found in database, `
      );
      res.status(409).json({ message: "gameId not found" });
    } else {
      logger.info(
        `${
          req.originalUrl
        } request successful, duration:${getDurationInMilliseconds(
          start
        )}`
      );
      res.status(200).json({ message: "Request successful", data: result });
    }
  });
})

app.get("/getGameDetails/:gameId", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");
  const gameId = req.params.gameId;

  // Check if body is complete
  if (!gameId) {
    logger.warn(
      `${req.originalUrl} request has missing body parameters, gameId:${gameId}`
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
  // Select the game details from the database
  sqlQuery = "SELECT * FROM games WHERE game_id = ?";
  db.query(sqlQuery, [gameId], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, gameId:${gameId}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else if (result.length <= 0) {
      logger.warn(
        `${req.originalUrl} request warning, game is not found in database, gameId:${gameId}`
      );
      res.status(409).json({ message: "gameId not found" });
    } else {
      logger.info(
        `${
          req.originalUrl
        } request successful, gameId:${gameId} duration:${getDurationInMilliseconds(
          start
        )}`
      );
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
    logger.warn(
      `${req.originalUrl} request has missing body parameters, gameId:${gameId}`
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
  // Update in the database
  const newStatus = status === "1" ? 0 : 1;
  sqlQuery =
    "UPDATE games set is_live = ?, lastedit_date = NOW(), edited_by = ? WHERE game_id = ?";
  db.query(sqlQuery, [newStatus, editor, gameId], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, gameId:${gameId}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else if (result.affectedRows <= 0) {
      logger.warn(
        `${req.originalUrl} request warning, game is not found in database, gameId:${gameId}`
      );
      res
        .status(409)
        .json({ message: "Nothing was updated, please check gameId" });
    } else {
      logger.info(
        `${
          req.originalUrl
        } request successful, gameId:${gameId} duration:${getDurationInMilliseconds(
          start
        )}`
      );
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
  if (
    !gameId ||
    !url ||
    !editor ||
    !gameTitle ||
    description ||
    !bannerMessage
  ) {
    logger.warn(
      `${req.originalUrl} request has missing body parameters, gameId:${gameId}`
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
  // Update the url
  sqlQuery =
    "UPDATE games set youtube_url = ?, name=?, description=?, banner=?, lastedit_date = NOW(), edited_by = ? WHERE game_id = ?";
  db.query(
    sqlQuery,
    [url, gameTitle, description, bannerMessage, editor, gameId],
    (err, result) => {
      if (err) {
        logger.error(
          `${req.originalUrl} request has an error during process 1, gameId:${gameId}, error:${err}`
        );
        res.status(500).json({ message: "Server error" });
      } else if (result.affectedRows <= 0) {
        logger.warn(
          `${req.originalUrl} request warning, game is not found in database, gameId:${gameId}`
        );
        res
          .status(409)
          .json({ message: "Nothing was updated, please check gameId" });
      } else {
        logger.info(
          `${
            req.originalUrl
          } request successful, gameId:${gameId} duration:${getDurationInMilliseconds(
            start
          )}`
        );
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
    logger.warn(
      `${req.originalUrl} request has missing body parameters, gameId:${gameId}`
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
  // Update the url
  sqlQuery =
    "UPDATE games set min_bet = ?, max_bet=?, lastedit_date = NOW(), edited_by = ? WHERE game_id = ?";
  db.query(sqlQuery, [min_bet, max_bet, editor, gameId], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, gameId:${gameId}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else if (result.affectedRows <= 0) {
      logger.warn(
        `${req.originalUrl} request warning, game is not found in database, gameId:${gameId}`
      );
      res
        .status(409)
        .json({ message: "Nothing was updated, please check gameId" });
    } else {
      logger.info(
        `${
          req.originalUrl
        } request successful, gameId:${gameId} duration:${getDurationInMilliseconds(
          start
        )}`
      );
      res.status(200).json({
        message: "Request successful",
        data: { gameId: gameId },
      });
    }
  });
});

app.post("/updateTotalistatorCommission", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");
  const gameId = req.body.gameId;
  const commission = req.body.commission;
  const editor = req.body.editor;

  // Check if body is complete
  if (!gameId || !commission) {
    logger.warn(
      `${req.originalUrl} request has missing body parameters, gameId:${gameId}`
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
  // Update the url
  sqlQuery =
    "UPDATE games set commission = ?, lastedit_date = NOW(), edited_by = ? WHERE game_id = ?";
  db.query(sqlQuery, [commission, editor, gameId], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, gameId:${gameId}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else if (result.affectedRows <= 0) {
      logger.warn(
        `${req.originalUrl} request warning, game is not found in database, gameId:${gameId}`
      );
      res
        .status(409)
        .json({ message: "Nothing was updated, please check gameId" });
    } else {
      logger.info(
        `${
          req.originalUrl
        } request successful, gameId:${gameId} duration:${getDurationInMilliseconds(
          start
        )}`
      );
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
    logger.warn(
      `${req.originalUrl} request has missing body parameters, gameId:${gameId}`
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
    "UPDATE games SET win_multip1 = ?, win_multip2 = ?, win_multip3 = ?, lastedit_date = NOW(), edited_by = ? WHERE game_id = ?";
  db.query(sqlQuery, [...winMultiplier, editor, gameId], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, gameId:${gameId}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else if (result.affectedRows <= 0) {
      logger.warn(
        `${req.originalUrl} request warning, game is not found in database, gameId:${gameId}`
      );
      res
        .status(409)
        .json({ message: "Nothing was updated, please check gameId" });
    } else {
      logger.info(
        `${
          req.originalUrl
        } request successful, gameId:${gameId} duration:${getDurationInMilliseconds(
          start
        )}`
      );
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
    logger.warn(
      `${req.originalUrl} request has missing body parameters, gameId:${gameId}`
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

  // Process 1: Get Latest Market entry for GameID entered
  sqlQuery =
    "SELECT * FROM markets WHERE game_id = ? ORDER BY lastedit_date DESC LIMIT 1";
  db.query(sqlQuery, [gameId], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, gameId:${gameId}, error:${err}`
      );
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
            logger.error(
              `${req.originalUrl} request has an error during process 2, gameId:${gameId}, error:${err}`
            );
            res.status(500).json({ message: "Server Error" });
          } else if (result2.affectedRows > 0) {
            logger.info(
              `${
                req.originalUrl
              } request successful, gameId:${gameId} marketId:${newMarketId} duration:${getDurationInMilliseconds(
                start
              )}`
            );
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
          logger.error(
            `${req.originalUrl} request has an error during process 3, gameId:${gameId}, error:${err}`
          );
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
                logger.error(
                  `${req.originalUrl} request has an error during process 4, gameId:${gameId}, error:${err}`
                );
                res.status(500).json({ message: "Server Error" });
              } else if (result4.affectedRows > 0) {
                logger.info(
                  `${
                    req.originalUrl
                  } request successful, gameId:${gameId} marketId:${newMarketId} duration:${getDurationInMilliseconds(
                    start
                  )}`
                );
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
      logger.warn(
        `${req.originalUrl} request warning, there is an unsettled market, marketId:${result[0].market_id} gameId:${gameId}`
      );
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
    logger.warn(
      `${req.originalUrl} request has missing body parameters, gameId:${gameId}`
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
  // Get Current Status of the market
  sqlQuery =
    "SELECT * FROM markets WHERE game_id = ? AND market_id = ? ORDER BY lastedit_date DESC LIMIT 1";
  db.query(sqlQuery, [gameId, marketId], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, marketId:${marketId} gameId:${gameId}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else if (result.length === 0) {
      logger.warn(
        `${req.originalUrl} request warning, market is not found in database, marketId:${marketId} gameId:${gameId}`
      );
      res
        .status(409)
        .json({ message: "No market found for marketId:" + marketId });
    } else if (result[0].status != 0) {
      logger.warn(
        `${req.originalUrl} request warning, market is already closed or settled, marketId:${marketId} gameId:${gameId}`
      );
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
            logger.error(
              `${req.originalUrl} request has an error during process 2, marketId:${marketId} gameId:${gameId}, error:${err}`
            );
            res.status(500).json({ message: "Server Error" });
          } else if (result2.affectedRows > 0) {
            logger.info(
              `${
                req.originalUrl
              } request successful, gameId:${gameId} marketId:${marketId} duration:${getDurationInMilliseconds(
                start
              )}`
            );
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
    logger.warn(
      `${req.originalUrl} request has missing body parameters, gameId:${gameId}`
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
  // Get Current Status of the market
  sqlQuery =
    "SELECT * FROM markets WHERE game_id = ? AND market_id = ? ORDER BY lastedit_date DESC LIMIT 1";
  db.query(sqlQuery, [gameId, marketId], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, marketId:${marketId} gameId:${gameId}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else if (result.length === 0) {
      logger.warn(
        `${req.originalUrl} request warning, market is not found in database, marketId:${marketId} gameId:${gameId}`
      );
      res
        .status(409)
        .json({ message: "No market found for marketId:" + marketId });
    } else if (result[0].status != 1) {
      logger.warn(
        `${req.originalUrl} request warning, market is already open or settled, marketId:${marketId} gameId:${gameId}`
      );
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
            logger.error(
              `${req.originalUrl} request has an error during process 2, marketId:${marketId} gameId:${gameId}, error:${err}`
            );
            res.status(500).json({ message: "Server Error" });
          } else if (result2.affectedRows > 0) {
            logger.info(
              `${
                req.originalUrl
              } request successful, gameId:${gameId} marketId:${marketId} duration:${getDurationInMilliseconds(
                start
              )}`
            );
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
    logger.warn(
      `${req.originalUrl} request has missing body parameters, gameId:${gameId}`
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
  // Get current status of the market
  sqlQuery =
    "SELECT * FROM markets WHERE game_id = ? AND market_id = ? ORDER BY lastedit_date DESC LIMIT 1";
  db.query(sqlQuery, [gameId, marketId], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, marketId:${marketId} gameId:${gameId}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else if (result.length <= 0) {
      logger.warn(
        `${req.originalUrl} request warning, market is not found in database, marketId:${marketId} gameId:${gameId}`
      );
      res
        .status(409)
        .json({ message: "No market found for marketId:" + marketId });
    } else if (result[0].status !== 1) {
      logger.warn(
        `${req.originalUrl} request warning, market is still open or already settled, marketId:${marketId} gameId:${gameId}`
      );
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
            logger.error(
              `${req.originalUrl} request has an error during process 2, marketId:${marketId} gameId:${gameId}, error:${err}`
            );
            res.status(500).json({ message: "Server Error" });
          } else if (result2.affectedRows > 0) {
            logger.info(
              `${
                req.originalUrl
              } request successful, gameId:${gameId} marketId:${marketId} duration:${getDurationInMilliseconds(
                start
              )}`
            );
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

app.get("/getMarketTrend/:gameId", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");
  const gameId = req.params.gameId;
  const status = 2;
  const limit = ( gameId === '4' || gameId === '5' ) ? 25 : 7;

  // Check if body is complete
  if (!gameId) {
    logger.warn(
      `${req.originalUrl} request has missing body parameters, gameId:${gameId}`
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
  // Get latest market detail
  sqlQuery =
    "select market_id, result from markets where game_id = ? and  status = ? order by settled_date desc limit ?;";
  db.query(sqlQuery, [gameId, status, limit], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, gameId:${gameId}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else {
      logger.info(
        `${
          req.originalUrl
        } request successful, gameId:${gameId} duration:${getDurationInMilliseconds(
          start
        )}`
      );
      res
        .status(200)
        .json({ message: "Request successful", data: { trends: result } });
    }
  });
});

app.get("/getLatestMarketDetails/:gameId", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");
  const gameId = req.params.gameId;

  // Check if body is complete
  if (!gameId) {
    logger.warn(
      `${req.originalUrl} request has missing body parameters, gameId:${gameId}`
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
  // Get latest market detail
  sqlQuery =
    "SELECT market_id, game_id, description, result, status FROM markets WHERE game_id = ? ORDER BY lastedit_date DESC LIMIT 1";
  db.query(sqlQuery, [gameId], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, gameId:${gameId}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else if (result.length <= 0) {
      logger.warn(
        `${req.originalUrl} request warning, market is not found in database, gameId:${gameId}`
      );
      res.status(409).json({ message: "No markets found" });
    } else {
      logger.info(
        `${
          req.originalUrl
        } request successful, gameId:${gameId} duration:${getDurationInMilliseconds(
          start
        )}`
      );
      res
        .status(200)
        .json({ message: "Request successful", data: { market: result[0] } });
    }
  });
});


app.get("/getMarketsUnderGame/:gameId", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");
  const gameId = req.params.gameId;

  // Check if body is complete
  if (!gameId) {
    logger.warn(
      `${req.originalUrl} request has missing body parameters, gameId:${gameId}`
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
  // Get latest market detail
  sqlQuery =  "SELECT market_id, result FROM markets WHERE game_id = ? and settled_date is not null and settled_date >= NOW() - INTERVAL 100 day ORDER BY market_id DESC;"

  db.query(sqlQuery, [gameId], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, gameId:${gameId}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else if (result.length <= 0) {
      logger.warn(
        `${req.originalUrl} request warning, market is not found in database, gameId:${gameId}`
      );
      res.status(409).json({ message: "No markets found" });
    } else {
      logger.info(
        `${
          req.originalUrl
        } request successful, gameId:${gameId} duration:${getDurationInMilliseconds(
          start
        )}`
      );
      res
        .status(200)
        .json({ message: "Request successful", data: { markets: result } });
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
  // Check if the market Id exists
  sqlQuery =
    "SELECT * FROM markets where market_id = ? ORDER BY lastedit_date DESC LIMIT 1";
  db.query(sqlQuery, [marketId], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, marketId:${marketId}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else if (result.length <= 0) {
      logger.warn(
        `${req.originalUrl} request warning, game is not found in database, marketId:${marketId}`
      );
      res.status(409).json({ message: "No markets found" });
    } else {
      // Process 2
      // Just update the latest row
      const rowId = result[0].id;
      sqlQuery =
        "UPDATE markets SET bb_manip_blue = ?, bb_manip_yellow = ?, bb_manip_red = ?, bb_manip_white = ?, bb_manip_green = ?, bb_manip_purple = ? WHERE id = ?";
      db.query(sqlQuery, [...bb_manip, rowId], (err, result2) => {
        if (err) {
          logger.error(
            `${req.originalUrl} request has an error during process 2, marketId:${marketId}, error:${err}`
          );
          res.status(500).json({ message: "Server error" });
        } else if (result.affectedRows <= 0) {
          logger.warn(
            `${req.originalUrl} request warning, market is not found in database, marketId:${marketId}`
          );
          res.status(409).json({ message: "Update not Successful" });
        } else {
          logger.info(
            `${
              req.originalUrl
            } request successful, marketId:${marketId} duration:${getDurationInMilliseconds(
              start
            )}`
          );
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
    logger.warn(
      `${req.originalUrl} request has missing body parameters, gameId:${gameId}`
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
  // Get latest market detail
  sqlQuery =
    "SELECT bb_manip_blue, bb_manip_yellow, bb_manip_red, bb_manip_white, bb_manip_green, bb_manip_purple FROM markets WHERE game_id = ? AND market_id = ? ORDER BY lastedit_date DESC LIMIT 1";
  db.query(sqlQuery, [gameId, marketId], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, gameId:${gameId} marketId:${marketId}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else if (result.length <= 0) {
      logger.warn(
        `${req.originalUrl} request warning, market is not found in database, marketId:${marketId} gameId:${gameId}`
      );
      res.status(409).json({ message: "No markets found" });
    } else {
      logger.info(
        `${
          req.originalUrl
        } request successful, gameId:${gameId} marketId:${marketId} duration:${getDurationInMilliseconds(
          start
        )}`
      );
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

  logger.info("started getColorGameBetTotals");
  // Check if body is complete
  if (!gameId || !marketId) {
    logger.warn(
      `${req.originalUrl} request has missing body parameters, gameId:${gameId}`
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

  // Get game title
  sqlQueryTitle = "SELECT name from games where game_id = ? ";
  db.query(sqlQueryTitle, [gameId], (err, resultTitle) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process getTitle, gameId:${gameId} marketId:${marketId}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else {
      gameName = resultTitle[0].name;

      // Process 1
      // Get the totals for the markets on the bets table
      sqlQuery = `SELECT REPLACE(description, '${gameName} - ', '') as color, SUM(stake) as total FROM bets where market_id = ? GROUP BY description;`;
      db.query(sqlQuery, [marketId], (err, result) => {
        if (err) {
          logger.error(
            `${req.originalUrl} request has an error during process 1, gameId:${gameId} marketId:${marketId}, error:${err}`
          );
          res.status(500).json({ message: "Server error" });
        } else {
          // Process 2
          // Get Manipulate Values
          sqlQuery2 =
            "SELECT bb_manip_blue, bb_manip_yellow, bb_manip_red, bb_manip_white, bb_manip_green, bb_manip_purple FROM markets WHERE game_id = ? AND market_id = ? ORDER BY lastedit_date DESC LIMIT 1";
          db.query(sqlQuery2, [gameId, marketId], (err, result2) => {
            if (err) {
              logger.error(
                `${req.originalUrl} request has an error during process 2, gameId:${gameId} marketId:${marketId}, error:${err}`
              );
              res.status(500).json({ message: "Server error" });
            } else if (result2.length <= 0) {
              logger.warn(
                `${req.originalUrl} request warning, market is not found in database, marketId:${marketId} gameId:${gameId}`
              );
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
                  } else if (
                    colorValue === entry.color &&
                    colorValue === "GREEN"
                  ) {
                    totalAmount = entry.total + manipulateValues.bb_manip_green;
                    finalTotals.push({ color: colorValue, total: totalAmount });
                    inserted = true;
                  } else if (
                    colorValue === entry.color &&
                    colorValue === "BLUE"
                  ) {
                    totalAmount = entry.total + manipulateValues.bb_manip_blue;
                    finalTotals.push({ color: colorValue, total: totalAmount });
                    inserted = true;
                  } else if (
                    colorValue === entry.color &&
                    colorValue === "WHITE"
                  ) {
                    totalAmount = entry.total + manipulateValues.bb_manip_white;
                    finalTotals.push({ color: colorValue, total: totalAmount });
                    inserted = true;
                  } else if (
                    colorValue === entry.color &&
                    colorValue === "YELLOW"
                  ) {
                    totalAmount =
                      entry.total + manipulateValues.bb_manip_yellow;
                    finalTotals.push({ color: colorValue, total: totalAmount });
                    inserted = true;
                  } else if (
                    colorValue === entry.color &&
                    colorValue === "PURPLE"
                  ) {
                    totalAmount =
                      entry.total + manipulateValues.bb_manip_purple;
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
              logger.info(
                `${
                  req.originalUrl
                } request successful, gameId:${gameId} marketId:${marketId} duration:${getDurationInMilliseconds(
                  start
                )}`
              );
              res.status(200).json({
                message: "Bet Totals request is successful",
                data: finalTotals,
              });
            }
          });
        }
      });
    }
  });
});



// ***************************************************************
// Totalisator Game
//****************************************************************
app.post("/createTotalisatorMarket", (req, res) => {
  const start = process.hrtime();
  
  const apiKey = req.header("Authorization");
  const gameId = req.body.gameId;
  const description = req.body.description;
  const editor = req.body.editor;

  // Check if body is complete
  if (!gameId || !description || !editor) {
    logger.warn(
      `${req.originalUrl} request has missing body parameters, gameId:${gameId}`
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


  // Prcess 1: Get Latest Market Entry for GameID entered
  sqlQuery = "SELECT * FROM markets WHERE game_id = ? ORDER BY lastedit_date DESC LIMIT 1;"
  db.query(sqlQuery, [gameId], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, gameId:${gameId}, error:${err}`
      );
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
            logger.error(
              `${req.originalUrl} request has an error during process 2, gameId:${gameId}, error:${err}`
            );
            res.status(500).json({ message: "Server Error" });
          } else if (result2.affectedRows > 0) {
            logger.info(
              `${
                req.originalUrl
              } request successful, gameId:${gameId} marketId:${newMarketId} duration:${getDurationInMilliseconds(
                start
              )}`
            );
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
          logger.error(
            `${req.originalUrl} request has an error during process 3, gameId:${gameId}, error:${err}`
          );
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
                logger.error(
                  `${req.originalUrl} request has an error during process 4, gameId:${gameId}, error:${err}`
                );
                res.status(500).json({ message: "Server Error" });
              } else if (result4.affectedRows > 0) {
                logger.info(
                  `${
                    req.originalUrl
                  } request successful, gameId:${gameId} marketId:${newMarketId} duration:${getDurationInMilliseconds(
                    start
                  )}`
                );
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
      logger.warn(
        `${req.originalUrl} request warning, there is an unsettled market, marketId:${result[0].market_id} gameId:${gameId}`
      );
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
  })
})

app.post("/openTotalisatorMarket", (req, res) => {
  const start = process.hrtime();
  
  const apiKey = req.header("Authorization");
  const gameId = req.body.gameId;
  const marketId = req.body.marketId;
  const editor = req.body.editor;

  // Check if body is complete
  if (!gameId || !editor || !marketId) {
    logger.warn(`${req.originalUrl} request has missing body parameters, gameId:${gameId}`);
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  // Process 1 - Get Current Status of the Market
  sqlQuery = "SELECT * FROM markets WHERE game_id=? AND market_id=? ORDER BY lastedit_date DESC LIMIT 1";
  db.query(sqlQuery, [gameId, marketId], (err, result) => {
    if (err){
      logger.error(`${req.originalUrl} request has an error during process 1, marketId:${marketId} gameId:${gameId}, error:${err}`)
      res.status(500).json({ message: "Server error" });
    } else if (result.length === 0){
      logger.warn(`${req.originalUrl} request warning, market is not found in database, marketId:${marketId} gameId:${gameId}`)
      res.status(409).json({ message: "No market found for marketId:" + marketId });
    } else if (result[0].status !== 1){
      logger.warn(`${req.originalUrl} request warning, market is already open or settled, marketId:${marketId} gameId:${gameId}`)
      res.status(409).json({message: "Market is already open or settled",data: { marketId: marketId, status: result[0].status }});
    } else {
      
      // Process 2 - Insert into markets with new market status
      const description = result[0].description;
      sqlQuery = "INSERT INTO markets (market_id, game_id, description, status, lastedit_date, edited_by) VALUES (?, ?, ?, ?, NOW(), ?);"
      db.query(sqlQuery, [marketId, gameId, description, 0, editor], (err, result2) => {
        if (err) {
          logger.error(`${req.originalUrl} request has an error during process 2, marketId:${marketId} gameId:${gameId}, error:${err}`)
          res.status(500).json({ message: "Server Error" });
        } else if (result2.affectedRows > 0) {
          logger.info(`${req.originalUrl} request successful, gameId:${gameId} marketId:${marketId} duration:${getDurationInMilliseconds(start)}`)
          res.status(200).json({message: "Market opened successfully", data: { gameId: gameId, marketId: marketId, status: 0 }} )
        }
      });
    }
  })
})


app.post("/closeTotalisatorMarket", (req, res) => {
  const start = process.hrtime();
  
  const apiKey = req.header("Authorization");
  const gameId = req.body.gameId;
  const marketId = req.body.marketId;
  const editor = req.body.editor;

  // Check if body is complete
  if (!gameId || !editor || !marketId) {
    logger.warn(`${req.originalUrl} request has missing body parameters, gameId:${gameId}`);
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  // Process 1 - Get Current Status of the Market
  sqlQuery = "SELECT * FROM markets WHERE game_id=? AND market_id=? ORDER BY lastedit_date DESC LIMIT 1";
  db.query(sqlQuery, [gameId, marketId], (err, result) => {
    if (err){
      logger.error(`${req.originalUrl} request has an error during process 1, marketId:${marketId} gameId:${gameId}, error:${err}`)
      res.status(500).json({ message: "Server error" });
    } else if (result.length === 0){
      logger.warn(`${req.originalUrl} request warning, market is not found in database, marketId:${marketId} gameId:${gameId}`)
      res.status(409).json({ message: "No market found for marketId:" + marketId });
    } else if (result[0].status !== 0){
      logger.warn(`${req.originalUrl} request warning, market is already open or settled, marketId:${marketId} gameId:${gameId}`)
      res.status(409).json({message: "Market is already closed or settled",data: { marketId: marketId, status: result[0].status }});
    } else {
      
      // Process 2 - Insert into markets with new market status
      const description = result[0].description;
      sqlQuery = "INSERT INTO markets (market_id, game_id, description, status, lastedit_date, edited_by) VALUES (?, ?, ?, ?, NOW(), ?);"
      db.query(sqlQuery, [marketId, gameId, description, 1, editor], (err, result2) => {
        if (err) {
          logger.error(`${req.originalUrl} request has an error during process 2, marketId:${marketId} gameId:${gameId}, error:${err}`)
          res.status(500).json({ message: "Server Error" });
        } else if (result2.affectedRows > 0) {
          logger.info(`${req.originalUrl} request successful, gameId:${gameId} marketId:${marketId} duration:${getDurationInMilliseconds(start)}`)
          res.status(200).json({message: "Market closed successfully", data: { gameId: gameId, marketId: marketId, status: 1 }} )
        }
      });
    }
  })
})


app.post("/resultTotalisatorMarket", (req, res) => {
  const start = process.hrtime();
  
  const apiKey = req.header("Authorization");
  const gameId = req.body.gameId;
  const marketId = req.body.marketId;
  const marketResult = req.body.result;
  const editor = req.body.editor;

  // Check if body is complete
  if (!gameId || !editor || !marketId || !marketResult) {
    logger.warn(`${req.originalUrl} request has missing body parameters, gameId:${gameId}`);
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  // Process 1 - Get current status of market
  sqlQuery = "SELECT * FROM markets WHERE game_id = ? AND market_id = ? ORDER BY lastedit_date DESC LIMIT 1;"
  db.query(sqlQuery, [gameId, marketId], (err, result) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, marketId:${marketId} gameId:${gameId}, error:${err}`);
      res.status(500).json({ message: "Server error" });
    } else if (result.length <= 0) {
      logger.warn(`${req.originalUrl} request warning, market is not found in database, marketId:${marketId} gameId:${gameId}`);
      res.status(409).json({ message: "No market found for marketId:" + marketId });
    } else if (result[0].status !== 1) {
      logger.warn(`${req.originalUrl} request warning, market is still open or already settled, marketId:${marketId} gameId:${gameId}`);
      res.status(409).json({
        message: "Market is still open or already settled",
        data: { marketId: marketId, status: result[0].status },
      });
    } else {
      const description = result[0].description;
      const resultText = marketResult.toString();

      sqlQuery = "INSERT INTO markets (market_id, game_id, description, status, result, settled_date, lastedit_date, edited_by) VALUES (?,?,?,2, ?, NOW(), NOW(), ?)"
      db.query(sqlQuery, [marketId, gameId, description, marketResult, editor], (err, result2) => {
        if (err) {
          logger.error(`${req.originalUrl} request has an error during process 2, marketId:${marketId} gameId:${gameId}, error:${err}`);
          res.status(500).json({ message: "Server Error" });
        } else if (result2.affectedRows > 0) {
          logger.info(`${req.originalUrl} request successful, gameId:${gameId} marketId:${marketId} duration:${getDurationInMilliseconds(start)}`);
          res.status(200).json({
            message: "Market resulted successfully",
            data: {
              gameId: gameId,
              marketId: marketId,
              status: 2,
              result: resultText,
            },
          });
        }
      });
    }
  })
});



// Manipulate Bet will still change on refresh of admin as long as both has bets
app.post("/updateTotalisatorOdds", (req, res) => {
  const start = process.hrtime()
  const apiKey = req.header("Authorization") 
  const gameId = req.body.gameId
  const marketId = req.body.marketId
  const gameName = req.body.gameName
  const commission = req.body.commission
  const manipOdd1 = req.body.manipOdd1
  const manipOdd2 = req.body.manipOdd2
  const choice1 = req.body.choice1
  const choice2 = req.body.choice2

  // Check if body is complete
  if (!gameId || !marketId || !commission || !gameName || !choice1 || !choice2) {
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


  // Pula Puti
  // Odd1 - Pula, Odd2 - Puti
  var odd1Total = 0 
  var odd2Total = 0
  var drawTotal = 0
  var odd1 = 0
  var odd2 = 0


  // Process 1
  sqlQuery = `SELECT REPLACE(description, '${gameName} - ', '') as choice, SUM(stake) as total from bets where market_id = ? and game_id = ? group by description;`
  db.query(sqlQuery, [marketId, gameId], (err, result) => {
    if (err) {
        logger.error(`${req.originalUrl} request has an error during process 1, error:${err}`)
        res.status(500).json({ message: "Server error" });
    } else {
        for ( row in result ) {
          if (result[row].choice === choice1){
            odd1Total += result[row].total
          } else if (result[row].choice === choice2){
            odd2Total += result[row].total 
          } else {
            drawTotal = result[row].total 
          }
        }

        odd1Total = odd1Total === 0 ? parseFloat(manipOdd1) : odd1Total
        odd2Total = odd2Total === 0 ? parseFloat(manipOdd2) : odd2Total
  
        var total = odd1Total + odd2Total + drawTotal
        var totalAfterCommission = total - (total * (parseFloat(commission)) / 100)
        
        odd1 = (totalAfterCommission/odd1Total).toFixed(2)
        odd2 = (totalAfterCommission/odd2Total).toFixed(2)

        // Process 1
        // Update the commission
        sqlQuery =  "SELECT * FROM totalisator WHERE market_id = ? AND game_id = ? ORDER BY placement_date DESC LIMIT 1";
        db.query(sqlQuery, [marketId, gameId], (err, result4) => {
          if (err) {
            logger.error(`${req.originalUrl} request has an error during process 1, gameId:${gameId}, error:${err}`);
          } else if (result4.length <= 0) {
            console.log(result4, "process1")
            // If no existing entry for totalisator, insert with manipulated
            sqlInsertQuery = "INSERT INTO totalisator (market_id, game_id, odd1, odd2, placement_date) VALUES (?,?,?,?, NOW())"
            db.query(sqlInsertQuery, [marketId, gameId, odd1, odd2], (err, result2) => {
              if (err) {
                logger.error(`${req.originalUrl} request has an error during process 3, marketId:${marketId} gameId:${gameId}, error:${err}`)
                res.status(500).json({ message: "Server error" });
              } else {
                logger.info(`${req.originalUrl} successfully updated odds for market:${marketId} to odds: ${odd1} - ${odd2}`)
                res.status(200).json({message: "Updates totalisator odds", odd1: parseFloat(odd1), odd2: parseFloat(odd2)})
              }
            })
          } else {
            // Check if old is same as new before inserting
            var oldOdd1 = parseFloat(result4[0].odd1)
            var oldOdd2 = parseFloat(result4[0].odd2)

            if (parseFloat(odd1).toFixed(2) !== oldOdd1.toFixed(2) || parseFloat(odd2).toFixed(2) !== oldOdd2.toFixed(2)){
              sqlInsertQuery = "INSERT INTO totalisator (market_id, game_id, odd1, odd2, placement_date) VALUES (?,?,?,?, NOW())"
              db.query(sqlInsertQuery, [marketId, gameId, odd1, odd2], (err, result2) => {
                if (err) {
                  logger.error(`${req.originalUrl} request has an error during process 3, marketId:${marketId} gameId:${gameId}, error:${err}`)
                  res.status(500).json({ message: "Server error" });
                } else {
                  logger.info(`${req.originalUrl} successfully updated odds for market:${marketId} to odds: ${odd1} - ${odd2}`)
                  res.status(200).json({message: "Updates totalisator odds", odd1: parseFloat(odd1), odd2: parseFloat(odd2)})
                }
              })
            } else {
              res.status(200).json({message: "Updates totalisator odds but nothing changed", odd1: parseFloat(odd1), odd2: parseFloat(odd2)})
            }
          }
        });
    }       
  })
});

app.post("/updateTotalisatorDrawMultiplier", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");
  const gameId = req.body.gameId;
  const multiplier = req.body.multiplier;
  const editor = req.body.editor;

  // Check if body is complete
  if (!gameId || !multiplier || !editor) {
    logger.warn(`${req.originalUrl} request has missing body parameters, gameId:${gameId}`);
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
  // Update the commission
  sqlQuery =  "UPDATE games set win_multip1 = ?, lastedit_date = NOW(), edited_by = ? WHERE game_id = ?";
  db.query(sqlQuery, [multiplier, editor, gameId], (err, result) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, gameId:${gameId}, error:${err}`);
      res.status(500).json({ message: "Server error" });
    } else if (result.affectedRows <= 0) {
      logger.warn(`${req.originalUrl} request warning, game is not found in database, gameId:${gameId}`);
      res.status(409).json({ message: "Nothing was updated, please check gameId" });
    } else {
      logger.info(`${req.originalUrl} request successful, gameId:${gameId} duration:${getDurationInMilliseconds(start)}`);
      res.status(200).json({
        message: "Request successful",
        data: { gameId: gameId, multiplier: multiplier},
      });
    }
  });
});

app.get("/getTotalisatorOdds/:gameId/:marketId", (req, res) => {
  const start = process.hrtime();

  const apiKey = req.header("Authorization");
  const gameId = req.params.gameId;
  const marketId = req.params.marketId;

  // Check if body is complete
  if (!gameId || !marketId ) {
    logger.warn(`${req.originalUrl} request has missing body parameters, gameId:${gameId}`);
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
  // Update the commission
  sqlQuery =  "SELECT * FROM totalisator WHERE market_id = ? AND game_id = ? ORDER BY placement_date DESC LIMIT 1";
  db.query(sqlQuery, [marketId, gameId], (err, result) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, gameId:${gameId}, error:${err}`);
      res.status(500).json({ message: "Server error" });
    } else if (result.length <= 0){
      logger.info(`${req.originalUrl} request successful, gameId:${gameId} duration:${getDurationInMilliseconds(start)}`);
      res.status(200).json({
        message: "Request successful",
        data: { gameId: gameId, marketId: marketId, odds: result},
      });
    } 
    else {
      logger.info(`${req.originalUrl} request successful, gameId:${gameId} duration:${getDurationInMilliseconds(start)}`);
      res.status(200).json({
        message: "Request successful",
        data: { gameId: gameId, marketId: marketId, odds: result},
      });
    }
  });
});


app.listen(4004, () => {
  console.log("Backend Game Manager listentning at port 4004");
});
