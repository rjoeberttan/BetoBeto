//jshint esversion: 6
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {createLogger, transports, format} = require("winston");
const helmet = require("helmet")
const fs = require('fs');
const bodyParser = require('body-parser')
require("dotenv").config();

// Configure Express Application
const app = express();
app.use(express.json());
app.use(helmet())
app.use(
    cors({
        origin: ["http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true,
    })
)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Configure Winston Logging 
// For this environment it sends to console first
const logger =  createLogger({
    format: format.combine(
        format.timestamp({format: 'YYYY-MM-DDTHH:mm:ss.ms'}),
        format.printf(info => `${JSON.stringify({timestamp: info.timestamp, level: info.level, message: info.message})}`)
    ),
    transports: [
        new transports.Console     
    ]
})


// Configure Database Connection
const db = mysql.createConnection({
    user: process.env.MYSQL_USERNAME,
    host: process.env.MYSQL_HOST,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.PORT,
})

// Saltrounds for encryption
const saltRounds = parseInt(process.env.SALT_ROUNDS)


// POST REGISTER
// Requires: api-key, email, username, cell_no, password, agent_id
// Responses:
//    401: Missing API Key
//    500: Server General Error
//    400: Missing Data in Body
//    409: Username or Email already used
//    409: Agent ID not found
//    409: Agent account type error
//    200: Success
app.post("/register", (req, res) => {
    
    // Get body
    const username = req.body.username
    const email = req.body.email
    const phone = req.body.phone
    const password = req.body.password
    const agentId = req.body.agentId

    const apiKey = req.header("Authorization") 

    // Check if body is complete
    if  (!username || !email || !phone || !agentId || !password){
        logger.warn("REGISTER request has missing body parameters")
        res.status(400).json({message: "Missing body parameters"})
        return;
    }

    // Check if apiKey is correct
    if (!apiKey || apiKey !== process.env.API_KEY){
        logger.warn("REGISTER request has missing/wrong API_KEY, from username:"+username)
        res.status(401).json({message: "Unauthorized Request"})
        return;
    }
       

    // Process 1: 
    // Check if agent ID is valid,
    sqlQuery = "SELECT account_type FROM accounts where account_id = ?"
    db.query(sqlQuery, agentId, (err, result1) => {
        if (err){
            logger.error("Process 1: Error in REGISTER request for username:"+username + " \n" + err)
            res.status(500).json({message: "Server error"})
        } else if (result1.length <= 0) {
            logger.warn("Warn in REGISTER, agent_id is not found, for username:" + username)
            res.status(409).json({message: "Agent ID is not Found. Please get valid Register Link"})
        } else if (result1[0].account_type === 3) {
            logger.warn("Warn in REGISTER, using player register link, for username:" + username)
            res.status(409).json({message: "Please get valid Register Link from Agents or Master Agents"})
        } else {
            const newUserAccountType = result1[0].account_type + 1

            // Process 2:
            // Check if username and email is already used
            sqlQuery2 = "SELECT account_id FROM accounts where username = ? OR email = ?"
            db.query(sqlQuery2, [username, email], (err, result2) => {
                if (err) {
                    logger.error("Process 2: Error in REGISTER request for username:"+username + " \n" + err)
                    res.status(500).json({message: "Server error"})
                } else if (result2.length > 0){
                    logger.warn("Warn in REGISTER, username and/or email is already used for username:" + username )
                    res.status(409).json({message: "Username and/or Email is already used"})
                } else {

                    // Prepare values to be inserted
                    // username, email, phone, password, agent_id, account_type, account_status, wallet, created_date, lastedit_date, edited_by
                    const account_status = (newUserAccountType === 3) ? 1 : 0
                    const commission = (newUserAccountType === 1) ? 3.0 : (newUserAccountType === 2) ? 2.0 : null

                    // Process 3:
                    // Encrypt Password
                    bcrypt.hash(password, saltRounds, (err, hash) => {
                        if (err){
                            logger.error("Process 3: Error in REGISTER request for username:"+username + " \n" + err)
                            res.status(500).json({message: "Server error"})
                        } else {

                            // Process 4:
                            // Insert new user in database
                            sqlQuery3 = "INSERT INTO accounts (username, email, phone_num, password, agent_id, account_type, account_status, commission, created_date, lastedit_date, edited_by) VALUES (?,?,?,?,?,?,?,?,NOW(),NOW(),?)"
                            db.query(sqlQuery3, [username, email, phone, hash, agentId, newUserAccountType, account_status, commission, username], (err, result3) => {
                                if (err) {
                                    logger.error("Process 4: Error in REGISTER request for username:"+username + " \n" + err)
                                    res.status(500).json({message: "Server error"})            
                                } else if (result3.affectedRows > 0) {
                                    console.log("REGISTER successful for username:" + username)
                                    res.status(200).json({message: username + " Registered Successfully "})
                                } else{
                                    logger.warn("Process 4: Error in REGISTER request, but nothing was inserted, for username:"+username + " \n" + err)
                                    res.status(500).json({message: "Server error"})  
                                }
                            })

                        }
                    })
                    
                }
            })
        }
    })      
})

// POST LOGIN
// Requires: api-key, email, username, cell_no, password, agent_id
// Responses:
//    401: Missing API Key
//    500: Server General Error
//    400: Missing Data in Body
//    409: Username not found
//    409: Wrong Password
//    200: Success
app.post("/login", (req, res) => {

    // Get body
    const username = req.body.username
    const password = req.body.password
    
    const apiKey = req.header("Authorization") 

    // Check if body is complete
    if  (!username || !password){
        logger.warn("REGISTER request has missing body parameters")
        res.status(400).json({message: "Missing body parameters"})
        return;
    }


    // Check if apiKey is correct
    if (!apiKey || apiKey !== process.env.API_KEY){
        logger.warn("REGISTER request has missing/wrong API_KEY, from username:"+username)
        res.status(401).json({message: "Unauthorized Request"})
        return;
    }
    
    
    // Process 1
    // Check account found using username
    sqlQuery = "SELECT * FROM accounts WHERE username = ?"
    db.query(sqlQuery, [username], (err, result) => {
        if (err) {
            logger.error("Process 1: Error in LOGIN request for username:"+username + " \n" + err)
            res.status(500).json({message: "Server error"})
        } else if (result.length <= 0) {
            logger.warn("Warn in LOGIN, username not found, for username:" + username)
            res.status(409).json({message: "Username not found"})
        } else {

            // Process 2
            // Compare password encrypted
            bcrypt.compare(password, result[0].password, (err, response) => {
                if (err) {
                    logger.error("Process 2: Error in LOGIN request for username:"+username + " \n" + err)
                    res.status(500).json({message: "Server error"})
                } else if (!response) {
                    logger.warn("Warn in LOGIN, password enteres is wrong, for username:" + username)
                    res.status(409).json({message: "Wrong Password"})
                } else {

                    // Process 3
                    // Generate JWT Token
                    const username = result[0].username;
                    const accountId = result[0].account_id;
                    const accountType = result[0].account_type;

                    const token = jwt.sign({accountId, username, accountType}, process.env.JWT_SECRET, {expiresIn: '2h'})
                    logger.info("LOGIN successful for username:"+ username)
                    res.status(200).json({message: "Login Successful", accountId: accountId, username: username, accountType: accountType, token: token})

                    // Process 4
                    // Update LastLoginDate in Database
                    sqlQuery = "UPDATE accounts SET lastlogin_date = NOW() WHERE account_id = ?"
                    db.query(sqlQuery, [accountId], (err, result) => {
                        if (err) {
                            logger.error("Process 4: Error in LOGIN request for username:"+username + " \n" + err)
                        }
                    })
                    

                }
            })
        }
    })
})


// GET isUserAuth
// Process to check if user is still logged IN
// Responses:
//    401: Missing API Key
//    401: Missing token
//    401: Expired token
//    500: Server error
//    200: Success
app.get('/isUserAuth', (req, res) => {
    const token = req.headers["x-access-token"]
    const apiKey = req.header("Authorization") 

    // Check if apiKey is correct
    if (!apiKey || apiKey !== process.env.API_KEY){
        logger.warn("ISUSERAUTH request has missing/wrong API_KEY")
        res.status(401).json({message: "Unauthorized Request"})
        return;
    } 
    // Check if token submitted exists
    else if (!token){
        logger.warn("ISUSERAUTH request has no token")
        res.status(401).json({message: "Token not found"})
        return;
    } 
    else {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err){
                if (err.message === "TokenExpiredError"){
                    logger.warn("ISUSERAUTH request has expired token")
                    res.status(401).json({message: "Token Expired"})
                } else {
                    logger.error("Process 1: Error in ISUSERAUTH request. Error:" + "\n" + err)
                    res.status(500).json({message: "Server error"})
                }              
            } else {
                logger.info("Successful ISUSERAUTH request for username:" + decoded.username)
                res.send(200).json({message:"User is authenticated. Token still valid", accountId: decoded.accountId, username: decoded.username, accountType: decoded.accountType})
            }
        })
    }
})

