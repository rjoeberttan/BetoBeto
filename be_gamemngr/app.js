//jshint esversion: 6
const express = require("express");
const mysql = require("mysql");
const { createLogger, transports, format } = require("winston");
require("dotenv").config();

// Configure Express Application
const app = express();
app.use(express.json());
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
});

// GET getGamesList
// Requires: apiKey
// Responses:
//  401 - Unauthorized Request
//  500 - Server Error
//  200 - Successful
app.get("/getGamesList", (req, res) => {
  const apiKey = req.body.apiKey;

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn("getGamesList request has missing/wrong API_KEY");
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  // Process 1. Get All games from database
  var sqlQuery = "SELECT game_id, name, min_bet, max_bet, is_live FROM games";
  db.query(sqlQuery, [], (err, result) => {
    if (err) {
      logger.error("Process 1: Error in getGamesList request. err:" + err);
      res.status(500).json({ message: "Server Error /getGamesList" });
    } else if (result) {
      console.log("Successful /getGamesList request");
      res.status(200).json({ message: "Request successful", data: result });
    }
  });
});

app.get("/getGameDetails", (req, res) => {
  const apiKey = req.body.apiKey;
  const gameId = req.body.gameId;

  // Check if body is complete
  if (!gameId) {
    logger.warn("getGameDetails request has missing body parameters");
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn("getGamesList request has missing/wrong API_KEY");
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  // Process 1
  // Select the game details from the database
  sqlQuery = "SELECT * FROM games WHERE game_id = ?";
  db.query(sqlQuery, [gameId], (err, result) => {
    if (err) {
      logger.error("Process 1: Error in getGamesDetails request." + err);
      res.status(500).json({ message: "Server error" });
    } else if (result.length <= 0) {
      logger.warn(
        "Warn in getGamesDetails request. gameId is not found. gameId:" + gameId
      );
      res.status(409).json({ message: "gameId not found" });
    } else {
      logger.info("Successful getGamesDetails request, gameId:" + gameId);
      res.status(200).json({ message: "Request successful", data: result[0] });
    }
  });
});

app.post("/updateLiveStatus", (req, res) => {
  const apiKey = req.body.apiKey;
  const gameId = req.body.gameId;
  const status = req.body.status; // Current Status
  const editor = req.body.editor;

  // Check if body is complete
  if (!gameId || !status || !editor) {
    logger.warn("updateLiveStatus request has missing body parameters");
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn("updateLiveStatus request has missing/wrong API_KEY");
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
      logger.error("Process 1: Error in updateLiveStatus request." + err);
      res.status(500).json({ message: "Server error" });
    } else if (result.affectedRows <= 0) {
      logger.warn(
        "Nothing changed after updateLiveStatus request for gameId:" + gameId
      );
      res
        .status(409)
        .json({ message: "Nothing was updated, please check gameId" });
    } else {
      logger.info(
        "Successful updateLiveStatus request for gameId:" +
          gameId +
          " updated live status to:" +
          newStatus
      );
      res
        .status(200)
        .json({
          message: "Request successful",
          data: { gameId: gameId, status: newStatus },
        });
    }
  });
});

