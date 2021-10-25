import React from "react";
import "./PlayerGameRoom.css";
import { Link } from "react-router-dom";

function GameRoom() {
  const sampleImgUrl =
    "https://psycatgames.com/magazine/party-games/three-man-dice/feature-image_hu9ed284971d2ae71dd1c66e655aa65d6d_1287743_1200x1200_fill_q100_box_smart1.jpg";
  return (
    <div className="container text-light container-game-room">
      <div className="heading-text">
        <h1 className="display-5 small-device bold-small">Game Room</h1>
      </div>
      <div class="row">
        <div class="col-md-3 txt-black">
          <div class="card game-card">
            <img class="game-img" src={sampleImgUrl} alt="." />
            <div class="card-body">
              <h5 class="card-title text-center">Dice Game</h5>
              <p class="card-text text-center">
                Min/Max Bet: P 10 - P 5,000.00
              </p>
              <div className="text-center">
                <Link
                  to="/player/GameRoom/live"
                  className="btn btn-color register-btn text-light"
                >
                  Enter
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameRoom;
