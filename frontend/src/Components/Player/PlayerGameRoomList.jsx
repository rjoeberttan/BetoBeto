import React from "react";
import { Link } from "react-router-dom";


export default function PlayerGameRoomList(props){
    return (
        <div class="col-md-3 txt-black">
          <div class="card game-card">
            <img class="game-img" src={props.sampleImgUrl} alt="." />
            <div class="card-body">
              <h5 class="card-title text-center">{props.name}</h5>
              <p class="card-text text-center">
                Min/Max Bet: P {props.min_bet} - P {props.max_bet}
              </p>
              <div className="text-center">
                <Link
                  to={`/player/GameRoom/live/${props.game_id}`}
                  className="btn btn-color register-btn text-light"
                >
                  Enter
                </Link>
              </div>
            </div>
          </div>
        </div>
    )
}