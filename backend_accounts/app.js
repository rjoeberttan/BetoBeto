//jshint esverion:6
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const cookieParser = require("cooke-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require('dotenv').config()

