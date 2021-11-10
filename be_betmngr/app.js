//jshint esversion: 6
const express = require("express");
const mysql = require("mysql");
const { createLogger, transports, format } = require("winston");
const io = require("socket.io-client")
const helmet = require("helmet");
const cors = require("cors");
const fs = require('fs');

require("dotenv").config();

// Configure Express Application
const app = express();
app.use(express.json());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
        origin: ["http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true,
    })
  )


// Configure websocket domain
const socket = io.connect("http://localhost:3010")

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
    multipleStatements: true
})


db.connect((err) => {
    if (err) {
        console.log(err)
    }
})



app.post("/placeBet", (req, res) => {
    const apiKey = req.header("Authorization") 
    const marketId = req.body.marketId
    const gameId = req.body.gameId
    const accountId = req.body.accountId
    const gameName = req.body.gameName
    const choice = req.body.choice
    const stake = req.body.stake
    const wallet = req.body.wallet  


    // Check if body is complete
    if (!marketId || !gameId || !accountId || !gameName || !choice || !stake || !wallet) {
        logger.warn("placeBet request has missing body parameters");
        res.status(400).json({ message: "Missing body parameters" });
        return;
    }

    // Check if apiKey is correct
    if (!apiKey || apiKey !== process.env.API_KEY) {
        logger.warn("placeBet request has missing/wrong API_KEY");
        res.status(401).json({ message: "Unauthorized Request" });
        return;
    }
    
    // Process 1
    // Check if market is still open
    sqlQuery = "SELECT status from markets WHERE game_id = ? AND market_id = ? ORDER BY LASTEDIT_DATE DESC LIMIT 1"
    db.query(sqlQuery, [gameId, marketId], (err, result1) => {
        if (err) {
            logger.error("Process 1: Error in placeBet request, from accountId:" + accountId + " error:" + err);
            res.status(500).json({ message: "Server error" });
        } else if (result1.length <= 0) {
            logger.warn("Warn in placeBet request from accountId:" + accountId + " market not found marketId:" + marketId);
            res.status(409).json({ message: "Market not found" });
        } else if (result1[0].status !== 0) {
            logger.warn("Warn in placeBet request from accountId:" + accountId + " market not open marketId:" + marketId);
            res.status(409).json({ message: "Market not open" });
        } else {


            // Process 2 
            // Decrease Player Wallet
            const cummulative = (wallet - stake).toFixed(2)
            sqlQuery = "UPDATE accounts SET wallet = ? WHERE account_id = ?"
            db.query(sqlQuery, [cummulative, accountId], (err, result2) => {
                if (err) {
                    logger.error("Process 2: Error in placeBet request, from accountId:" + accountId + " error:" + err);
                    res.status(500).json({ message: "Error during managing player wallet" });
                } else if (result2.affectedRows <= 0) {
                    logger.warn("Warn in placeBet request from accountId:" + accountId + " accountId not found. marketId:" + marketId);
                    res.status(409).json({ message: "Bet not placed successfully. Please check accountId" });
                } else {


                    // Now that the player wallet has been decreased
                    // Process 3
                    // We insert the bet in the bets table
                    const description = gameName + " - " + choice
                    
                    sqlQuery = "INSERT INTO bets (description, market_id, game_id, account_id, stake, cummulative, status, placement_date) VALUES (?,?,?,?,?,?,?,NOW())"
                    db.query(sqlQuery, [description, marketId, gameId,  accountId, stake, cummulative, 0], (err, result3) => {
                        if (err) {
                            logger.error("Process 3: Error in placeBet request, from accountId:" + accountId + " error:" + err);
                            res.status(500).json({ message: "Server error" });
                        } else if (result3.affectedRows <= 0) {
                            logger.warn("Warn in placeBet request from accountId:" + accountId + " bet not placed marketId:" + marketId);
                            res.status(409).json({ message: "Bet not placed successfully. Please try again" });
                        } else {
                            const betId = result3.insertId
        
                            logger.info("Bet placed successfully from accountId:" + accountId + " betId:" + betId)
                            res.status(200).json({message: "Bet Placed successfully", data: {betId: betId, description: description, stake: stake, cummulative: cummulative}})
                            
                            socketData = { betId: betId, accountId: accountId, description: description, stake: stake, status: 0, date: new Date()}
                            socket.emit("bet_placement", socketData)
                        
                            // Adding the commissions to the transactions table for the agent and master_agent
                    
                            // Process 4 Agent Part
                            sqlQueryAgent = "SELECT account_id, commission, wallet FROM accounts WHERE account_id = (SELECT agent_id FROM accounts WHERE account_id = ?)"
                            db.query(sqlQueryAgent, [accountId], (err, resultAgent) => {
                                if (err) {
                                    logger.error("Process 4: Error in getting commission details of agent of account_id:" + accountId + " err:" + err) 
                                } else if (resultAgent.length <= 0){
                                    logger.warn("Process 4: No associated agent for accountId:" + accountId + " to give commissions to from betId:" + betId)
                                } else if (!resultAgent[0].commission) {
                                    logger.warn("Process 4: No associated agent for accountId:" + accountId + " to give commissions to")
                                } else {

                                    const agentCommission = parseFloat(parseFloat(stake/100) * parseFloat(resultAgent[0].commission)).toFixed(2)
                                    const agentCummulative = (parseFloat(resultAgent[0].wallet) + parseFloat(agentCommission)).toFixed(2)

                                    // Process 5 
                                    // Increase Agent Wallet
                                    logger.info("Increasing agent wallet, agentId: " + resultAgent[0].account_id+ " wallet increased to:" + agentCummulative + " for betId:" + betId)
                                    sqlQueryAgent2 = "UPDATE accounts SET wallet = ? WHERE account_id = ?"
                                    db.query(sqlQueryAgent2, [agentCummulative, resultAgent[0].account_id], (err, resultAgent2) => {
                                        if (err) {
                                            logger.error("Process 5: Error in increasing wallet for agent: " + resultAgent[0].account_id + "  to wallet:" + agentCummulative + " for betId:" + betId  + " err:" + err)
                                        } else if (resultAgent2.affectedRows <= 0){
                                            logger.warn("Process 5: Warn in increasing wallet, update not successful, for agent: " + resultAgent[0].account_id + "  to wallet:" + agentCummulative + " for betId:" + betId)
                                        } else {
                                            logger.info("Wallet increased successfully for agentId: " + resultAgent[0].account_id + " to:" + agentCummulative + " for betId:" + betId)
                                        
                                            // Process 6
                                            // Insert to transactions table
                                            transDescription = "Commission from BetId " + betId
                                            sqlQueryAgent3 = "INSERT INTO transactions (description, account_id, amount, cummulative, status, placement_date, transaction_type) VALUES (?,?,?,?,1, NOW(), 6)"
                                            db.query(sqlQueryAgent3, [transDescription, resultAgent[0].account_id, agentCommission, agentCummulative], (err, resultAgent3) => {
                                                if (err) {
                                                    logger.error("Process 6: Error in inserting commission transaction for agent: " + resultAgent[0].account_id +  " for betId:" + betId  + " err:" + err)
                                                } else if (resultAgent3.affectedRows <= 0){
                                                    logger.warn("Process 6: Warn in inserting commission transaction, update not successful, for agent: " + resultAgent[0].account_id + " for betId:" + betId)
                                                } else {
                                                    logger.info("Insert into commissions table successful, transactionId:" + resultAgent3.insertId)
                                                }
                                            })
                                        }
                                    })
                                }
                            })

                            // Process 7 Master Agent Part
                            sqlQueryMasterAgent = "SELECT account_id, commission, wallet FROM accounts WHERE account_id = (SELECT agent_id FROM accounts WHERE account_id = (SELECT agent_id FROM accounts WHERE account_id = ?))"
                            db.query(sqlQueryMasterAgent, [accountId], (err, resultMasterAgent) => {
                                if (err) {
                                    logger.error("Process 4: Error in getting commission details of master agent of account_id:"+accountId + " err:" + err) 
                                } else if (resultMasterAgent.length <= 0){
                                    logger.warn("Process 4: No associated master agent for accountId:" + accountId + " to give commissions to from betId:" + betId)
                                } else if (!resultMasterAgent[0].commission) {
                                    logger.warn("Process 4: No associated master agent for accountId:" + accountId + " to give commissions to")
                                } else {

                                    const masterCommission = parseFloat(parseFloat(stake/100) * parseFloat(resultMasterAgent[0].commission)).toFixed(2)
                                    const masterCummulative = (parseFloat(resultMasterAgent[0].wallet) + parseFloat(masterCommission)).toFixed(2)

                                    // Process 8 
                                    // Increase Master Agent Wallet
                                    logger.info("Increasing agent wallet, agentId: " + resultMasterAgent[0].account_id+ " wallet increased to:" + masterCummulative + " for betId:" + betId)
                                    sqlQueryMasterAgent2 = "UPDATE accounts SET wallet = ? WHERE account_id = ?"
                                    db.query(sqlQueryMasterAgent2, [masterCummulative, resultMasterAgent[0].account_id], (err, resultMasterAgent2) => {
                                        if (err) {
                                            logger.error("Process 5: Error in increasing wallet for agent: " + resultMasterAgent[0].account_id + "  to wallet:" + masterCummulative + " for betId:" + betId  + " err:" + err)
                                        } else if (resultMasterAgent2.affectedRows <= 0){
                                            logger.warn("Process 5: Warn in increasing wallet, update not successful, for agent: " + resultAgent[0].account_id + "  to wallet:" + masterCummulative + " for betId:" + betId)
                                        } else {
                                            logger.info("Wallet increased successfully for agentId: " + resultMasterAgent[0].account_id + " to:" + masterCummulative + " for betId:" + betId)
                                        
                                            // Process 9
                                            // Insert to transactions table
                                            transDescription2 = "Commission from BetId " + betId
                                            sqlQueryMasterAgent3 = "INSERT INTO transactions (description, account_id, amount, cummulative, status, placement_date, transaction_type) VALUES (?,?,?,?,1, NOW(), 6)"
                                            db.query(sqlQueryMasterAgent3, [transDescription2, resultMasterAgent[0].account_id, masterCommission, masterCummulative], (err, resultMasterAgent3) => {
                                                if (err) {
                                                    logger.error("Process 6: Error in inserting commission transaction for agent: " + resultMasterAgent[0].account_id +  " for betId:" + betId  + " err:" + err)
                                                } else if (resultMasterAgent3.affectedRows <= 0){
                                                    logger.warn("Process 6: Warn in inserting commission transaction, update not successful, for agent: " + resultMasterAgent[0].account_id + " for betId:" + betId)
                                                } else {
                                                    logger.info("Insert into commissions table successful, transactionId:" + resultMasterAgent3.insertId)
                                                }
                                            })
                                        }
                                    })
                                }
                            })                      
                        }
                    })
                }
            });
        }
    })
})


