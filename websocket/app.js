const express = require('express');
const http = require("http");
const https = require("https");
const cors  = require("cors");
const {Server} = require("socket.io");
const fs = require('fs')
require("dotenv").config();
const app = express();
app.use(cors());

const options = {
    key: fs.readFileSync('/certs/key.pem'),
    cert: fs.readFileSync('/certs/cert.pem')
}
// const httpServer = http.createServer(app);
const httpsServer = https.createServer(options, app);

const io = new Server(httpsServer, {
    cors: {
        origin: '*',
    },
});

io.on("connection", (socket) => {
    // Socket IO Method when a market update on color game is received
    console.log("Socket connection triggered")
    socket.on("color_game_market_update", (data) => {
        console.log(data)

        const status = data.status;
        const marketId = data.marketId;
        // const gameId = data.gameId
        // const date = data.date
        
        if (status === 0) {
            console.log(`Market has been Created/Opened with marketId:${marketId}`)
        } else if (status === 1) {
            console.log(`Market has been Closed with marketId:${marketId} `)
        } else if (status === 2) {
            console.log(`Market has been Resulted with marketId:${marketId} `)
        }
        socket.to("colorGame").emit("received_market_update", data)
    })

    // Socket IO Method when a market update on color game is received
    socket.on("bet_placement", (data) => {
        console.log(`Received bet placement from ${data.accountId}`)
    })

    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id)
    })


    socket.on("join_room", (room) => {
        socket.join(room);
        console.log(`user ${socket.id} joined ${room}`)
    })
})


app.get("/", (req, res) => {
    res.send("hello")
})


httpsServer.listen(3010, () => {
    console.log("Server running at port 3010")
})