// GET getUserDetails - to be used only for single users
// Requires: accountId, apiKey
// Responses:
//        500 - General Error
//        401 - Unauthorized Request
//        400 - Missing parameters
//        409 - Account not found
//        200 - Success
app.get('/getUserDetails/:accountId', (req, res) => { //http://localhost:4003/getUserDetails/16
    // Get body
    const accountId = req.params.accountId
    const apiKey = req.header("Authorization") 

    // Check if body is complete
    if  (!accountId){
        logger.warn("getUserDetails request has missing body parameters")
        res.status(400).json({message: "Missing body parameters"})
        return;
    }

    // Check if apiKey is correct
    if (!apiKey || apiKey !== process.env.API_KEY){
        logger.warn("getUserDetails request has missing/wrong API_KEY, from accountId:"+accountId)
        res.status(401).json({message: "Unauthorized Request"})
        return;
    }

    // Process 1
    // Get all necessary details
    sqlQuery = "SELECT username, account_type, commission, agent_id, email, phone_num FROM accounts where account_id = ?"
    db.query(sqlQuery, [accountId], (err, result) => {
        if (err){
            logger.error("Process 1: Error in getUserDetails request. Error:" + "\n" + err)
            res.status(500).json({message: "Server error"})
        } else if (result.length <= 0) {
            logger.warn("Warn in getUserDetails, account not found, for accountId:" + accountId)
            res.status(409).json({message: "Account not found"})
        } else {
            logger.info("Successful getUserDetails request for accountId:"+accountId)
            res.status(200).json({message: "Request successful", data: result[0]})
        }
    });
})



