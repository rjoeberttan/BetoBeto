import React from "react";
import { Link } from "react-router-dom";

export default function PlayerGameRoomList(props) {
  return (
    <div className="col-md-3 txt-black">
      <div className="card game-card">
        <img className="game-img" src={props.sampleImgUrl} alt="." />
        <div className="card-body">
          <h5 className="card-title text-center">{props.name}</h5>
          <p className="card-text text-center">
            Min/Max Bet: P {props.min_bet} - P {props.max_bet}
          </p>
          <div className="text-center">
            <Link
              to={props.game_type === 0 ? `/player/gameroom/settings/${props.game_id}` : `/player/gameroom/TotalisatorSettings/${props.game_id}`}
              className="btn btn-color register-btn text-light"
            >
              Enter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
