//jshint esversion: 6
const express = require("express");
const mysql = require("mysql");
const helmet = require("helmet");
const cors = require("cors");
const { createLogger, transports, format } = require("winston");
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
const logger = createLogger({
    format: format.combine(
      format.timestamp({ format: "MMM-DD-YYYY HH:mm:ss" }),
      format.printf(
        (info) =>
          `${info.timestamp} || ${info.level.toUpperCase()} || ${info.message}`
      )
    ),
    transports: [
      new transports.File({ filename: "/var/log/app/sakla.log" }),
    ],
  });

// Configure Database Connection
const db_pool = mysql.createPool({
  connectionLimit: process.env.MYSQL_CONN_LIMIT,
  queueLimit: process.env.MYSQL_QUEUE_LIMIT,
  user: process.env.MYSQL_USERNAME,
  host: process.env.MYSQL_HOST,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT,
});

//
const getDurationInMilliseconds = (start) => {
  const NS_PER_SEC = 1e9;
  const NS_TO_MS = 1e6;
  const diff = process.hrtime(start);

  return `${((diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS).toFixed(2)}ms`;
};

function checkApiKey(reqApiKey) {
  if (reqApiKey !== process.env.API_KEY) {
    return false;
  } else {
    return true;
  }
}

async function getLatestMarketFromGame(gameId){
  return new Promise((resolve, reject) => {
    sqlQuery = "SELECT * FROM markets WHERE game_id = ? ORDER BY lastedit_date DESC LIMIT 1"
    db_pool.query(sqlQuery, [gameId], (err, result) => {
      if (err) {
        logger.error(`Error in getting latest market for gameId: ${gameId} error: ${err}`)
        return (reject(err.message))
      } else {
        return (resolve(result))
      }
    })
  })
}

async function getLatestMarketId(){
  return new Promise((resolve, reject) => {
    sqlQuery = "SELECT market_id FROM markets ORDER BY market_id DESC LIMIT 1"
    db_pool.query(sqlQuery, (err, result) => {
      if (err) {
        logger.error(`Error in getting latest market for gameId: ${gameId} error: ${err}`)
        return (reject(err.message))
      } else {
        return (resolve(result))
      }
    })
  })
}

async function insertNewMarket(marketId, gameId, description, editor){
  return new Promise((resolve, reject) => {
    sqlQuery = "INSERT INTO markets (market_id, game_id, description, status, lastedit_date, edited_by) VALUES (?, ?, ?, ?,  NOW(), ?)"
    db_pool.query(sqlQuery, [marketId, gameId, description, 0, editor], (err, result) => {
        if (err) {
          logger.error(`Error in inserting new market marketId:${marketId} gameId:${gameId}, error:${err}`)
          return (reject(err.message))
        } else {
          return (resolve(result))
        }
    })
  })
}

async function getMarketStatus(marketId, gameId){
  return new Promise((resolve, reject) => {
    sqlQuery = "SELECT status, description from markets WHERE market_id = ? and game_id = ? ORDER BY lastedit_date DESC LIMIT 1"
    db_pool.query(sqlQuery, [marketId, gameId,], (err, result) => {
        if (err) {
          logger.error(`Error in getting latest market status marketId:${marketId} gameId:${gameId}, error:${err}`)
          return (reject(err.message))
        } else {
          return (resolve(result))
        }
    })
  })
} 

async function updateMarketStatus(marketId, gameId, description, status, editor, marketResult) {
  return new Promise((resolve, reject) => {
    sqlQuery = "INSERT INTO markets (market_id, game_id, description, status, result, lastedit_date, edited_by) VALUES (?, ?, ?, ?, ?, NOW(), ?)"
    db_pool.query(sqlQuery, [marketId, gameId, description, status, marketResult, editor], (err, result) => {
        if (err) {
          logger.error(`Error in updating market status marketId:${marketId} gameId:${gameId}, error:${err}`)
          return (reject(err.message))
        } else {
          logger.info(`Updated Market Status to status:${status} for marketId:${marketId} gameId:${gameId}`)
          return (resolve(result))
        }
    })
  })
}

