import io from "socket.io-client";

const socket = io.connect("http://174.138.30.63:3010/");


export default socket;