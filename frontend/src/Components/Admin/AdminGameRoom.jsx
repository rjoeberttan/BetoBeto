import React, { useEffect, useState } from "react";
import AdminGameRoomList from "./AdminGameRoomList";
import colorGameLogo from "./colorgame.png"
import pulaPutiLogo from "./pulaputi.png"
import hiloLogo from "./hilo.png"
import "./AdminGameRoom.css";
const axios = require("axios").default;

function AdminGameRoom() {
  const [gameList, setGameList] = useState([]);

  useEffect(() => {
    axios({
      method: "get",
      url: `${process.env.REACT_APP_HEADER_GAME}/getGamesList`,
      headers: {
        "Authorization": process.env.REACT_APP_KEY_GAME,
      },
    }).then((res) => {
      setGameList(res.data.data);
    });
  }, []);

  // const sampleImgUrl =
  //   "https://psycatgames.com/magazine/party-games/three-man-dice/feature-image_hu9ed284971d2ae71dd1c66e655aa65d6d_1287743_1200x1200_fill_q100_box_smart1.jpg";
  return (
    <div className="container text-light container-game-room">
      <div className="heading-text">
        <h1 className="display-5 small-device bold-small">Game Room</h1>
      </div>
      <div className="row">
        {gameList.map((game) => (
          <AdminGameRoomList
            key={game.game_id}
            sampleImgUrl={ game.type === 0 ? colorGameLogo : (game.type === 1 ? pulaPutiLogo : hiloLogo ) }
            name={game.name}
            min_bet={game.min_bet}
            max_bet={game.max_bet}
            game_id={game.game_id}
            game_type={game.type}
          />
        ))}
      </div>
    </div>
  );
}

export default AdminGameRoom;
