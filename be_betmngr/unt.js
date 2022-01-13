app.post("/placeBetTotalistator", (req, res) => {
    const start = process.hrtime()

    const apiKey = req.header("Authorization") 
    const marketId = req.body.marketId
    const gameId = req.body.gameId
    const accountId = req.body.accountId
    const gameName = req.body.gameName
    const choice = req.body.choice
    const stake = req.body.stake
    const wallet = req.body.wallet 
    const maxBet = req.body.maxBet 


    // Check if body is complete
    if (!marketId || !gameId || !accountId || !gameName || !choice || !stake || !wallet) {
        console.log(marketId, gameId, accountId, gameName, choice, stake, wallet)
        logger.warn(`${req.originalUrl} request has missing body parameters, accountId:${accountId}`)
        res.status(400).json({ message: "Missing body parameters" });
        return;
    }

    console.log(apiKey, process.env.API_KEY)

    // Check if apiKey is correct
    if (!apiKey || apiKey !== process.env.API_KEY) {
        logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`);
        res.status(401).json({ message: "Unauthorized Request" });
        return;
    }
    
    // Process 1
    // Check if market is still open
    sqlQuery = "SELECT status from markets WHERE game_id = ? AND market_id = ? ORDER BY LASTEDIT_DATE DESC LIMIT 1"
    db.query(sqlQuery, [gameId, marketId], (err, result1) => {
        if (err) {
            logger.error(`${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`)
            res.status(500).json({ message: "Server error" });
        } else if (result1.length <= 0) {
            logger.warn(`${req.originalUrl} request warning, market not found, marketId:${marketId} accountId:${accountId}`)
            res.status(409).json({ message: "Market not found" });
        } else if (result1[0].status !== 0) {
            logger.warn(`${req.originalUrl} request warning, market not not open, marketId:${marketId} accountId:${accountId}`)
            res.status(409).json({ message: "Market not open" });
        } else {

            // Process 2 
            // Decrease Player Wallet
            const cummulative = (wallet - stake).toFixed(2)
            sqlQuery = "UPDATE accounts SET wallet = ? WHERE account_id = ?"
            db.query(sqlQuery, [cummulative, accountId], (err, result2) => {
                if (err) {
                    logger.error(`${req.originalUrl} request has an error during process 2, marketId:${marketId} accountId:${accountId}, error:${err}`)
                    res.status(500).json({ message: "Error during managing player wallet" });
                } else if (result2.affectedRows <= 0) {
                    logger.warn(`${req.originalUrl} request warning, player account cannot be found, marketId:${marketId} accountId:${accountId}`)
                    res.status(409).json({ message: "Bet not placed successfully. Please check accountId" });
                } else {
                    // Now that the player wallet has been decreased
                    // Process 3
                    // We insert the bet in the bets table
                    const description = gameName + " - " + choice
                    
                    sqlQuery = "INSERT INTO bets (description, market_id, game_id, account_id, stake, cummulative, status, placement_date) VALUES (?,?,?,?,?,?,?,NOW())"
                    db.query(sqlQuery, [description, marketId, gameId,  accountId, stake, cummulative, 0], (err, result3) => {
                        if (err) {
                            logger.error(`${req.originalUrl} request has an error during process 3, marketId:${marketId} accountId:${accountId}, error:${err}`)
                            res.status(500).json({ message: "Server error" });
                        } else if (result3.affectedRows <= 0) {
                            logger.warn(`${req.originalUrl} request warning, bet not placed, marketId:${marketId} accountId:${accountId}`)
                            res.status(409).json({ message: "Bet not placed successfully. Please try again" });
                        } else {
                            const betId = result3.insertId
                            logger.info(`${req.originalUrl} request successful, bet placed successfully, marketId:${marketId} accountId:${accountId} betId:${betId}`)
                            res.status(200).json({message: "Bet Placed successfully", data: {betId: betId, description: description, stake: stake, cummulative: cummulative}})
                            
                            socketData = { betId: betId, accountId: accountId, description: description, stake: stake, status: 0, date: new Date()}
                            socket.emit("bet_placement", socketData)
                        
                            // Adding the commissions to the transactions table for the agent and master_agent
                    
                            // Process 4 Agent Part
                            sqlQueryAgent = "SELECT account_id, commission, wallet FROM accounts WHERE account_id = (SELECT agent_id FROM accounts WHERE account_id = ?)"
                            db.query(sqlQueryAgent, [accountId], (err, resultAgent) => {
                                if (err) {
                                    logger.error(`${req.originalUrl} request has an error during process 4, marketId:${marketId} accountId:${accountId}, error:${err}`)
                                } else if (resultAgent.length <= 0){
                                    logger.warn(`${req.originalUrl} request warning, no associated agent to give commission to, marketId:${marketId} accountId:${accountId}`)
                                } else if (!resultAgent[0].commission) {
                                    logger.warn(`${req.originalUrl} request warning, agent has no set commission, agent:${resultAgent[0].account_id} marketId:${marketId} accountId:${accountId}`)
                                } else {
                                    const agentCommission = parseFloat(parseFloat(stake/100) * parseFloat(resultAgent[0].commission)).toFixed(2)
                                    const agentCummulative = (parseFloat(resultAgent[0].wallet) + parseFloat(agentCommission)).toFixed(2)
                                    // Process 5 
                                    // Increase Agent Wallet
                                    sqlQueryAgent2 = "UPDATE accounts SET wallet = ? WHERE account_id = ?"
                                    db.query(sqlQueryAgent2, [agentCummulative, resultAgent[0].account_id], (err, resultAgent2) => {
                                        if (err) {
                                            logger.error(`${req.originalUrl} request has an error during process 5, agent:${resultAgent[0].account_id} marketId:${marketId} accountId:${accountId}, error:${err}`)
                                        } else if (resultAgent2.affectedRows <= 0){
                                            logger.warn(`${req.originalUrl} request warning, update was successful in increase agent wallet, agent:${resultAgent[0].account_id} marketId:${marketId} accountId:${accountId}`)
                                        } else {
                                            logger.info(`${req.originalUrl} request successful, agent commission was given, agent:${resultAgent[0].account_id} commission:${agentCommission} marketId:${marketId} accountId:${accountId} betId:${betId}`)
                                        
                                            // Process 6
                                            // Insert to transactions table
                                            transDescription = "Commission from BetId " + betId
                                            sqlQueryAgent3 = "INSERT INTO transactions (description, account_id, amount, cummulative, status, placement_date, transaction_type) VALUES (?,?,?,?,1, NOW(), 6)"
                                            db.query(sqlQueryAgent3, [transDescription, resultAgent[0].account_id, agentCommission, agentCummulative], (err, resultAgent3) => {
                                                if (err) {
                                                    logger.error(`${req.originalUrl} request has an error during process 6, agent:${resultAgent[0].account_id} marketId:${marketId} accountId:${accountId}, error:${err}`)
                                                } else if (resultAgent3.affectedRows <= 0){
                                                    logger.warn(`${req.originalUrl} request warning, update was not successful in increase agent wallet, insert to transactions table, agent:${resultAgent[0].account_id} marketId:${marketId} accountId:${accountId}`)
                                                } else {
                                                    logger.info(`${req.originalUrl} request successful, agent commission was inserted to transactions table, agent:${resultAgent[0].account_id} commission:${agentCommission} marketId:${marketId} accountId:${accountId} betId:${betId}`)
                                                }
                                            })
                                        }
                                    })
                                    //Process 7 Master Agent Part
                                    sqlQueryMasterAgent = "SELECT account_id, commission, wallet FROM accounts WHERE account_id = (SELECT agent_id FROM accounts WHERE account_id = (SELECT agent_id FROM accounts WHERE account_id = ?))"
                                    db.query(sqlQueryMasterAgent, [accountId], (err, resultMasterAgent) => {
                                        if (err) {
                                            logger.error(`${req.originalUrl} request has an error during process 7, marketId:${marketId} accountId:${accountId}, error:${err}`)
                                        } else if (resultMasterAgent.length <= 0){
                                            logger.warn(`${req.originalUrl} request warning, no associated master agent to give commission to, marketId:${marketId} accountId:${accountId}`)
                                        } else if (!resultMasterAgent[0].commission) {
                                            logger.warn(`${req.originalUrl} request warning, master agent has no set commission, masterAgent:${resultMasterAgent[0].account_id} marketId:${marketId} accountId:${accountId}`)
                                        } else {
                                            const masterCommission = (parseFloat(parseFloat(stake/100) * parseFloat(resultMasterAgent[0].commission)).toFixed(2)) - agentCommission
                                            const supposedMasterCommission = parseFloat(masterCommission) + parseFloat(agentCommission)
                                            // console.log(`Agent Commission: ${agentCommission} supposed MA ${supposedMasterCommission} final MA ${masterCommission}`)
                                            const masterCummulative = (parseFloat(resultMasterAgent[0].wallet) + parseFloat(masterCommission)).toFixed(2)
                                            // Process 8 
                                            // Increase Master Agent Wallet
                                            sqlQueryMasterAgent2 = "UPDATE accounts SET wallet = ? WHERE account_id = ?"
                                            db.query(sqlQueryMasterAgent2, [masterCummulative, resultMasterAgent[0].account_id], (err, resultMasterAgent2) => {
                                                if (err) {
                                                    logger.error(`${req.originalUrl} request has an error during process 8, masterAgent:${resultMasterAgent[0].account_id} marketId:${marketId} accountId:${accountId}, error:${err}`)
                                                } else if (resultMasterAgent2.affectedRows <= 0){
                                                    logger.warn(`${req.originalUrl} request warning, update was not successful in increasing master agent wallet, agent:${resultMasterAgent[0].account_id} marketId:${marketId} accountId:${accountId}`)
                                                } else {
                                                    logger.info(`${req.originalUrl} request successful, master agentagent commission was given, agent:${resultMasterAgent[0].account_id} commission:${masterCommission} marketId:${marketId} accountId:${accountId} betId:${betId}`)
                                            
                                                    // Process 9
                                                    // Insert to transactions table
                                                    transDescription2 = "Commission from BetId " + betId
                                                    sqlQueryMasterAgent3 = "INSERT INTO transactions (description, account_id, amount, cummulative, status, placement_date, transaction_type) VALUES (?,?,?,?,1, NOW(), 6)"
                                                    db.query(sqlQueryMasterAgent3, [transDescription2, resultMasterAgent[0].account_id, masterCommission, masterCummulative], (err, resultMasterAgent3) => {
                                                        if (err) {
                                                            logger.error(`${req.originalUrl} request has an error during process 9, masterAgent:${resultMasterAgent[0].account_id} marketId:${marketId} accountId:${accountId}, error:${err}`)
                                                        } else if (resultMasterAgent3.affectedRows <= 0){
                                                            logger.warn(`${req.originalUrl} request warning, update was not successful in increase master agent, insert to transactions table, agent:${resultAgent[0].account_id} marketId:${marketId} accountId:${accountId}`)
                                                        } else {
                                                            logger.info(`${req.originalUrl} request successful, agent commission was inserted to transactions table, masterAgent:${resultMasterAgent[0].account_id} commission:${masterCommission} marketId:${marketId} accountId:${accountId} betId:${betId}`)
                                                        }
                                                    })
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