app.post("/settleColorGameBets", (req, res) => {
    const apiKey = req.header("Authorization") 
    const gameId = req.body.gameId;
    const marketId = req.body.marketId;
    const marketResult = req.body.result;
    
    // Check if body is complete
    if (!gameId || !marketId || marketResult.length !== 3) {
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
    // Get Win_multiplier details for the game
    sqlQuery = "SELECT win_multip1, win_multip2, win_multip3 FROM games where game_id = ?"
    db.query(sqlQuery, [gameId], (err, result) => {
        if (err) {
            logger.error("Process 1: Error in settleColorGameBets request for gameId:" + gameId + " " +err);
            res.status(500).json({ message: "Server error" });
        } else if (result.length <= 0){
            logger.warn("Warn for /settleColorGameBets, game not found gameId:" + gameId)
            res.status(409).json({message: "Cannot settle color game bets. Game not found", data: {gameId: gameId}})
        } else {

            const winMultip1 = parseFloat(result[0].win_multip1)
            const winMultip2 = parseFloat(result[0].win_multip2)
            const winMultip3 = parseFloat(result[0].win_multip3)
            const winMultipArr = [winMultip1, winMultip2, winMultip3]
        
            // Process 2
            // Get all unsettled bets placed on the market
            sqlQuery2 = "SELECT bet_id, account_id, description, stake FROM bets WHERE status = 0 AND game_id = ? AND market_id = ? ORDER BY bet_id ASC"
            db.query(sqlQuery2, [gameId, marketId], (err, result2) => {
                if (err) {
                    logger.error("Process 2: Error in settleColorGameBets request for gameId:" + gameId + " " +err);
                    res.status(500).json({ message: "Server error" });
                } else if (result2.length > 0){
                    res.status(200).json({message: "Bet settlement has been triggered", data: {gameId: gameId, marketId: marketId, betCount: result2.length}})

                    // Calculate Winnings
                    const updateWalletDetailsArr = []
                    unsettledBets = result2
                    unsettledBets.forEach(bet => {                     
                        var choice = bet.description.replace('Color Game - ', '')
                        var stake = bet.stake
                        var accountId = bet.account_id
                        var occurrences = 0 

                        // Check occurrences of choice in the result
                        marketResult.forEach(color => {
                            occurrences = (color === choice) ? occurrences + 1 : occurrences
                        })

                        // Calculate winnings with occurrences
                        multiplier = (occurrences === 0) ? 0: winMultipArr[occurrences -1]
                        const winnings = parseFloat(stake*multiplier).toFixed(2)
                        const BetStatus = (occurrences === 0) ? 1 : 2
                        
                        updateWalletDetailsArr.push({betId: bet.bet_id, winnings: winnings, account_id: accountId, choice: choice, stake:stake, multiplier: multiplier, status: BetStatus})

                    })

                    // Process 3
                    // Update Wallet in accounts Table and Update Status in Bets Table
                    // Prepare update statement for player winnings
                    var updateWalletQuery = ''
                    var updateWalletDetailString = ''
                    updateWalletDetailsArr.forEach(entry => {
                        updateWalletDetailString += `{betId: ${entry.betId}, accountId: ${entry.account_id}, choice: ${entry.choice}, stake: ${entry.stake}, winnings: ${entry.winnings}} `
                        updateWalletQuery += db.format("UPDATE accounts SET wallet=wallet+?, lastedit_date = NOW() WHERE account_id = ?; UPDATE bets SET cummulative = (SELECT wallet FROM accounts where account_id = ?), status = ?, settled_date = NOW() WHERE bet_id = ?;", [entry.winnings, entry.account_id, entry.account_id, entry.status, entry.betId] )
                    })

                    db.query(updateWalletQuery, (err, result3) => {
                        if (err) {
                            logger.error("Process 3: Error in settleColorGameBets request for gameId:" + gameId + " " +err);
                        } else {
                            logger.info("Wallet Balance has been updated for settling marketId:" + marketId + " gameId:" + gameId + " result: "+ marketResult+  " bets:"+ updateWalletDetailString)
                        }
                    })
                } else {
                    res.status(200).json({message: "All bets has been setteled for the market", data: {gameId: gameId, marketId: marketId, betCount: result2.length}})
                }
            })
        }
    })
})



app.post("/sendTip", (req, res) => {
    const apiKey = req.header("Authorization") 
    const accountId = req.body.accountId
    const amount = req.body.amount
    const wallet = req.body.wallet
    

    // Check if body is complete
    if (!accountId || !amount || !wallet) {
        logger.warn("sendTip request has missing body parameters");
        res.status(400).json({ message: "Missing body parameters" });
        return;
    }

    // Check if apiKey is correct
    if (!apiKey || apiKey !== process.env.API_KEY) {
        logger.warn("sendTip request has missing/wrong API_KEY");
        res.status(401).json({ message: "Unauthorized Request" });
        return;
    }

    // Process 1
    // Decrease Player Wallet
    const cummulative = (wallet - amount).toFixed(2)
    toDecrease = 0 - amount
    sqlQuery = "UPDATE accounts SET wallet = wallet+? WHERE account_id = ?"
    db.query(sqlQuery, [toDecrease, accountId], (err, result1) => {
        if (err) {
            logger.error("Process 1: Error in sendTip request, from accountId:" + accountId + " error:" + err);
            res.status(500).json({ message: "Error during managing player wallet" });
        } else if (result1.affectedRows <= 0) {
            logger.warn("Warn in sendTip request from accountId:" + accountId + " accountId not found.");
            res.status(409).json({ message: "Tip not placed successfully. Please check accountId" });
        } else {

            // Process 2
            // Insert the tips of player in transactions table
            description = "Send Tip - amount: Php " + amount
            sqlQuery2 = "INSERT INTO transactions (description, account_id, amount, cummulative, status, placement_date, transaction_type) VALUES (?,?,?,?,1,NOW(), 7)"
            db.query(sqlQuery2, [description, accountId, amount, cummulative], (err, result2) => {
                if (err) {
                    logger.error("Process 2: Error in sendTip request, from accountId:" + accountId + " error:" + err);
                    res.status(500).json({ message: "Error during managing player wallet" });
                } else if (result2.affectedRows <= 0) {
                    logger.warn("Process 2 Warn in sendTip request from accountId:" + accountId + " accountId not found");
                    res.status(409).json({ message: "Tip not placed successfully. Please check accountId" });
                } else {
                    transactionId = result2.insertId


                    // Process 3
                    // Insert the received tips of player in transactions table
                    cummulative2 = 99999
                    description = "Received Tip - amount: Php " + amount + " from player: " + accountId
                    sqlQuery2 = "INSERT INTO transactions (description, account_id, amount, cummulative, status, placement_date, transaction_type) VALUES (?,?,?,?,1,NOW(), 8)"
                    db.query(sqlQuery2, [description, 1, amount, cummulative2], (err, result2) => {
                        if (err) {
                            logger.error("Process 2: Error in sendTip request, from accountId:" + accountId + " error:" + err);
                            res.status(500).json({ message: "Error during managing player wallet" });
                        } else if (result2.affectedRows <= 0) {
                            logger.warn("Process 2 Warn in sendTip request from accountId:" + accountId + " accountId not found");
                            res.status(409).json({ message: "Tip not placed successfully. Please check accountId" });
                        }
                    })
                    logger.info("Received tip")
                    res.status(200).json({message: "Tip sent successfully. Thank you"})
                }
            })
    }})
})




app.get("/getBetHistory/:accountId/:dateFrom-:dateTo", (req, res) => {
    const apiKey = req.header("Authorization") 
    const accountId = req.params.accountId;
    const dateFrom = req.params.dateFrom
    const dateTo = req.params.dateTo  

    // Check if body is complete
    if (!accountId) {
        logger.warn("getBetHistory request has missing body parameters");
        res.status(400).json({ message: "Missing body parameters" });
        return;
    }

    // Check if apiKey is correct
    if (!apiKey || apiKey !== process.env.API_KEY) {
        logger.warn("getBetHistory request has missing/wrong API_KEY");
        res.status(401).json({ message: "Unauthorized Request" });
        return;
    }


    sqlQuery = 'SELECT * FROM bets WHERE account_id = ? AND placement_date BETWEEN ? AND ? '
    db.query(sqlQuery, [accountId, dateFrom, dateTo], (err, result) => {
        if (err) {
            logger.error(" Process 1: Error in getBetHistory request from accountId:" + accountId);
        } else {
            res.status(200).json({message: "Request Successful", data: result})
        }
    })
})



app.listen(4005, () => {
    console.log("Backend Bet Manager listentning at port 4005");
  });
  