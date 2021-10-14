//jshint esversion: 6
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {createLogger, transports, format} = require("winston");
const e = require("express");
require("dotenv").config();

// Configure Express Application
const app = express();
app.use(express.json());
app.use(
    cors({
        origin: ["http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true,
    })
)
app.use(express.urlencoded({ extended: true }));


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
    database: process.env.MYSQL_DATABASE
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
    const apiKey = req.body.apiKey

    logger.info("Received REGISTER request from username:"+username)

    // Check if apiKey is correct
    if (!apiKey || apiKey !== process.env.API_KEY){
        logger.warn("REGISTER request has missing/wrong API_KEY, from username:"+username)
        res.status(401).json({message: "Unauthorized Request"})
        return;
    }
    
    // Check if body is complete
    if  (!username || !email || !phone || !agentId || !password){
        logger.warn("REGISTER request has missing body parameters, from username:"+username)
        res.status(400).json({message: "Missing body parameters"})
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
                                    res.status(200).send(username + " Registered Successfully ")
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
    const apiKey = req.body.apiKey

    // Check if apiKey is correct
    if (!apiKey || apiKey !== process.env.API_KEY){
        logger.warn("REGISTER request has missing/wrong API_KEY, from username:"+username)
        res.status(401).json({message: "Unauthorized Request"})
        return;
    }
    
    // Check if body is complete
    if  (!username || !password){
        logger.warn("REGISTER request has missing body parameters, from username:"+username)
        res.status(400).json({message: "Missing body parameters"})
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
                    res.status(200).json({message: "Login Successful", token: token})

                }
            })
        }
    })
})







app.listen(4003, () => {
    console.log("Server listentning at port 4003");
})