app.post("/createMarket", async (req, res) => {
  const startTime = process.hrtime();

  // Headers and Data
  const apiKey = req.header("Authorization");
  const gameId = req.body.gameId;
  const gameName = req.body.gameName;
  const editor = req.body.editor;

  // Check if apiKey is correct
  if (!checkApiKey(apiKey)) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received ${apiKey}, body: ${JSON.stringify(req.body)}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return
  }

  // Check if Body is complete
  if (!gameId || !gameName || !editor) {
    logger.warn(logger.warn(`${req.originalUrl} request has missing parameters, body: ${JSON.stringify(req.body)}`));
    res.status(422).json({ message: "Request has missing parameters"});
    return
  }

  // Get Latest Market entry for GameID Entered
  logger.info(`${req.originalUrl} started ${JSON.stringify(req.body)}`)

  const market =  await getLatestMarketFromGame(gameId)
    .catch((error) => {
        res.status(500).json({message: "Server Error"})
    })

  // Process if NO EXISTING MARKET
  if (market.length === 0 || market[0].status === 2) {
    logger.info(`Creating new market for gameId:${gameId}`)
    // Get Latest Market ID
    const latestMarket = await getLatestMarketId(gameId)
    const latestMarketId = parseInt(latestMarket[0].market_id)
    const nextMarketId = latestMarketId + 1

    // Insert New Market
    logger.info(`Inserting new market with id: ${nextMarketId} on gameId:${gameId}`)
    const insertedMarket = await insertNewMarket(nextMarketId, gameId, gameName, editor)
      .catch((error) => {
        res.status(500).json({message: "Server Error"})
      })
  
    logger.info(`Successfully created new market:${nextMarketId} gameId:${gameId} duration:${getDurationInMilliseconds(startTime)}`)
    res.status(200).json({message: "Successfully created new market", data: {gameId: parseInt(gameId), marketId: nextMarketId, status: 0}})
  }
  

  // Process if EXISTING MARKET
  const marketStatus = market[0].status
  if (marketStatus !== 2) {
    // Market is still unsettled
    logger.warn(`${req.originalUrl} request warning, unsettled market but tried to create a new one, gameId:${gameId} marketId:${market[0].market_id}`)
    res.status(409).json({message: "Latest market is still unsettled. Settle first before creating new market", data: {gameId: parseInt(gameId), marketId: market[0].market_id, status: marketStatus}})
  }
});

app.post("/openMarket", async(req, res) => {
  const startTime = process.hrtime();

  // Headers and Data
  const apiKey = req.header("Authorization");
  const gameId = req.body.gameId;
  const marketId = req.body.marketId;
  const editor = req.body.editor;

  // Check if apiKey is correct
  if (!checkApiKey(apiKey)) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received ${apiKey}, body: ${JSON.stringify(req.body)}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return
  }

  // Check if Body is complete
  if (!gameId || !marketId || !editor) {
    logger.warn(logger.warn(`${req.originalUrl} request has missing parameters, body: ${JSON.stringify(req.body)}`));
    res.status(422).json({ message: "Request has missing parameters"});
    return
  }

  // Get Latest Market entry for GameID Entered
  logger.info(`${req.originalUrl} started ${JSON.stringify(req.body)}`)

  const market =  await getMarketStatus(marketId, gameId)
    .catch((error) => {
        res.status(500).json({message: "Server Error"})
    })
  
  // If market is not found
  if (market.length === 0) {
    logger.warn(`${req.originalUrl} request warning, market is not found in database, marketId:${marketId} gameId:${gameId}`);
    res.status(409).json({ message: `No market found for marketId:${marketId} gameId:${gameId}` });
    return
  }

  // If market is not closed
  if (market[0].status !== 1){
    logger.warn(`${req.originalUrl} request warning, market is already opened or settled, marketId:${marketId} gameId:${gameId}`);
    res.status(409).json({ message: `Market already opened or settled`, data:{ marketId: marketId,  gameId: gameId, status: market[0].status} });
    return
  }

  // Insert updated market
  const result = updateMarketStatus(marketId, gameId, market[0].description, 0, editor, null)
    .catch((error) => {
      res.status(500).json({message: "Server Error"})
    })
  res.status(200).json({message: "Market opened successfully", data: {marketId: marketId, status: 0}})

})


