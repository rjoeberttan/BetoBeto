//jshint esversion: 6
const express = require("express");
const mysql = require("mysql");
const helmet = require("helmet");
const cors = require("cors");
const { createLogger, transports, format } = require("winston");
const e = require("express");
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
      new transports.File({ filename: "/var/log/app/settlement.log" }),
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


async function fetchBetsOnMarket(marketId) {
  return new Promise((resolve, reject) => {
    sqlQuery = "SELECT * FROM bets WHERE market_id = ?"
    db_pool.query(sqlQuery, [marketId], (err, result) => {
        if (err) {
          logger.error(`Error in fetching market bets for marketId:${marketId}, error:${err}`)
          return (reject(err.message))
        } else {
          logger.info(`Successfully fetched market bets for marketId:${marketId}, betCount:${result.length}`)
          return (resolve(result))
        }
    })
  })
}

async function increaseWalletForBet(betId, winAmount, accountId){
  return new Promise((resolve, reject) => {
    sqlQuery = "UPDATE accounts SET wallet=wallet+?, lastedit_date = NOW() WHERE account_id = ?;"
    db_pool.query(sqlQuery, [winAmount, accountId], (err, result) => {
        if (err) {
          logger.error(`Error in increasing wallet for bet settlement for betId:${betId}, error:${err}`)
          return (reject(err.message))
        } else {
          return (resolve(result))
        }
    })
  })
}

async function updateBetTransaction(betId, accountId, winnings, status){
  return new Promise((resolve, reject) => {
    sqlQuery = "UPDATE bets SET cummulative = (SELECT wallet FROM accounts where account_id = ?), winnings=?, status = ?, settled_date = NOW() WHERE bet_id = ?;"
    db_pool.query(sqlQuery, [accountId, winnings, status, betId], (err, result) => {
        if (err) {
          logger.error(`Error in updating bet entry for settlement, betId:${betId}, error:${err}`)
          return (reject(err.message))
        } else {
          logger.info(`Successfully updated bet entry for settlement, betId:${betId} status:${status}`)
          return (resolve(result))
        }
    })
  })
}


// 

app.post("/settleSaklaBets", async(req, res) => {
  const startTime = process.hrtime();

  // Headers and Data
  const apiKey = req.header("Authorization");
  const gameId = req.body.gameId;
  const marketId = req.body.marketId;
  const marketResult = req.body.result;
  const gameName = req.body.gameName;
  const winMultiplier = req.body.winMultiplier;


  // Check if apiKey is correct
  if (!checkApiKey(apiKey)) {
    logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received ${apiKey}, body: ${JSON.stringify(req.body)}`);
    res.status(401).json({ message: "Unauthorized Request" });
    return
  }

  // Check if Body is complete
  if (!gameId || !gameName || !marketId || !marketResult || !winMultiplier) {
    logger.warn(logger.warn(`${req.originalUrl} request has missing parameters, body: ${JSON.stringify(req.body)}`));
    res.status(422).json({ message: "Request has missing parameters"});
    return
  }

  // Get Latest Market entry for GameID Entered
  logger.info(`${req.originalUrl} started ${JSON.stringify(req.body)}`)



  const bets = await fetchBetsOnMarket(marketId)
  for (var i = 0; i < bets.length ; i++){
    logger.info(`Starting settlement for betId:${bets[i].bet_id}`)
    var choice = (bets[i].description).replace(`${gameName} : `, "")
    var stake = parseFloat(bets[i].stake).toFixed(2)
    
    var winDecision = marketResult === "DRAW" ? 3 : (choice === marketResult ? 2 : 1)
    var winAmount = 0
    if (winDecision === 2){
      winAmount = (parseFloat(stake) * parseFloat(winMultiplier)).toFixed(2)
      var betAmount = await increaseWalletForBet(bets[i].bet_id, winAmount, bets[i].account_id)
      .catch((error) => {
        res.status(500).json({message: "Server Error"})
        return
      })
      logger.info(`Successfully increased wallet for bet settlement for betId:${bets[i].bet_id} winAmount:${winAmount} accountId:${bets[i].account_id} isWin:${winDecision}`)
    } else if (winDecision === 1) {
      logger.info(`Wallet not updated since bet did not win betId:${bets[i].bet_id} accountId:${bets[i].account_id} isWin:${winDecision}`)
    } else if (winDecision === 3) {
      winAmount = parseFloat(stake).toFixed(2)
      var betAmount = await increaseWalletForBet(bets[i].bet_id, winAmount, bets[i].account_id)
      .catch((error) => {
        res.status(500).json({message: "Server Error"})
        return
      })
      logger.info(`Successfully increased wallet for bet settlement for betId:${bets[i].bet_id} winAmount:${winAmount} accountId:${bets[i].account_id} isWin:${winDecision}`)
    }
    
    const updateBetEntry = await updateBetTransaction(bets[i].bet_id, bets[i].account_id, winAmount, winDecision)
    .catch((error) => {
      res.status(500).json({message: "Server Error"})
      return
    })   
  }

  logger.info(`All bets has been settled betCount:${bets.length} settlementDuration:${getDurationInMilliseconds(startTime)}`)
  res.status(200).json({message: "All bets has been settled"})
});


app.listen(process.env.PORT, () => {
  console.log(`Settlement service running on port ${process.env.PORT}`)
  logger.info(`Settlement service running on port ${process.env.PORT}`);
});