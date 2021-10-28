const express = require('express');
const http = require("http");
const cors  = require("cors");
const {Server} = require("socket.io");
const app = express();
app.use(cors());



const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    },
});

io.on("connection", (socket) => {
    console.log(socket.id );

    // Socket IO Method when a market update on color game is received
    socket.on("color_game_market_update", (data) => {

        const status = data.status;
        const marketId = data.marketID;
        const gameId = data.gameId
        const date = data.date
        
        if (status === 0) {
            console.log(`Market has been Created/Opened with marketId:${marketId} gameId:${gameId} at ${date}`)
        } else if (status === 1) {
            console.log(`Market has been Closed with marketId:${marketId} gameId:${gameId} at ${date}`)
        } else if (status === 2) {
            console.log(`Market has been Resulted with marketId:${marketId} gameId:${gameId} at ${date} with result ${data.result}`)
        }
        socket.emit("received_create_market", data)
    })

    // Socket IO Method when a market update on color game is received
    socket.on("bet_placement", (data) => {
        console.log(`Received bet placement from ${data.accountId}`)
    })

    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id)
    })
})

server.listen(3010, () => {
    console.log("Server running")
})