import React, { useEffect, useState } from "react";
import AdminGameRoomList from "./AdminGameRoomList";
import "./AdminGameRoom.css";
import env from "react-dotenv";
const axios = require("axios").default;

function AdminGameRoom() {
  const [gameList, setGameList] = useState([]);

  useEffect(() => {
    axios({
      method: "get",
      url: `${process.env.REACT_APP_HEADER_GAME}/getGamesList`,
      headers: {
        "Authorization": process.env.REACT_APP_KEY_GAME
      }
    }).then((res) => {
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
        {gameList.map(game => <AdminGameRoomList sampleImgUrl={sampleImgUrl} name={game.name} min_bet={game.min_bet} max_bet={game.max_bet} game_id={game.game_id}/>)}
      </div>
    </div>
  );
}

export default AdminGameRoom;