// GET getWalletBalance - to be used only for single users
// Requires: accountId, apiKey
// Responses:
//        500 - General Error
//        401 - Unauthorized Request
//        400 - Missing parameters
//        409 - Account not found
//        200 - Success
app.get('/getWalletBalance/:accountId', (req, res) => {
        // Get body
        const accountId = req.params.accountId
        const apiKey = req.header("Authorization") 
    
        // Check if body is complete
        if  (!accountId){
            logger.warn("getWalletBalance request has missing body parameters")
            res.status(400).json({message: "Missing body parameters"})
            return;
        }
    
        // Check if apiKey is correct
        if (!apiKey || apiKey !== process.env.API_KEY){
            logger.warn("getWalletBalance request has missing/wrong API_KEY, from accountId:"+accountId)
            res.status(401).json({message: "Unauthorized Request"})
            return;
        }
    
        // Process 1
        // Get all necessary details
        sqlQuery = "SELECT wallet FROM accounts where account_id = ?"
        db.query(sqlQuery, [accountId], (err, result) => {
            if (err){
                logger.error("Process 1: Error in getWalletBalance request. Error:" + "\n" + err)
                res.status(500).json({message: "Server error"})
            } else if (result.length <= 0) {
                logger.warn("Warn in getWalletBalance, account not found, for accountId:" + accountId)
                res.status(409).json({message: "Account not found"})
            } else {
                logger.info("Successful getWalletBalance request for accountId:"+accountId)
                res.status(200).json({message: "Request successful", accountId: accountId, wallet: result[0].wallet})
            }
        });
})

