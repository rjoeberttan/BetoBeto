import socketIOClient from "socket.io-client";

const socket = socketIOClient({path: process.env.REACT_APP_HEADER_WEBSOCKET});


export default socket;