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
    methods: ["GET", "POST", "PATCH"],
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
    var sqlQuery = ""
    if (status === 2) {
      sqlQuery = "INSERT INTO markets (market_id, game_id, description, status, result, settled_date, lastedit_date, edited_by) VALUES (?, ?, ?, ?, ?, NOW(), NOW(), ?)"
    }else{
      sqlQuery = "INSERT INTO markets (market_id, game_id, description, status, result, lastedit_date, edited_by) VALUES (?, ?, ?, ?, ?, NOW(), ?)"
    }
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

async function getSaklaChoices(gameId) {
  return new Promise((resolve, reject) => {
    sqlQuery = "SELECT * FROM choices WHERE game_id = ?"
    db_pool.query(sqlQuery, [gameId], (err, result) => {
        if (err) {
          logger.error(`Error in getting sakla choices gameId:${gameId}, error:${err}`)
          return (reject(err.message))
        } else {
          logger.info(`Retrieved sakla choices for gameId:${gameId}`)
          return (resolve(result))
        }
    })
  })
}

async function updateChoiceDetail(choiceId, description, manipulateValue, editor){
  return new Promise((resolve, reject) => {
    sqlQuery = "UPDATE choices SET description = ?, manipulate_val = ? , lastedit_date = NOW(), lastedit_by = ? WHERE choice_id = ?"
    db_pool.query(sqlQuery, [description, manipulateValue, editor, choiceId], (err, result) => {
        if (err) {
          logger.error(`Error in updating sakla choice choiceId:${choiceId}, error:${err}`)
          return (reject(err.message))
        } else {
          logger.info(`Successfully updated sakla choice details, choiceId:${choiceId} description:${description} manipulateValue:${manipulateValue}`)
          return (resolve(result))
        }
    })
  })
}

async function updateSaklaWinMultiplier(gameId, multiplier, editor) { 
  return new Promise((resolve, reject) => {
    sqlQuery = "UPDATE games SET win_multip1 = ?, lastedit_date = NOW(), edited_by = ? WHERE game_id = ?"
    db_pool.query(sqlQuery, [multiplier, editor, gameId], (err, result) => {
        if (err) {
          logger.error(`Error in updating sakla choice choiceId:${choiceId}, error:${err}`)
          return (reject(err.message))
        } else {
          logger.info(`Successfully updated sakla win multiplier, gameId:${gameId} winMultiplier:${multiplier}`)
          return (resolve(result))
        }
    })
  })
}

async function createNewSaklaGame(gameName, editor) { 
  return new Promise((resolve, reject) => {

    const name = gameName
    const basename = "Sakla"
    const banner = `Welcome to ${name}. Enjoy Playing`
    const minBet = parseFloat(500)
    const maxBet = parseFloat(1000)
    const youtubeUrl = "0i7eX_45JWQ"
    const winMutlip = 18
    const commission = 10
    const type = 3

    sqlQuery = "INSERT INTO games (name, basename, banner, min_bet, max_bet, youtube_url, win_multip1, created_date, lastedit_date, edited_by, commission, type) \
    VALUES \
    (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, ?)"
    db_pool.query(sqlQuery, [name, basename, banner,minBet, maxBet, youtubeUrl, winMutlip,  editor, commission, type], (err, result) => {
        if (err) {
          logger.error(`Error in creating new Sakla Game gameName:${name}, error:${err}`)
          return (reject(err.message))
        } else {
          logger.info(`Successfully created New Sakla Game, gameId:${result.insertId}`)
          return (resolve(result))
        }
    })
  })
}

