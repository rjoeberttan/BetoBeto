import {React, useState, useEffect} from "react";
import "./PlayerGameRoom.css";
import { Link } from "react-router-dom";
import PlayerGameRoomList from "./PlayerGameRoomList";
const axios  = require("axios");

function GameRoom() {

  const [gameList, setGameList] = useState([]);
  const gameHeader = process.env.REACT_APP_HEADER_GAME;
  const gameAuthorization = {"Authorization": process.env.REACT_APP_KEY_GAME}

  useEffect(() => {
    axios({
      method: "get",
      url: `${gameHeader}/getGamesList`,
      headers: gameAuthorization
    }).then((res) => {
      console.log(res)
      setGameList(res.data.data);
    })
  }, [])



  const sampleImgUrl =
    "https://psycatgames.com/magazine/party-games/three-man-dice/feature-image_hu9ed284971d2ae71dd1c66e655aa65d6d_1287743_1200x1200_fill_q100_box_smart1.jpg";
  return (
    <div className="container text-light container-game-room">
      <div className="heading-text">
        <h1 className="display-5 small-device bold-small">Game Room</h1>
      </div>
      <div class="row">
        {gameList.map(game => <PlayerGameRoomList sampleImgUrl={sampleImgUrl} name={game.name} min_bet={game.min_bet} max_bet={game.max_bet} game_id={game.game_id}/>)}
      </div>
    </div>
  );
}

export default GameRoom;
