import io from "socket.io-client";

const socket = io.connect("http://localhost:3010/");


export default socket;