async function insertNewChoices(gameId, editor) { 
  return new Promise((resolve, reject) => {

    const choices = ['1 ESPADA - 2 ESPADA',
        '3 ESPADA - 4 ESPADA',
        '5 ESPADA - 6 ESPADA',
        '7 ESPADA - SOTANG ESPADA',
        'KABAYONG ESPADA - HARING ESPADA',
        '1 OROS - 2 OROS',
        '3 OROS - 4 OROS',
        '5 OROS - 6 OROS',
        '7 OROS - SOTANG OROS',
        'KABAYONG OROS - HARING OROS',
        '1 KOPAS - 2 KOPAS',
        '3 KOPAS - 4 KOPAS',
        '5 KOPAS - 6 KOPAS',
        '7 KOPAS - SOTANG KOPAS',
        'KABAYONG KOPAS - HARING KOPAS',
        '1 BASTOS - 2 BASTOS',
        '3 BASTOS - 4 BASTOS',
        '5 BASTOS - 6 BASTOS',
        '7 BASTOS - SOTANG BASTOS',
        'KABAYONG BASTOS - HARING BASTOS'
    ]

    sqlQuery = "INSERT INTO choices (description, game_id, manipulate_val, lastedit_by) VALUES "
    choices.forEach((choice) => {
      sqlQuery += `(\'${choice}\', ${gameId}, 0.0, \'${editor}\'), `
    })
    sqlQuery = sqlQuery.slice(0, -2) + ';'
    db_pool.query(sqlQuery, (err, result) => {
      if (err) {
          logger.error(`Error in inserting default choices for game:${gameId}, error:${err}`)
          return (reject(err.message))
        } else {
          logger.info(`Successfully inserted default choices for sakla game, gameId:${gameId}`)
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
        return
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
      return
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
        return
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
      return
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
        return
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
      return
    })
  res.status(200).json({message: "Market settled successfully", data: {marketId: marketId, status: 2}})

})


app.get("/getChoices/:gameId", async(req, res) => {
  const startTime = process.hrtime();

  // Headers and Data
  const apiKey = req.header("Authorization");
  const gameId = req.params.gameId;

  // Check if apiKey is correct
  if (!checkApiKey(apiKey)) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received ${apiKey}, body: ${JSON.stringify(req.body)}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return
  }

  // Check if Body is complete
  if (!gameId ) {
    logger.warn(logger.warn(`${req.originalUrl} request has missing parameters, body: ${JSON.stringify(req.body)}`));
    res.status(422).json({ message: "Request has missing parameters"});
    return
  }

  // Get Choices for GameId Selected
  logger.info(`${req.originalUrl} started ${JSON.stringify(req.body)}`)

  const choices = await getSaklaChoices(gameId)
    .catch((error) => {
      res.status(500).json({message: "Server Error"})
      return
    })
  
  res.status(200).json({message: "Choices fetched successfully", data: {choices: choices}})
  return
})


app.patch("/updateChoiceDetails", async (req, res) => {
  const startTime = process.hrtime();

  // Headers and Data
  const apiKey = req.header("Authorization");
  const gameId = req.body.gameId
  const choiceId = req.body.choiceId
  const description = req.body.description
  const manipulateValue = req.body.manipulateValue
  const editor = req.body.editor

  // Check if apiKey is correct
  if (!checkApiKey(apiKey)) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received ${apiKey}, body: ${JSON.stringify(req.body)}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return
  }

  // Check if Body is complete
  if (!gameId || !choiceId || !description || !editor || !manipulateValue) {
    logger.warn(logger.warn(`${req.originalUrl} request has missing parameters, body: ${JSON.stringify(req.body)}`));
    res.status(422).json({ message: "Request has missing parameters"});
    return
  }

  // Update choices 
  logger.info(`${req.originalUrl} started ${JSON.stringify(req.body)}`)

  const result = await updateChoiceDetail(choiceId, description, manipulateValue, editor)
    .catch((error) => {
      res.status(500).json({message: "Server Error"})
      return
    })
  
  res.status(200).json({message: "Choice successfully edited", data: {choiceId: choiceId, description: description, manipulateValue: manipulateValue}})
  return
})

app.patch("/updateSaklaWinMultiplier", async (req, res) => {
  const startTime = process.hrtime();

  // Headers and Data
  const apiKey = req.header("Authorization");
  const gameId = req.body.gameId
  const multiplier = req.body.multiplier
  const editor = req.body.editor

  // Check if apiKey is correct
  if (!checkApiKey(apiKey)) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received ${apiKey}, body: ${JSON.stringify(req.body)}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return
  }

  // Check if Body is complete
  if (!gameId ||  !editor || !multiplier) {
    logger.warn(logger.warn(`${req.originalUrl} request has missing parameters, body: ${JSON.stringify(req.body)}`));
    res.status(422).json({ message: "Request has missing parameters"});
    return
  }

  // Update choices 
  logger.info(`${req.originalUrl} started ${JSON.stringify(req.body)}`)

  const result = await updateSaklaWinMultiplier(gameId, multiplier, editor)
    .catch((error) => {
      res.status(500).json({message: "Server Error"})
      return
    })
  
  res.status(200).json({message: "Win Multiplier edited successfully ", data: {gameId: gameId, winMultiplier: multiplier}})
  return
})


app.post("/createNewSaklaGame", async (req, res) => {
  const startTime = process.hrtime();

  // Headers and Data
  const apiKey = req.header("Authorization");
  const gameName = req.body.gameName;
  const editor = req.body.editor

  // Check if apiKey is correct
  if (!checkApiKey(apiKey)) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received ${apiKey}, body: ${JSON.stringify(req.body)}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return
  }

  // Check if Body is complete
  if (!gameName || !editor) {
    logger.warn(logger.warn(`${req.originalUrl} request has missing parameters, body: ${JSON.stringify(req.body)}`));
    res.status(422).json({ message: "Request has missing parameters"});
    return
  }

  // Insert New Games 
  logger.info(`${req.originalUrl} started ${JSON.stringify(req.body)}`)
  const result = await createNewSaklaGame(gameName, editor)
    .catch((error) => {
      res.status(500).json({message: "Server Error"})
      return
  })

  // Insert Choices
  const newGameId = result.insertId
  const choicesResult = await insertNewChoices(newGameId, editor)
  .catch((error) => {
    res.status(500).json({message: "Server Error"})
    return
  })

  logger.info(`Successfully created new sakla game and choices. gameName:${gameName} gameId:${result.insertId} duration:${getDurationInMilliseconds(startTime)}`)
  res.status(200).json({message: "Created New Sakla Game Successfully", data: {gameId: result.insertId}})
  return
})


app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen(process.env.PORT, () => {
  console.log(`Settlement service running on port ${process.env.PORT}`)
  logger.info(`Settlement service running on port ${process.env.PORT}`);
});