// POST updatePhoneDetail
// Requires: accountId, phone, editorUsername, apiKey
// Response:
//      500 - General Error
//      400 - Missing body parameters
//      401 - Unauthorized wrong api key
//      409 - Account ID not found, update not successful
//      200 - Successful
app.post('/updatePhoneDetail', (req,res) => {
        // Get body
        const accountId = req.body.accountId
        const phone = req.body.phone
        const editorUsername = req.body.editorUsername
        const apiKey = req.header("Authorization") 

        // Check if body is complete
        if  (!accountId || !phone || !editorUsername ){
            logger.warn("updatePhoneDetail request has missing body parameters")
            res.status(400).json({message: "Missing body parameters"})
            return;
        }

        // Check if apiKey is correct
        if (!apiKey || apiKey !== process.env.API_KEY){
            logger.warn("updatePhoneDetail request has missing/wrong API_KEY, from accountId:" + accountId)
            res.status(401).json({message: "Unauthorized Request"})
            return;
        }

        // Process 1
        // Update the entry
        sqlQuery = "UPDATE accounts SET phone_num = ?, lastedit_date = NOW(), edited_by = ? WHERE account_id = ?"
        db.query(sqlQuery, [phone, editorUsername, accountId], (err, result) => {
            if (err){
                logger.error("Process 1: Error in updatePhoneDetail request.accountId:" + accountId + "\n" + err)
                res.status(500).json({message: "Server error"})
            } else if (result.affectedRows === 0) {
                logger.warn("Requested updatePhoneDetail, but nothing changed, accountId:" + accountId)
                res.status(409).json({message: "Account ID not found. Update unsuccessful"})
            } else {
                logger.info("Successful updatePhoneDetail request for accountId:" + accountId)
                res.status(200).json({message: "Phone Number updated Successfully"})
            }
        })
})

// POST updatePhoneDetail
// Requires: accountId, phone, editorUsername, apiKey
// Response:
//      500 - General Error
//      400 - Missing body parameters
//      401 - Unauthorized wrong api key
//      409 - Account ID not found, update not successful
//      200 - Successful
app.post('/updatePassword', (req, res) => {
    // Get body
    const accountId = req.body.accountId
    const password = req.body.password
    const editorUsername = req.body.editorUsername
    const apiKey = req.header("Authorization") 

    // Check if body is complete
    if  (!accountId || !password || !editorUsername ){
        logger.warn("updatePhoneDetail request has missing body parameters")
        res.status(400).json({message: "Missing body parameters"})
        return;
    }

    // Check if apiKey is correct
    if (!apiKey || apiKey !== process.env.API_KEY){
        logger.warn("updatePhoneDetail request has missing/wrong API_KEY, from accountId:"+accountId)
        res.status(401).json({message: "Unauthorized Request"})
        return;
    }

    // Process 1
    // Encrypt the password
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err){
            logger.error("Process 1: Error in updatePassword request for accountId:"+ accountId + " \n" + err)
            res.status(500).json({message: "Server error"})
        } else {

            // Process 2:
            // Update user in database
            sqlQuery = "UPDATE accounts SET password = ?, lastedit_date = NOW(), edited_by = ? WHERE account_id = ?"
            db.query(sqlQuery, [hash, editorUsername, accountId], (err, result) => {
                if (err){
                    logger.error("Process 2: Error in updatePassword request.accountId:" + accountId + "\n" + err)
                    res.status(500).json({message: "Server error"})
                } else if (result.affectedRows === 0) {
                    logger.warn("Requested updatePassword, but nothing changed, accountId:" + accountId)
                    res.status(409).json({message: "Account ID not found. Update unsuccessful"})
                } else {
                    logger.info("Successful updatePassword request for accountId:" + accountId)
                    res.status(200).json({message: "Password updated Successfully"})
                }
            })
        }
    })
})


// POST updatePhoneDetail
// Requires: accountId, status (as string), editorUsername, apiKey
// Response:
//      500 - General Error
//      400 - Missing body parameters
//      401 - Unauthorized wrong api key
//      409 - Account ID not found, update not successful
//      200 - Successful
app.post('/changeAccountStatus', (req, res) => {
    // Get body
    const accountId = req.body.accountId
    const currentStatus = req.body.status
    const editorUsername = req.body.editorUsername
    const apiKey = req.header("Authorization") 

    // Check if body is complete
    if  (!accountId || !currentStatus || !editorUsername ){
        logger.warn("updatePhoneDetail request has missing body parameters")
        res.status(400).json({message: "Missing body parameters"})
        return;
    }

    // Check if apiKey is correct
    if (!apiKey || apiKey !== process.env.API_KEY){
        logger.warn("updatePhoneDetail request has missing/wrong API_KEY, from accountId:"+accountId)
        res.status(401).json({message: "Unauthorized Request"})
        return;
    }

    // Process 1
    // Update Status
    const newStatus = (currentStatus === '1') ? 0 : 1
    sqlQuery = "UPDATE accounts SET account_status = ?, lastedit_date = NOW(), edited_by = ? WHERE account_id = ?"
    db.query(sqlQuery, [newStatus, editorUsername, accountId], (err, result) => {
        if (err){
            logger.error("Process 1: Error in changeAccountStatus request.accountId:" + accountId + "\n" + err)
            res.status(500).json({message: "Server error"})
        } else if (result.affectedRows === 0) {
            logger.warn("Requested changeAccountStatus, but nothing changed, accountId:" + accountId)
            res.status(409).json({message: "Account ID not found. Update unsuccessful"})
        } else {
            logger.info("Successful changeAccountStatus request for to status:" + newStatus + " for accountId:" + accountId)
            res.status(200).json({message: "Account Status updated Successfully", accountId: accountId, accountStatus: newStatus})
        }
    })
})