app.post("/updateStreamURL", (req, res) => {
  const apiKey = req.body.apiKey;
  const gameId = req.body.gameId;
  const url = req.body.url; // Current Status
  const editor = req.body.editor;

  // Check if body is complete
  if (!gameId || !url || !editor) {
    logger.warn("updateStreamURL request has missing body parameters");
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn("updateStreamURL request has missing/wrong API_KEY");
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  // Process 1
  // Update the url
  sqlQuery =
    "UPDATE games set youtube_url = ?, lastedit_date = NOW(), edited_by = ? WHERE game_id = ?";
  db.query(sqlQuery, [url, editor, gameId], (err, result) => {
    if (err) {
      logger.error("Process 1: Error in updateStreamURL request." + err);
      res.status(500).json({ message: "Server error" });
    } else if (result.affectedRows <= 0) {
      logger.warn(
        "Nothing changed after updateStreamURL request for gameId:" + gameId
      );
      res
        .status(409)
        .json({ message: "Nothing was updated, please check gameId" });
    } else {
      logger.info(
        "Successful updateStreamURL request for gameId:" +
          gameId +
          " updated url status to:" +
          url
      );
      res
        .status(200)
        .json({
          message: "Request successful",
          data: { gameId: gameId, url: url },
        });
    }
  });
});

app.post("/updateColorGameWinMultiplier", (req, res) => {
  const apiKey = req.body.apiKey;
  const gameId = req.body.gameId;
  const winMultiplier = req.body.winMultiplier; // Current Status
  const editor = req.body.editor;

  // Check if body is complete
  if (!gameId || !winMultiplier || !editor || winMultiplier.length !== 3) {
    logger.warn(
      "updateColorGameWinMultiplier request has missing body parameters"
    );
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(
      "updateColorGameWinMultiplier request has missing/wrong API_KEY"
    );
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  sqlQuery =
    "UPDATE games SET win_multip1 = ?, win_multip2 = ?, win_multip3 = ?, lastedit_date = NOW(), edited_by = ? WHERE game_id = ?";
  db.query(sqlQuery, [...winMultiplier, editor, gameId], (err, result) => {
    if (err) {
      logger.error(
        "Process 1: Error in updateColorGameWinMultiplier request." + err
      );
      res.status(500).json({ message: "Server error" });
    } else if (result.affectedRows <= 0) {
      logger.warn(
        "Nothing changed after updateColorGameWinMultiplier request for gameId:" +
          gameId
      );
      res
        .status(409)
        .json({ message: "Nothing was updated, please check gameId" });
    } else {
      logger.info(
        "Successful updateColorGameWinMultiplier request for gameId:" +
          gameId +
          " updated winMultipliers status to:" +
          winMultiplier
      );
      res
        .status(200)
        .json({
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
  const apiKey = req.body.apiKey;
  const gameId = req.body.gameId;
  const description = req.body.description;
  const editor = req.body.editor;

  // Check if body is complete
  if (!gameId || !description || !editor) {
    logger.warn("createColorGameMarket request has missing body parameters");
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn("createColorGameMarket request has missing/wrong API_KEY");
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  // Process 1: Get Latest Market entry for GameID entered
  sqlQuery =
    "SELECT * FROM markets WHERE game_id = ? ORDER BY lastedit_date DESC LIMIT 1";
  db.query(sqlQuery, [gameId], (err, result) => {
    if (err) {
      logger.error("Process 1: Error in createColorGameMarket request." + err);
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
              "Process 2: Error during /createColorGameMarket:" + err
            );
            res.status(500).json({ message: "Server Error" });
          } else if (result2.affectedRows > 0) {
            logger.info(
              "Successful /createColorGameMarket request for gameId:" +
                gameId +
                " marketId:" +
                newMarketId
            );
            res
              .status(200)
              .json({
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
          logger.error("Process 3: Error during /createColorGameMarket:" + err);
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
                  "Process 4: Error during /createColorGameMarket:" + err
                );
                res.status(500).json({ message: "Server Error" });
              } else if (result4.affectedRows > 0) {
                logger.info(
                  "Successful /createColorGameMarket request for gameId:" +
                    gameId +
                    " marketId:" +
                    newMarketId
                );
                res
                  .status(200)
                  .json({
                    msg: "Successfully Created New Market.",
                    data: { gameID: gameId, marketID: newMarketId, status: 0 },
                  });
              }
            }
          );
        }
      });
    } else if (result[0].status < 2) {
      logger.warn(
        "Warn for /createColorGameMarket request. There are still unsettled market for gameId:" +
          gameId +
          " marketId:" +
          result[0].market_id
      );
      res
        .status(409)
        .json({
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
  const apiKey = req.body.apiKey;
  const gameId = req.body.gameId;
  const marketId = req.body.marketId;
  const editor = req.body.editor;

  // Check if body is complete
  if (!gameId || !editor || !marketId) {
    logger.warn("closeMarket request has missing body parameters");
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn("closeMarket request has missing/wrong API_KEY");
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
        "Process 1: Error in closeMarket request. for marketId:" + marketId + " " +err
      );
      res.status(500).json({ message: "Server error" });
    } else if (result.length === 0) {
      logger.warn(
        "Warn for /closeMarket request, marketId not found, marketId:" +
          marketId
      );
      res
        .status(409)
        .json({ message: "No market found for marketId:" + marketId });
    } else if (result[0].status != 0) {
      logger.warn(
        "Warn for /closeMarket request, market is already either settled or closed, marketId:" +
          marketId
      );
      res
        .status(409)
        .json({
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
        db.query(sqlQuery, [marketId, gameId, description, 1, blue, yellow, red, white, green, purple, editor], (err, result2) => {
          if (err){
            logger.error("Process 2: Error in closeMarket request. for marketId:" + marketId + " " + err );
            res.status(500).json({message: "Server Error"})
          } else if (result2.affectedRows > 0){
            logger.info("Successful /closeMarket request for marketId:" + marketId)
            res.status(200).json({message: "Market closed successfully", data: {gameId: gameId, marketId: marketId, status: 1}})
          }
        })
      }
  });
});



app.post("/openMarket", (req, res) => {
  const apiKey = req.body.apiKey;
  const gameId = req.body.gameId;
  const marketId = req.body.marketId;
  const editor = req.body.editor;

  // Check if body is complete
  if (!gameId || !editor || !marketId) {
    logger.warn("closeMarket request has missing body parameters");
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn("closeMarket request has missing/wrong API_KEY");
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
        "Process 1: Error in openMarket request. for marketId:" + marketId + " " +err
      );
      res.status(500).json({ message: "Server error" });
    } else if (result.length === 0) {
      logger.warn(
        "Warn for /openMarket request, marketId not found, marketId:" +
          marketId
      );
      res
        .status(409)
        .json({ message: "No market found for marketId:" + marketId });
    } else if (result[0].status != 1) {
      logger.warn(
        "Warn for /openMarket request, market is already either settled or open, marketId:" +
          marketId
      );
      res
        .status(409)
        .json({
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
        db.query(sqlQuery, [marketId, gameId, description, 0, blue, yellow, red, white, green, purple, editor], (err, result2) => {
          if (err){
            logger.error("Process 2: Error in openMarket request. for marketId:" + marketId + " " + err );
            res.status(500).json({message: "Server Error"})
          } else if (result2.affectedRows > 0){
            logger.info("Successful /openMarket request for marketId:" + marketId)
            res.status(200).json({message: "Market opened successfully", data: {gameId: gameId, marketId: marketId, status: 1}})
          }
        })
      }
  });
})


app.post("/resultMarket", (req, res) => {
  const apiKey = req.body.apiKey;
  const gameId = req.body.gameId;
  const marketId = req.body.marketId;
  const marketResult = req.body.result;
  const editor = req.body.editor;


  // Check if body is complete
  if (!gameId || !editor || !marketId || marketResult.length !== 3) {
    logger.warn("resultMarket request has missing body parameters");
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn("resultMarket request has missing/wrong API_KEY");
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }


  // Process 1
  // Get current status of the market
  sqlQuery = "SELECT * FROM markets WHERE game_id = ? AND market_id = ? ORDER BY lastedit_date DESC LIMIT 1";
  db.query(sqlQuery, [gameId, marketId], (err, result) => {
    if (err) {
      logger.error("Process 1: Error in resultMarket request. for marketId:" + marketId + " " +err);
      res.status(500).json({ message: "Server error" });
    } else if (result.length <= 0){
      logger.warn("Warn for /resultMarket request, marketId not found, marketId:" + marketId);
      res.status(409).json({ message: "No market found for marketId:" + marketId });
    } else if (result[0].status !== 1) {
      logger.warn("Warn for /resultMarket request, market is already either settled or still open, marketId:" + marketId );
      res.status(409).json({ message: "Market is still open or already settled", data: { marketId: marketId, status: result[0].status } });
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
        const resultText = marketResult.toString()    

        sqlQuery = "INSERT INTO markets (market_id, game_id, description, status, result, bb_manip_blue, bb_manip_yellow, bb_manip_red, bb_manip_white, bb_manip_green, bb_manip_purple, settled_date, lastedit_date, edited_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)";
        db.query(sqlQuery, [marketId, gameId, description, 2, resultText, blue, yellow, red, white, green, purple, editor], (err, result2) => {
          if (err){
            logger.error("Process 2: Error in resultMarket request. for marketId:" + marketId + " " + err );
            res.status(500).json({message: "Server Error"})
          } else if (result2.affectedRows > 0){
            logger.info("Successful /resultMarket request for marketId:" + marketId)
            res.status(200).json({message: "Market resulted successfully", data: {gameId: gameId, marketId: marketId, status: 2, result: resultText}})
          }
        })        
    }
  })
})


app.get("/getLatestMarketDetails", (req, res) => {
  const apiKey = req.body.apiKey;
  const gameId = req.body.gameId;

  // Check if body is complete
  if (!gameId) {
    logger.warn("getLatestMarketDetails request has missing body parameters");
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn("getLatestMarketDetails request has missing/wrong API_KEY");
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  // Process 1
  // Get latest market detail
  sqlQuery = "SELECT market_id, game_id, description, status FROM markets WHERE game_id = ? ORDER BY lastedit_date DESC LIMIT 1"
  db.query(sqlQuery, [gameId], (err, result) => {
    if (err) {
      logger.error("Process 1: Error in getLatestMarketDetails request. for gameId:" + gameId + " " +err);
      res.status(500).json({ message: "Server error" });
    } else if (result.length <= 0) {
      logger.warn("Warn in getLatestMarketDetails request for gameId:" + gameId);
      res.status(409).json({ message: "No markets found" });
    } else {
      logger.info("Successful getLatestMarketDetails request for gameId:" + gameId )
      res.status(200).json({message: "Request successful", data: {market: result}})
    }
  })
})



app.post("/manipulateBetTotals", (req, res) => {
  const apiKey = req.body.apiKey
  const marketId = req.body.marketId;
  const editor = req.body.editor;
  const bb_manip = req.body.bb_manip; // array[0-5] in order of blue,yellow,red,white,green,purple

  // Check if body is complete
  if (!marketId || !editor || !bb_manip || bb_manip.length !== 6)  {
    logger.warn("manipulateBetTotals request has missing body parameters");
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn("manipulateBetTotals request has missing/wrong API_KEY");
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }


  // Process 1
  // Check if the market Id exists
  sqlQuery = "SELECT * FROM markets where market_id = ? ORDER BY lastedit_date DESC LIMIT 1"
  db.query(sqlQuery, [marketId], (err, result) => {
    if (err) {
      logger.error("Process 1: Error in manipulateBetTotals request. for marketId:" + marketId + " " +err);
      res.status(500).json({ message: "Server error" });
    } else if (result.length <= 0){
      logger.warn("Warn in manipulateBetTotals request for marketId:" + marketId);
      res.status(409).json({ message: "No markets found" });
    } else {

      // Process 2
      // Just update the latest row
      const rowId = result[0].id
      sqlQuery = "UPDATE markets SET bb_manip_blue = ?, bb_manip_yellow = ?, bb_manip_red = ?, bb_manip_white = ?, bb_manip_green = ?, bb_manip_purple = ? WHERE id = ?"
      db.query(sqlQuery, [...bb_manip, rowId], (err, result2) => {
        if (err) {
          logger.error("Process 2: Error in manipulateBetTotals request. for marketId:" + marketId + " " + err);
          res.status(500).json({ message: "Server error" });
        } 
        else if (result.affectedRows <= 0){
          logger.warn("Warn in manipulateBetTotals request, nothing was updated. for marketId:" + marketId );
          res.status(409).json({ message: "Update not Successful" });
        } 
        else {
          logger.info("Successful manipulateBetTotals request, for marketId:" + marketId )
          res.status(200).json({message: "Successful manipulateBetTotals request", data: {bb_manip_values: bb_manip}})
        }
      })
    }
  })
})


app.get("/getManipulateValues", (req,res) => {
  const apiKey = req.body.apiKey;
  const gameId = req.body.gameId;
  const marketId = req.body.marketId

  // Check if body is complete
  if (!gameId || !marketId) {
    logger.warn("getManipulateValues request has missing body parameters");
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn("getManipulateValues request has missing/wrong API_KEY");
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  // Process 1
  // Get latest market detail
  sqlQuery = "SELECT bb_manip_blue, bb_manip_yellow, bb_manip_red, bb_manip_white, bb_manip_green, bb_manip_purple FROM markets WHERE game_id = ? AND market_id = ? ORDER BY lastedit_date DESC LIMIT 1"
  db.query(sqlQuery, [gameId, marketId], (err, result) => {
    if (err) {
      logger.error("Process 1: Error in getManipulateValues request. for gameId:" + gameId + " " +err);
      res.status(500).json({ message: "Server error" });
    } else if (result.length <= 0) {
      logger.warn("Warn in getManipulateValues request for gameId:" + gameId);
      res.status(409).json({ message: "No markets found" });
    } else {
      logger.info("Successful getManipulateValues request for gameId:" + gameId )
      res.status(200).json({message: "Request successful", data: {market: result}})
    }
  })
})


app.get("/getColorGameBetTotals", (req, res) => {
  const apiKey = req.body.apiKey;
  const gameId = req.body.gameId;
  const marketId = req.body.marketId;
  
  // Check if body is complete
  if (!gameId || !marketId ) {
      logger.warn("resultMarket request has missing body parameters");
      res.status(400).json({ message: "Missing body parameters" });
      return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
      logger.warn("resultMarket request has missing/wrong API_KEY");
      res.status(401).json({ message: "Unauthorized Request" });
      return;
  }

  // Process 1
  // Get the totals for the markets on the bets table
  sqlQuery = "SELECT REPLACE(description, 'Color Game - ', '') as color, SUM(stake) as total FROM bets where market_id = ? GROUP BY description;"
  db.query(sqlQuery, [marketId], (err,result) => {
      if (err) {
          logger.error("Process 1: Error in getColorGameBetTotals request for marketId:" + marketId + " " +err);
          res.status(500).json({ message: "Server error" });
      } else {
          console.log(result)

          // Process 2
          // Get Manipulate Values
          sqlQuery2 = "SELECT bb_manip_blue, bb_manip_yellow, bb_manip_red, bb_manip_white, bb_manip_green, bb_manip_purple FROM markets WHERE game_id = ? AND market_id = ? ORDER BY lastedit_date DESC LIMIT 1"
          db.query(sqlQuery2, [gameId, marketId], (err, result2) => {
              if (err) {
                  logger.error("Process 2: Error in getColorGameBetTotals request for marketId:" + marketId + " " +err);
                  res.status(500).json({ message: "Server error" });
              } else if (result.length <= 0){
                  logger.warn("Warn for getColorGameBetTotals, game not found gameId:" + gameId)
                  res.status(409).json({message: "Cannot calculate bet totals. Game not found", data: {gameId: gameId}})
              } else {
                  
                  const colorTotal = result
                  const manipulateValues = result2[0]
                  // const finalBetTotals = [{color, total}]
                  colors = ["BLUE", "WHITE", "RED", "GREEN", "YELLOW", "PURPLE"]
                  finalTotals = []
                  colors.forEach((colorValue) => {
                      inserted = false;
                      colorTotal.forEach((entry) => {
                          if ((colorValue === entry.color) && (colorValue === "RED")) {
                              totalAmount = entry.total + manipulateValues.bb_manip_red
                              finalTotals.push({color: colorValue, total: totalAmount})
                              inserted = true;
                          } else if ((colorValue === entry.color) && (colorValue === "GREEN")) {
                              totalAmount = entry.total + manipulateValues.bb_manip_green
                              finalTotals.push({color: colorValue, total: totalAmount})
                              inserted = true;
                          } else if ((colorValue === entry.color) && (colorValue === "BLUE")) {
                              totalAmount = entry.total + manipulateValues.bb_manip_blue
                              finalTotals.push({color: colorValue, total: totalAmount})
                              inserted = true;
                          } else if ((colorValue === entry.color) && (colorValue === "WHITE")) {
                              totalAmount = entry.total + manipulateValues.bb_manip_white
                              finalTotals.push({color: colorValue, total: totalAmount})
                              inserted = true;
                          } else if ((colorValue === entry.color) && (colorValue === "YELLOW")) {
                              totalAmount = entry.total + manipulateValues.bb_manip_yellow
                              finalTotals.push({color: colorValue, total: totalAmount})
                              inserted = true;
                          } else if ((colorValue === entry.color) && (colorValue === "PURPLE")) {
                              totalAmount = entry.total + manipulateValues.bb_manip_purple
                              finalTotals.push({color: colorValue, total: totalAmount})
                              inserted = true;
                          } 
                      })

                      if (!inserted) {
                          if (colorValue === "RED") {
                              totalAmount = manipulateValues.bb_manip_red
                              finalTotals.push({color: colorValue, total: totalAmount})
                              inserted = true;
                          } else if (colorValue === "GREEN") {
                              totalAmount =  manipulateValues.bb_manip_green
                              finalTotals.push({color: colorValue, total: totalAmount})
                              inserted = true;
                          } else if (colorValue === "BLUE") {
                              totalAmount = manipulateValues.bb_manip_blue
                              finalTotals.push({color: colorValue, total: totalAmount})
                              inserted = true;
                          } else if  (colorValue === "WHITE") {
                              totalAmount =  manipulateValues.bb_manip_white
                              finalTotals.push({color: colorValue, total: totalAmount})
                              inserted = true;
                          } else if (colorValue === "YELLOW") {
                              totalAmount =  manipulateValues.bb_manip_yellow
                              finalTotals.push({color: colorValue, total: totalAmount})
                              inserted = true;
                          } else if  (colorValue === "PURPLE") {
                              totalAmount = manipulateValues.bb_manip_purple
                              finalTotals.push({color: colorValue, total: totalAmount})
                              inserted = true;
                          } 
                      }
                  })

                  console.log(finalTotals)
                  res.status(200).json({message: "Bet Totals request is successful", data: finalTotals})                    
              }
          })
      }
  })

})

app.listen(4004, () => {
  console.log("Backend Game Manager listentning at port 4004");
});
