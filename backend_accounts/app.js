//jshint esverion:6
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { application } = require("express");
const e = require("express");
require("dotenv").config();

// Configure bcrypt
const saltRounds = parseInt(process.env.SALT_ROUNDS);

// Configure express application
const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true, //["http://localhost:3000"]
  })
);

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Configure Express Session
app.use(
  session({
    key: "userId",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    coookie: {
      expires: 60 * 60 * 24, // 1:1s
    },
  })
);

// Configure Database Connection
const db = mysql.createConnection({
  user: process.env.MYSQL_USERNAME,
  host: process.env.MYSQL_HOST,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

app.get("/register", (req, res) => {
  res.send("OK")
})

// REGISTER
app.post("/register", (req, res) => {
  // We should expect the following from the frontend
  // email, username, password, referral_code.
  // Referral code will just be the account_id of the referrer in the database
  const username = req.body.username;
  const email = req.body.email;
  const phone = req.body.phone;
  const password = req.body.password;
  const referralID = req.body.referralID

  console.log("Initiated Register for username: "+ username);
  
  // Check if ReferralID is Valid: Proc code: 01
  var sqlQuery = "SELECT ACCOUNT_TYPE from accounts where ID = ?"

  db.query(sqlQuery, [referralID], (err, result) => {
    if (err){
      console.log("Error during User_Register proc_id:01 username:" + username + '. ' + err)
      res.status(400).send("Error during Register. Please raise to support")    
    } 
    else if (result.length <= 0){
      console.log("Error during User_Register proc_id:01 username:" + username + '. ' + "Referral ID not found")
      res.status(400).send("Error during Register. Please recheck referral ID")
    } 
    else {
      // IF REFERRER ACCOUNT IS OKAY, WE WILL CREATE THE NEW ACCOUNT_TYPE FOR THE NEW USER
      // IF CURRENT REFERRER IS PLAYER, WE WILL NOT ALLOW
      referrer_code = result[0].ACCOUNT_TYPE;

      if (referrer_code === 3){
        console.log("Error during User_Register proc_id:01 username:" + username + '. ' + "Please get registration link from authorized agents")
        res.status(400).send("Error during Register. Please get registration link from authorized agents")          
      } 
      else {
        new_user_account_type = referrer_code + 1;

        // Check if Username or email is already used. Proc code: 02
        var sqlQuery = "SELECT * FROM accounts WHERE username = ? OR email = ?"
        db.query(sqlQuery, [username, email], function(err, result) {
        if (err){
          console.log("Error during User_Register proc_id:02 username:" + username + '. ' + err)
          res.status(400).send("Error during Register. Please raise to supprort")   
        } 
        else if (result.length > 0){
          console.log("Error during User_Register proc_id:02 username:" + username + '. ' + "Username or Email is already used") 
          res.status(400).send("Error during Register. Username or Email is already used")
                
        } 
        else {

          // IF USERNAME OR EMAIL IS NOT USED INSERT TO DATABASE.
          // Hash Password and add to database if successful. Proc code: 03
          bcrypt.hash(password, saltRounds, (err, hash)=>{
            if (err){
              console.log("Error during User_Register proc_id:03 username:" + username + '. ' + err)
              res.status(400).send("Error during Register. Please raise to supprort")
            } else{
              sqlQuery = "INSERT INTO accounts (USERNAME,EMAIL,PHONE,PASSWORD,ACCOUNT_TYPE,REFERRER_ID,WRITER) VALUES (?,?,?,?,?,?,CURRENT_USER)"
              db.query(sqlQuery, [username, email, phone, hash, new_user_account_type,referralID], (err, result) => {
                if (err) {
                  console.log("Error during User_Register proc_id:02 username:" + username + '. ' + err)
                  res.status(400).send("Error during Register. Please raise to supprort") 
        
                } else {
                  console.log("Successful User_Register username:" + username)
                  res.status(200).send(username + " Registered Successfully ")
                }
              })
            }
          })
        }
    })
      }
    }
  })

  


 
    

});

app.listen(4003, () => {
  console.log("Server listening at port 4003");
});