// POST updateCommission
// Requires: accountId, commission, editorUsername, apiKey
// Response:
//      500 - General Error
//      400 - Missing body parameters
//      401 - Unauthorized wrong api key
//      409 - Account ID not found, update not successful
//      200 - Successful
app.post('/updateCommission', (req,res) => {
    // Get body
    const accountId = req.body.accountId
    const commission = req.body.commission
    const editorUsername = req.body.editorUsername
    const apiKey = req.header("Authorization") 

    // Check if body is complete
    if  (!accountId || !commission || !editorUsername ){
        logger.warn("updateCommission request has missing body parameters")
        res.status(400).json({message: "Missing body parameters"})
        return;
    }

    // Check if apiKey is correct
    if (!apiKey || apiKey !== process.env.API_KEY){
        logger.warn("updateCommission request has missing/wrong API_KEY, from accountId:" + accountId)
        res.status(401).json({message: "Unauthorized Request"})
        return;
    }

    // Process 1
    // Update the entry
    sqlQuery = "UPDATE accounts SET commission = ?, lastedit_date = NOW(), edited_by = ? WHERE account_id = ?"
    db.query(sqlQuery, [commission, editorUsername, accountId], (err, result) => {
        if (err){
            logger.error("Process 1: Error in updatePhupdateCommissiononeDetail request.accountId:" + accountId + "\n" + err)
            res.status(500).json({message: "Server error"})
        } else if (result.affectedRows === 0) {
            logger.warn("Requested updateCommission, but nothing changed, accountId:" + accountId)
            res.status(409).json({message: "Account ID not found. Update unsuccessful"})
        } else {
            logger.info("Successful updateCommission request for accountId:" + accountId)
            res.status(200).json({message: "Commission updated Successfully", data:{ accountId: accountId, commission: commission}})
        }
    })
})



app.get("/getAccountList/:accountId/:accountType", (req, res) => {
    // Get body
    const accountId = req.params.accountId
    const accountType = req.params.accountType
    const apiKey = req.header("Authorization") 
   

    // Check if body is complete
    if  (!accountId || !accountType ){
        logger.warn("getAccountList request has missing body parameters")
        res.status(400).json({message: "Missing body parameters"})
        return;
    }

    // Check if apiKey is correct
    if (!apiKey || apiKey !== process.env.API_KEY){
        logger.warn("getAccountList request has missing/wrong API_KEY, from accountId:" + accountId)
        res.status(401).json({message: "Unauthorized Request"})
        return;
    }

    sqlQuery = ''
    // Create SQL query depending on the accountType
    if (accountType === '0'){
        // Administrator
        sqlQuery = "SELECT * FROM accounts;"
        sqlQuery = db.format(sqlQuery, )
        console.log(sqlQuery)
    } else if (accountType === '1'){
        // Master Agent
        sqlQuery = "select * from accounts where agent_id = ? OR agent_id in (select account_id from accounts where agent_id = ?);"
        sqlQuery = db.format(sqlQuery, [accountId, accountId])
        console.log(sqlQuery)
    } else if (accountType === '2') {
         // Agent Agent
         sqlQuery = "SELECT * FROM accounts WHERE agent_id = ?"
         sqlQuery = db.format(sqlQuery, [accountId])
         console.log(sqlQuery)
    }

    if (sqlQuery !== ''){
        db.query(sqlQuery, (err, result) => {
            if (err) {
                logger.error(" Process 1: Error in getAccountList request from accountId:" + accountId + err);
            } else {
                res.status(200).json({message: "Request Successful", data: result})
            }
        })

    } else {
        res.status(401).json({message: "User type is not authorized to ask this request"})
    }
})

app.listen(4003, () => {
    console.log("Server listentning at port 4003");
})