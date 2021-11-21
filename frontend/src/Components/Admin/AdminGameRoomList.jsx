import React from "react";
import { Link } from "react-router-dom";
import env from "react-dotenv";

export default function AdminGameRoomList(props){
    return (<div class="col-md-3 txt-black">
    <div class="card game-card">
      <img class="game-img" src={props.sampleImgUrl} alt="." />
      <div class="card-body">
        <h5 class="card-title text-center">{props.name}</h5>
        <p class="card-text text-center">
          Min/Max Bet: P {props.min_bet} - P {props.max_bet}
        </p>
        <div className="text-center">
          <Link
            // to={{
            //     pathname: "/admin/gameroom/settings",
            //     state: { gameid: props.gameid }
            // }}
            to={`/admin/gameroom/settings/${props.game_id}`}
            className="btn btn-color register-btn text-light"
          >
            Enter
          </Link>
        </div>
      </div>
      {/* {props.game_id} to pass */}
    </div>
  </div>)
}
