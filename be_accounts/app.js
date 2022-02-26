//jshint esversion: 6
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createLogger, transports, format } = require("winston");
const helmet = require("helmet");
const fs = require("fs");
const { toNamespacedPath } = require("path");
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
// For this environment it sends to console first
const logger = createLogger({
  format: format.combine(
    format.timestamp({ format: "MMM-DD-YYYY HH:mm:ss" }),
    format.printf(
      (info) =>
        `${info.timestamp} -- ${info.level.toUpperCase()} -- ${info.message}`
    )
  ),
  transports: [new transports.File({ filename: "/var/log/app/accounts.log" })],
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

// Saltrounds for encryption
const saltRounds = parseInt(process.env.SALT_ROUNDS);

// Account Types
// 0 - Admin
// 1 - Master Agent
// 2 - Agent
// 3 - Player
// 4 - Declarator
// 5 - Grand Master

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
  console.log("here")
  //Set Duration
  const start = process.hrtime();

  // Get body
  const username = req.body.username;
  const email = req.body.email;
  const phone = req.body.phone;
  const password = req.body.password;
  const agentId = req.body.agentId;

  const apiKey = req.header("Authorization");

  // Check if body is complete
  if (!username || !email || !phone || !agentId || !password) {
    logger.error(
      `${req.originalUrl} request has missing body parameters, username:${username}`
    );
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(
      `${req.originalUrl} request has missing/wrong apiKey, username:${username} received:${apiKey}`
    );
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  // Process 1:
  // Check if agent ID is valid,
  sqlQuery = "SELECT account_type FROM accounts where account_id = ?";
  db.query(sqlQuery, agentId, (err, result1) => {
    if (err) {
      logger.error(
        `${req.originalUrl}  request has an error during process 1, username:${username}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else if (result1.length <= 0) {
      logger.warn(
        `${req.originalUrl} request warning, agentId is not found in database, received agentId:${agentId}, username:${username}`
      );
      res.status(409).json({
        message: "Agent ID is not Found. Please get valid Register Link",
      });
    } else if (result1[0].account_type === 3 || result1[0].account_type === 4) {
      logger.warn(
        `${req.originalUrl} request warning, registering using an invalid agent type, received agentId:${agentId}, username:${username}`
      );
      res.status(409).json({
        message: "Please get valid Register Link from Agents or Master Agents",
      });
    } else {
      agentAccountType = result1[0].account_type;
      var newUserAccountType = 0;

      if (agentAccountType === 0) {
        newUserAccountType = 5; // Grand Master
      } else if (agentAccountType === 5) {
        newUserAccountType = 1; // Master Agent
      } else if (agentAccountType === 1) {
        newUserAccountType = 2; // Agent
      } else if (agentAccountType === 2) {
        newUserAccountType = 3; // Player
      } else {
        newUserAccountType = 4;
      }

      // Process 2:
      // Check if username and email is already used
      sqlQuery2 =
        "SELECT account_id FROM accounts where username = ? OR email = ?";
      db.query(sqlQuery2, [username, email], (err, result2) => {
        if (err) {
          logger.error(
            `${req.originalUrl}  request has an error during process 2, username:${username}, error:${err}`
          );
          res.status(500).json({ message: "Server error" });
        } else if (result2.length > 0) {
          logger.warn(
            `${req.originalUrl}  request warning, username and/or email is already used, username:${username}, email:${email}`
          );
          res
            .status(409)
            .json({ message: "Username and/or Email is already used" });
        } else {
          // Prepare values to be inserted
          // username, email, phone, password, agent_id, account_type, account_status, wallet, created_date, lastedit_date, edited_by
          const account_status = 0;
          const commission =
            newUserAccountType === 1
              ? 4.5
              : newUserAccountType === 2
              ? 2
              : newUserAccountType === 5
              ? 0.5
              : null;

          // Process 3:
          // Encrypt Password
          bcrypt.hash(password, saltRounds, (err, hash) => {
            if (err) {
              logger.error(
                `${req.originalUrl}  request has an error during process 3, username:${username}, error:${err}`
              );
              res.status(500).json({ message: "Server error" });
            } else {
              // Process 4:
              // Insert new user in database
              sqlQuery3 =
                "INSERT INTO accounts (username, email, phone_num, password, agent_id, account_type, account_status, commission, created_date, lastedit_date, edited_by) VALUES (?,?,?,?,?,?,?,?,NOW(),NOW(),?)";
              db.query(
                sqlQuery3,
                [
                  username,
                  email,
                  phone,
                  hash,
                  agentId,
                  newUserAccountType,
                  account_status,
                  commission,
                  username,
                ],
                (err, result3) => {
                  if (err) {
                    logger.error(
                      `${req.originalUrl}  request has an error during process 4, username:${username}, error:${err}`
                    );
                    res.status(500).json({ message: "Server error" });
                  } else if (result3.affectedRows > 0) {
                    logger.info(
                      `${req.originalUrl}  request successful, accountId:${
                        result3.insertId
                      } username:${username} duration:${getDurationInMilliseconds(
                        start
                      )}`
                    );
                    res.status(200).json({
                      message: username + " Registered Successfully ",
                    });
                  } else {
                    logger.error(
                      `${
                        req.originalUrl
                      } requested but nothing was inserted, username:${username} duration:${getDurationInMilliseconds(
                        start
                      )}`
                    );
                    res.status(500).json({ message: "Server error" });
                  }
                }
              );
            }
          });
        }
      });
    }
  });
});

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
  const start = process.hrtime();
  // Get body
  const username = req.body.username;
  const password = req.body.password;

  const apiKey = req.header("Authorization");

  // Check if body is complete
  if (!username || !password) {
    logger.error(
      `${req.originalUrl} request has missing body parameters, username:${username}`
    );
    res.status(400).json({ message: "Missing body parameters" });
    return;
  }

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(
      `${req.originalUrl} request has missing/wrong apiKey, username:${username} received:${apiKey} expecting:${process.env.API_KEY}`
    );
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }

  // Process 1
  // Check account found using username
  sqlQuery = "SELECT * FROM accounts WHERE username = ?";
  db.query(sqlQuery, [username], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, username:${username}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else if (result.length <= 0) {
      logger.warn(
        `${req.originalUrl} request warning, username is not found in database, username:${username}`
      );
      res.status(409).json({ message: "Username not found" });
    } else {
      // Process 2
      // Compare password encrypted
      bcrypt.compare(password, result[0].password, (err, response) => {
        if (err) {
          logger.error(
            `${req.originalUrl} request has an error during process 2, username:${username}, error:${err}`
          );
          res.status(500).json({ message: "Server error" });
        } else if (!response) {
          logger.warn(
            `${req.originalUrl} request warning, wrong password entered, username:${username}`
          );
          res.status(409).json({ message: "Wrong Password" });
        } else {
          // Process 3
          // Generate JWT Token
          const username = result[0].username;
          const accountId = result[0].account_id;
          const accountType = result[0].account_type;

          const accountStatus = result[0].account_status;
          const email = result[0].email;
          const phoneNum = result[0].phone_num;

          const token = jwt.sign(
            { accountId, username, accountType, email, phoneNum },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
          );

          const duration = getDurationInMilliseconds(start);
          logger.info(
            `${req.originalUrl} request successful, username:${username} duration:${duration}`
          );
          res.status(200).json({
            message: "Login Successful",
            accountId: accountId,
            username: username,
            accountType: accountType,
            accountStatus: accountStatus,
            email: email,
            phoneNum: phoneNum,
            commission: result[0].commission,
            token: token,
          });

          // Process 4
          // Update LastLoginDate in Database
          sqlQuery =
            "UPDATE accounts SET lastlogin_date = NOW() WHERE account_id = ?";
          db.query(sqlQuery, [accountId], (err, result) => {
            if (err) {
              logger.error(
                `${req.originalUrl} request has an error during process 4, username:${username}, error:${err}`
              );
            }
          });
        }
      });
    }
  });
});

// GET isUserAuth
// Process to check if user is still logged IN
// Responses:
//    401: Missing API Key
//    401: Missing token
//    401: Expired token
//    500: Server error
//    200: Success
app.get("/isUserAuth", (req, res) => {
  const start = process.hrtime();
  const token = req.headers["x-access-token"];
  const apiKey = req.header("Authorization");

  // Check if apiKey is correct
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(
      `${req.originalUrl}  request has missing/wrong apiKey, received:${apiKey}`
    );
    res.status(401).json({ message: "Unauthorized Request" });
    return;
  }
  // Check if token submitted exists
  else if (!token) {
    logger.warn(`${req.originalUrl} request has no token`);
    res.status(401).json({ message: "Token not found" });
    return;
  } else {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.message === "TokenExpiredError") {
          logger.warn(
            `${req.originalUrl} request has expired token, accountId:${decoded.accountId} username:${decoded.username}`
          );
          res.status(401).json({ message: "Token Expired" });
        } else {
          logger.error(
            `${req.originalUrl}  request has an error during process 1, error:${err}`
          );
          res.status(500).json({ message: "Server error" });
        }
      } else {
        logger.info(
          `${req.originalUrl} request successful, accountId:${
            decoded.accountId
          } username:${decoded.username} duration:${getDurationInMilliseconds(
            start
          )} `
        );
        res.status(200).json({
          message: "User is authenticated. Token still valid",
          accountId: decoded.accountId,
          username: decoded.username,
          accountType: decoded.accountType,
          email: decoded.email,
          phoneNum: decoded.phoneNum,
        });
      }
    });
  }
});

// GET getUserDetails - to be used only for single users
// Requires: accountId, apiKey
// Responses:
//        500 - General Error
//        401 - Unauthorized Request
//        400 - Missing parameters
//        409 - Account not found
//        200 - Success
app.get("/getUserDetails/:accountId", (req, res) => {
  const start = process.hrtime();
  // Get body
  const accountId = req.params.accountId;
  const apiKey = req.header("Authorization");

  // Check if body is complete
  if (!accountId) {
    logger.warn(
      `${req.originalUrl} request has missing body parameters, accountId:${accountId}`
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
  // Get all necessary details
  sqlQuery =
    "SELECT username, account_type, commission, agent_id, email, phone_num FROM accounts where account_id = ?";
  db.query(sqlQuery, [accountId], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else if (result.length <= 0) {
      logger.warn(
        `${req.originalUrl} request warning, account is not found in database, accountId:${accountId}`
      );
      res.status(409).json({ message: "Account not found" });
    } else {
      logger.info(
        `${
          req.originalUrl
        } request successful, accountId:${accountId} duration:${getDurationInMilliseconds(
          start
        )}`
      );
      res.status(200).json({ message: "Request successful", data: result[0] });
    }
  });
});

// GET getWalletBalance - to be used only for single users
// Requires: accountId, apiKey
// Responses:
//        500 - General Error
//        401 - Unauthorized Request
//        400 - Missing parameters
//        409 - Account not found
//        200 - Success
app.get("/getWalletBalance/:accountId", (req, res) => {
  const start = process.hrtime();
  // Get body
  const accountId = req.params.accountId;
  const apiKey = req.header("Authorization");

  // Check if body is complete
  if (!accountId) {
    logger.warn(
      `${req.originalUrl} request has missing body parameters, accountId:${accountId}`
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
  // Get all necessary details
  sqlQuery = "SELECT wallet FROM accounts where account_id = ?";
  db.query(sqlQuery, [accountId], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else if (result.length <= 0) {
      logger.warn(
        `${req.originalUrl} request warning, account is not found in database, accountId:${accountId}`
      );
      res.status(409).json({ message: "Account not found" });
    } else {
      logger.info(
        `${
          req.originalUrl
        } request successful, accountId:${accountId} duration:${getDurationInMilliseconds(
          start
        )}`
      );
      res.status(200).json({
        message: "Request successful",
        accountId: accountId,
        wallet: result[0].wallet,
      });
    }
  });
});


app.get("/getCommission/:accountId", (req, res) => {
  const start = process.hrtime();
  // Get body
  const accountId = req.params.accountId;
  const apiKey = req.header("Authorization");

  // Check if body is complete
  if (!accountId) {
    logger.warn(
      `${req.originalUrl} request has missing body parameters, accountId:${accountId}`
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
  // Get all necessary details
  sqlQuery = "SELECT commission FROM accounts where account_id = ?";
  db.query(sqlQuery, [accountId], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else if (result.length <= 0) {
      logger.warn(
        `${req.originalUrl} request warning, account is not found in database, accountId:${accountId}`
      );
      res.status(409).json({ message: "Account not found" });
    } else {
      logger.info(
        `${
          req.originalUrl
        } request successful, accountId:${accountId} duration:${getDurationInMilliseconds(
          start
        )}`
      );
      res.status(200).json({
        message: "Request successful",
        accountId: accountId,
        commission: result[0].commission,
      });
    }
  });
});

// POST updatePhoneDetail
// Requires: accountId, phone, editorUsername, apiKey
// Response:
//      500 - General Error
//      400 - Missing body parameters
//      401 - Unauthorized wrong api key
//      409 - Account ID not found, update not successful
//      200 - Successful
app.post("/updatePhoneDetail", (req, res) => {
  const start = process.hrtime();
  // Get body
  const accountId = req.body.accountId;
  const phone = req.body.phone;
  const editorUsername = req.body.editorUsername;
  const apiKey = req.header("Authorization");

  // Check if body is complete
  if (!accountId || !phone || !editorUsername) {
    logger.warn(
      `${req.originalUrl} request has missing body parameters, accountId:${accountId}`
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
  // Update the entry
  sqlQuery =
    "UPDATE accounts SET phone_num = ?, lastedit_date = NOW(), edited_by = ? WHERE account_id = ?";
  db.query(sqlQuery, [phone, editorUsername, accountId], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else if (result.affectedRows === 0) {
      logger.warn(
        `${req.originalUrl} request warning, account is not found in database, accountId:${accountId}`
      );
      res
        .status(409)
        .json({ message: "Account ID not found. Update unsuccessful" });
    } else {
      logger.info(
        `${
          req.originalUrl
        } request successful, accountId:${accountId} editor:${editorUsername} phoneNum:${phone} duration:${getDurationInMilliseconds(
          start
        )}`
      );
      res.status(200).json({ message: "Phone Number updated Successfully" });
    }
  });
});

// POST updatePhoneDetail
// Requires: accountId, phone, editorUsername, apiKey
// Response:
//      500 - General Error
//      400 - Missing body parameters
//      401 - Unauthorized wrong api key
//      409 - Account ID not found, update not successful
//      200 - Successful
app.post("/updatePassword", (req, res) => {
  const start = process.hrtime();
  // Get body
  const accountId = req.body.accountId;
  const password = req.body.password;
  const editorUsername = req.body.editorUsername;
  const apiKey = req.header("Authorization");

  // Check if body is complete
  if (!accountId || !password || !editorUsername) {
    logger.warn(
      `${req.originalUrl} request has missing body parameters, accountId:${accountId}`
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
  // Encrypt the password
  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else {
      // Process 2:
      // Update user in database
      sqlQuery =
        "UPDATE accounts SET password = ?, lastedit_date = NOW(), edited_by = ? WHERE account_id = ?";
      db.query(sqlQuery, [hash, editorUsername, accountId], (err, result) => {
        if (err) {
          logger.error(
            `${req.originalUrl} request has an error during process 2, accountId:${accountId}, error:${err}`
          );
          res.status(500).json({ message: "Server error" });
        } else if (result.affectedRows === 0) {
          logger.warn(
            `${req.originalUrl} request warning, nothing updated, accountId:${accountId}`
          );
          res
            .status(409)
            .json({ message: "Account ID not found. Update unsuccessful" });
        } else {
          logger.info(
            `${
              req.originalUrl
            } request successful, accountId:${accountId} editor:${editorUsername} duration:${getDurationInMilliseconds(
              start
            )}`
          );
          res.status(200).json({ message: "Password updated successfully" });
        }
      });
    }
  });
});

// POST updatePhoneDetail
// Requires: accountId, status (as string), editorUsername, apiKey
// Response:
//      500 - General Error
//      400 - Missing body parameters
//      401 - Unauthorized wrong api key
//      409 - Account ID not found, update not successful
//      200 - Successful
app.post("/changeAccountStatus", (req, res) => {
  const start = process.hrtime();
  // Get body
  const accountId = req.body.accountId;
  const currentStatus = req.body.status;
  const editorUsername = req.body.editorUsername;
  const apiKey = req.header("Authorization");

  // Check if body is complete
  if (!accountId || !currentStatus || !editorUsername) {
    logger.warn(
      `${req.originalUrl} request has missing body parameters, accountId:${accountId}`
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
  // Update Status
  const newStatus = currentStatus === "1" ? 0 : 1;
  sqlQuery =
    "UPDATE accounts SET account_status = ?, lastedit_date = NOW(), edited_by = ? WHERE account_id = ?";
  db.query(sqlQuery, [newStatus, editorUsername, accountId], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else if (result.affectedRows === 0) {
      logger.warn(
        `${req.originalUrl} request warning, account is not found in database, accountId:${accountId}`
      );
      res
        .status(409)
        .json({ message: "Account ID not found. Update unsuccessful" });
    } else {
      logger.info(
        `${
          req.originalUrl
        } request successful, accountId:${accountId} editor:${editorUsername} accountStatus:${newStatus} duration:${getDurationInMilliseconds(
          start
        )}`
      );
      res.status(200).json({
        message: "Account Status updated Successfully",
        accountId: accountId,
        accountStatus: newStatus,
      });
    }
  });
});

// POST updateCommission
// Requires: accountId, commission, editorUsername, apiKey
// Response:
//      500 - General Error
//      400 - Missing body parameters
//      401 - Unauthorized wrong api key
//      409 - Account ID not found, update not successful
//      200 - Successful
app.post("/updateCommission", (req, res) => {
  const start = process.hrtime();
  // Get body
  const accountId = req.body.accountId;
  const accountType = req.body.accountType;
  const commission = req.body.commission;
  const editorUsername = req.body.editorUsername;
  const apiKey = req.header("Authorization");

  // Check if body is complete
  if (!accountId || !commission || !editorUsername || !accountType) {
    logger.warn(
      `${req.originalUrl} request has missing body parameters, accountId:${accountId}`
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
  var masterAgentCommission = 0;
  if (accountType === "2") {
    // Check commission of master agent Process 4
    sqlQuery4 =
      "SELECT commission from accounts WHERE account_id in (SELECT agent_id from accounts WHERE account_id = ?)";
    db.query(sqlQuery4, [accountId], (err4, result4) => {
      if (err4) {
        logger.error(
          `${req.originalUrl} request has an error during process 4, accountId:${accountId}, error:${err}`
        );
        res.status(500).json({ message: "Server error" });
      } else {
        masterAgentCommission = result4[0].commission;
        if (masterAgentCommission <= commission) {
          res
            .status(409)
            .json({
              message: "Commission cannot be greater or equal to master agent",
            });
        } else {
          sqlQuery =
            "UPDATE accounts SET commission = ?, lastedit_date = NOW(), edited_by = ? WHERE account_id = ?";
          db.query(
            sqlQuery,
            [commission, editorUsername, accountId],
            (err, result) => {
              if (err) {
                logger.error(
                  `${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`
                );
                res.status(500).json({ message: "Server error" });
              } else if (result.affectedRows === 0) {
                logger.warn(
                  `${req.originalUrl} request warning, account is not found in database, accountId:${accountId}`
                );
                res
                  .status(409)
                  .json({
                    message: "Account ID not found. Update unsuccessful",
                  });
              } else {
                logger.info(
                  `${
                    req.originalUrl
                  } request successful, accountId:${accountId} editor:${editorUsername} commission:${commission} duration:${getDurationInMilliseconds(
                    start
                  )}`
                );
                res.status(200).json({
                  message: "Commission updated Successfully",
                  data: { accountId: accountId, commission: commission },
                });
              }
            }
          );
        }
      }
    });
  } else {
    sqlQuery =
      "UPDATE accounts SET commission = ?, lastedit_date = NOW(), edited_by = ? WHERE account_id = ?";
    db.query(
      sqlQuery,
      [commission, editorUsername, accountId],
      (err, result) => {
        if (err) {
          logger.error(
            `${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`
          );
          res.status(500).json({ message: "Server error" });
        } else if (result.affectedRows === 0) {
          logger.warn(
            `${req.originalUrl} request warning, account is not found in database, accountId:${accountId}`
          );
          res
            .status(409)
            .json({ message: "Account ID not found. Update unsuccessful" });
        } else {
          logger.info(
            `${
              req.originalUrl
            } request successful, accountId:${accountId} editor:${editorUsername} commission:${commission} duration:${getDurationInMilliseconds(
              start
            )}`
          );
          res.status(200).json({
            message: "Commission updated Successfully",
            data: { accountId: accountId, commission: commission },
          });
        }
      }
    );
  }
});

app.get("/getAccountList/:accountId/:accountType", (req, res) => {
  const start = process.hrtime();
  // Get body
  const accountId = req.params.accountId;
  const accountType = req.params.accountType;
  const apiKey = req.header("Authorization");

  // Check if body is complete
  if (!accountId || !accountType) {
    logger.warn(
      `${req.originalUrl} request has missing body parameters, accountId:${accountId}`
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

  sqlQuery = "";
  // Create SQL query depending on the accountType
  if (accountType === "0" || accountType === "4") {
    // Administrator
    sqlQuery = "SELECT * FROM accounts;";
    sqlQuery = db.format(sqlQuery);
  } else if (accountType === "5") {
    // Grandmaster
    sqlQuery = `select * from accounts where agent_id = ?
      union
      select * from accounts where agent_id in (select account_id from accounts where agent_id = ?)
      union
      select * from accounts where agent_id in (select account_id from accounts where agent_id in (select account_id from accounts where agent_id = ?));`;
    sqlQuery = db.format(sqlQuery, [accountId, accountId, accountId]);
  } else if (accountType === "1") {
    // Master Agent
    sqlQuery =
      "select * from accounts where agent_id = ? OR agent_id in (select account_id from accounts where agent_id = ?);";
    sqlQuery = db.format(sqlQuery, [accountId, accountId]);
  } else if (accountType === "2") {
    // Agent Agent
    sqlQuery = "SELECT * FROM accounts WHERE agent_id = ?";
    sqlQuery = db.format(sqlQuery, [accountId]);
  }

  if (sqlQuery !== "") {
    db.query(sqlQuery, (err, result) => {
      if (err) {
        logger.error(
          `${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`
        );
      } else {
        logger.info(
          `${
            req.originalUrl
          } request successful, accountId:${accountId} duration:${getDurationInMilliseconds(
            start
          )}`
        );
        res.status(200).json({ message: "Request Successful", data: result });
      }
    });
  } else {
    logger.warn(
      `${req.originalUrl} request warning, account is not allowed to request the accountType, accountId:${accountId} accountType:${accountType}`
    );
    res
      .status(401)
      .json({ message: "User type is not authorized to ask this request" });
  }
});

// To be used to get masteragent count for GMs
// To be used to get agents count for MAs
// To be used to get players count for Agents
app.get("/getCountUnderUser/:accountId", (req, res) => {
  const start = process.hrtime();
  // Get body
  const accountId = req.params.accountId;
  const apiKey = req.header("Authorization");

  // Check if body is complete
  if (!accountId) {
    logger.warn(
      `${req.originalUrl}request has missing body parameters, accountId:${accountId}`
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
  // Get all necessary details
  sqlQuery = "SELECT count(*) as userCount FROM accounts where agent_id = ?";
  db.query(sqlQuery, [accountId], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else {
      logger.info(
        `${
          req.originalUrl
        } request successful, accountId:${accountId} duration:${getDurationInMilliseconds(
          start
        )}`
      );
      res.status(200).json({
        message: "Request successful",
        accountId: accountId,
        count: result[0].userCount,
      });
    }
  });
});

// To be used to get players count for MAs
// Can be used to get agents count for GMs
app.get("/getCountPlayer/:accountId", (req, res) => {
  const start = process.hrtime();
  // Get body
  const accountId = req.params.accountId;
  const apiKey = req.header("Authorization");

  // Check if body is complete
  if (!accountId) {
    logger.warn(
      `${req.originalUrl} request has missing body parameters, accountId:${accountId}`
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
  // Get all necessary details
  sqlQuery =
    "select count(*) as userCount from accounts where agent_id in (select account_id from accounts where agent_id = ?);";
  db.query(sqlQuery, [accountId], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else {
      logger.info(
        `${
          req.originalUrl
        } request successful, accountId:${accountId} duration:${getDurationInMilliseconds(
          start
        )}`
      );
      res.status(200).json({
        message: "Request successful",
        accountId: accountId,
        count: result[0].userCount,
      });
    }
  });
});

app.get("/getPlayersCountOfGM/:accountId", (req, res) => {
  const start = process.hrtime();
  // Get body
  const accountId = req.params.accountId;
  const apiKey = req.header("Authorization");

  // Check if body is complete
  if (!accountId) {
    logger.warn(
      `${req.originalUrl} request has missing body parameters, accountId:${accountId}`
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
  // Get all necessary details
  sqlQuery =
    "select count(*) as userCount from accounts where agent_id in (select account_id from accounts where agent_id in (select account_id from accounts where agent_id = ?));";

  db.query(sqlQuery, [accountId], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else {
      logger.info(
        `${
          req.originalUrl
        } request successful, accountId:${accountId} duration:${getDurationInMilliseconds(
          start
        )}`
      );
      res.status(200).json({
        message: "Request successful",
        accountId: accountId,
        count: result[0].userCount,
      });
    }
  });
});

app.get("/getAgentName/:accountId", (req, res) => {
  const start = process.hrtime();
  // Get body
  const accountId = req.params.accountId;
  const apiKey = req.header("Authorization");

  // Check if body is complete
  if (!accountId) {
    logger.warn(
      `${req.originalUrl} request has missing body parameters, accountId:${accountId}`
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
  // Get all necessary details
  sqlQuery =
    "select username from accounts where account_id in (select agent_id from accounts where account_id = ?);";
  db.query(sqlQuery, [accountId], (err, result) => {
    if (err) {
      logger.error(
        `${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`
      );
      res.status(500).json({ message: "Server error" });
    } else {
      logger.info(
        `${
          req.originalUrl
        } request successful, accountId:${accountId} duration:${getDurationInMilliseconds(
          start
        )}`
      );
      res.status(200).json({
        message: "Request successful",
        agentName: result[0].username,
      });
    }
  });
});



// Start Shift
app.post("/startShift", (req, res) => {
  const start = process.hrtime();
  // Get body
  const apiKey = req.header("Authorization");
  const accountId = req.body.accountId;
  const username = req.body.username;

    // Check if body is complete
    if (!accountId || !username) {
      logger.warn(`${req.originalUrl} request has missing body parameters, accountId:${accountId}`);
      res.status(400).json({ message: "Missing body parameters" });
      return;
    }
  
    // Check if apiKey is correct
    if (!apiKey || apiKey !== process.env.API_KEY) {
      logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`);
      res.status(401).json({ message: "Unauthorized Request" });
      return;
    }

    // Process 1 - Check if account still has an active shift
    sqlQuery1 = "SELECT time_out FROM shifts WHERE account_id = ? ORDER BY time_in DESC LIMIT 1;"
    db.query(sqlQuery1, [accountId], (err, result1) => {
      console.log(result1)
      if (err) {
        logger.error(`${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`);
        res.status(500).json({ message: "Server error" });
      } 
      else if (result1.length === 0 ) {
        //Process 2 - Insert new shift
        sqlQuery2 = "INSERT INTO shifts (account_id, username, time_in, lastedit_date, game_id) VALUES (?, ?, NOW(), NOW(), (SELECT declarator_gameid FROM accounts WHERE account_id = ?));"
        db.query(sqlQuery2, [accountId, username, accountId], (err, result2) => {
          if (err) {
            logger.error(`${req.originalUrl} request has an error during process 2, accountId:${accountId}, error:${err}`);
            res.status(500).json({ message: "Server error" });
          } else {
            logger.info(`${req.originalUrl} successful. Started new shift for declaratorId: ${accountId}, username: ${username}`);
            res.status(200).json({message: "Successfully started new shift", data:{accountId: accountId}})
          }
        })
      }
      else if (result1[0].time_out === null){
        logger.warn(`${req.originalUrl}  request warning, declarator still has an active shift, declarator:${accountId}`);
        res.status(409).json({ message: "Declarator still has an active shift", data: {accountId: accountId} });
      }
      else {       
        //Process 2 - Insert new shift
        sqlQuery2 = "INSERT INTO shifts (account_id, username, time_in, lastedit_date, game_id) VALUES (?, ?, NOW(), NOW(), (SELECT declarator_gameid FROM accounts WHERE account_id = ?));"
        db.query(sqlQuery2, [accountId, username, accountId], (err, result2) => {
          if (err) {
            logger.error(`${req.originalUrl} request has an error during process 2, accountId:${accountId}, error:${err}`);
            res.status(500).json({ message: "Server error" });
          } else {
            logger.info(`${req.originalUrl} successful. Started new shift for declaratorId: ${accountId}, username: ${username}`);
            res.status(200).json({message: "Successfully started new shift", data:{accountId: accountId}})
          }
        })
      }
    });
})

// End Shift
app.post("/endShift", (req, res) => {
  const start = process.hrtime();
  // Get body
  const apiKey = req.header("Authorization");
  const accountId = req.body.accountId;
  const username = req.body.username;

    // Check if body is complete
    if (!accountId || !username) {
      logger.warn(`${req.originalUrl} request has missing body parameters, accountId:${accountId}`);
      res.status(400).json({ message: "Missing body parameters" });
      return;
    }
  
    // Check if apiKey is correct
    if (!apiKey || apiKey !== process.env.API_KEY) {
      logger.warn(`${req.originalUrl} request has missing/wrong apiKey, received:${apiKey}`);
      res.status(401).json({ message: "Unauthorized Request" });
      return;
    }

    // Process 1 - Check if account still has an active shift
    sqlQuery1 = "SELECT id, time_in, time_out, game_id FROM shifts WHERE account_id = ? ORDER BY time_in DESC LIMIT 1;"
    db.query(sqlQuery1, [accountId], (err, result1) => {
      if (err) {
        logger.error(`${req.originalUrl} request has an error during process 1, accountId:${accountId}, error:${err}`);
        res.status(500).json({ message: "Server error" });
      } else if (result1.length <= 0 || result1[0].time_out !== null){
        logger.warn(`${req.originalUrl}  request warning, declarator does not have an active shift, declarator:${accountId}`);
        res.status(409).json({ message: "Declarator does not have an active shift", data: {accountId: accountId} });
      } else {

        var idUpdate = result1[0].id;
        var decGameId = result1[0].game_id
        var timeIn = result1[0].time_in
        
        // Process 2
        sqlQuery2 = "SELECT SUM(stake) as totalBets, SUM(winnings) as totalWinnings FROM bets WHERE game_id = ? AND placement_date BETWEEN ? AND NOW();"
        db.query(sqlQuery2, [decGameId, timeIn], (err, result2) => {
          if (err) {
            logger.error(`${req.originalUrl} request has an error during process 2, accountId:${accountId}, error:${err}`);
            res.status(500).json({ message: "Server error" });
          } else {
            var totalBets = result2[0].totalBets === null ? 0 : parseFloat(result2[0].totalBets).toFixed(2);
            var totalWinnings = result2[0].totalWinnings === null ? 0 : parseFloat(result2[0].totalWinnings).toFixed(2);
            var totalEarnings = (parseFloat(totalBets) - parseFloat(totalWinnings)).toFixed(2)

            //Process 3 - Insert new shift
            sqlQuery3 = "UPDATE shifts SET time_out = NOW(), total_bets_placed = ?, total_loss = ?, total_earnings = ?, lastedit_date = NOW() WHERE id = ? "
            db.query(sqlQuery3, [totalBets, totalWinnings, totalEarnings, idUpdate], (err, result3) => {
              if (err) {
                logger.error(`${req.originalUrl} request has an error during process 3, accountId:${accountId}, error:${err}`);
                res.status(500).json({ message: "Server error" });
              } else {
                logger.info(`${req.originalUrl} successful. Ended shift for declaratorId: ${accountId}, username: ${username}`);
                res.status(200).json({message: "Successfully ended shift", data:{accountId: accountId, id: idUpdate, game_id: decGameId}})
              }
            })
          }
        })
      }
    });
})


app.get("/getShifts", (req, res) => {
  const start = process.hrtime();
  // Get body
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
  // Get all necessary details
  sqlQuery = "SELECT sh.*, ga.name FROM shifts sh LEFT JOIN games ga ON sh.game_id=ga.game_id ORDER BY sh.lastedit_date DESC ;";
  db.query(sqlQuery,  (err, result) => {
    if (err) {
      logger.error(`${req.originalUrl} request has an error during process 1, error:${err}`);
      res.status(500).json({ message: "Server error" });
    } else {
      logger.info(`${req.originalUrl} request successful duration:${getDurationInMilliseconds(start)}`);
      res.status(200).json({ message: "Request successful", data: result});
    }
  });
})

app.listen(4003, () => {
  console.log("Server listentning at port 4003");
});
