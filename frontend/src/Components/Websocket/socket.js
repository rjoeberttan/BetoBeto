import io from "socket.io-client";

const socket = io.connect(process.env.REACT_APP_HEADER_WEBSOCKET);


export default socket;