app.post("/closeMarket", async(req, res) => {
  const startTime = process.hrtime();

  // Headers and Data
  const apiKey = req.header("Authorization");
  const gameId = req.body.gameId;
  const marketId = req.body.marketId;
  const editor = req.body.editor;

  // Check if apiKey is correct
  if (!checkApiKey(apiKey)) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received ${apiKey}, body: ${JSON.stringify(req.body)}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return
  }

  // Check if Body is complete
  if (!gameId || !marketId || !editor) {
    logger.warn(logger.warn(`${req.originalUrl} request has missing parameters, body: ${JSON.stringify(req.body)}`));
    res.status(422).json({ message: "Request has missing parameters"});
    return
  }

  // Get Latest Market entry for GameID Entered
  logger.info(`${req.originalUrl} started ${JSON.stringify(req.body)}`)

  const market =  await getMarketStatus(marketId, gameId)
    .catch((error) => {
        res.status(500).json({message: "Server Error"})
    })
  
  // If market is not found
  if (market.length === 0) {
    logger.warn(`${req.originalUrl} request warning, market is not found in database, marketId:${marketId} gameId:${gameId}`);
    res.status(409).json({ message: `No market found for marketId:${marketId} gameId:${gameId}` });
    return
  }

  // If market is not closed
  if (market[0].status !== 0){
    logger.warn(`${req.originalUrl} request warning, market is already closed or settled, marketId:${marketId} gameId:${gameId}`);
    res.status(409).json({ message: `Market already closed or settled`, data:{ marketId: marketId,  gameId: gameId, status: market[0].status} });
    return
  }

  // Insert updated market
  const result = updateMarketStatus(marketId, gameId, market[0].description, 1, editor, null)
    .catch((error) => {
      res.status(500).json({message: "Server Error"})
    })
  res.status(200).json({message: "Market closed successfully", data: {marketId: marketId, status: 1}})

})


app.post("/resultMarket", async(req, res) => {
  const startTime = process.hrtime();

  // Headers and Data
  const apiKey = req.header("Authorization");
  const gameId = req.body.gameId;
  const marketId = req.body.marketId;
  const marketResult = req.body.result
  const editor = req.body.editor;

  // Check if apiKey is correct
  if (!checkApiKey(apiKey)) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received ${apiKey}, body: ${JSON.stringify(req.body)}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return
  }

  // Check if Body is complete
  if (!gameId || !marketId || !marketResult || !editor) {
    logger.warn(logger.warn(`${req.originalUrl} request has missing parameters, body: ${JSON.stringify(req.body)}`));
    res.status(422).json({ message: "Request has missing parameters"});
    return
  }

  // Get Latest Market entry for GameID Entered
  logger.info(`${req.originalUrl} started ${JSON.stringify(req.body)}`)

  const market =  await getMarketStatus(marketId, gameId)
    .catch((error) => {
        res.status(500).json({message: "Server Error"})
    })
  
  // If market is not found
  if (market.length === 0) {
    logger.warn(`${req.originalUrl} request warning, market is not found in database, marketId:${marketId} gameId:${gameId}`);
    res.status(409).json({ message: `No market found for marketId:${marketId} gameId:${gameId}` });
    return
  }

  // If market is not closed
  if (market[0].status !== 1){
    logger.warn(`${req.originalUrl} request warning, market is not yet closed, marketId:${marketId} gameId:${gameId}`);
    res.status(409).json({ message: `Market is not yet closed. Please close first before settling`, data:{ marketId: marketId,  gameId: gameId, status: market[0].status} });
    return
  }

  // Insert updated market
  const result = updateMarketStatus(marketId, gameId, market[0].description, 2, editor, marketResult)
    .catch((error) => {
      res.status(500).json({message: "Server Error"})
    })
  res.status(200).json({message: "Market settled successfully", data: {marketId: marketId, status: 2}})

})


app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen(process.env.PORT, () => {
  console.log("Sakla Game Manager running on port 4007");
});
