import {React, useContext} from "react";
import { AuthContext } from "../../store/auth-context";
import { Link } from "react-router-dom";


export default function AdminGameRoomList(props) {

  const ctx = useContext(AuthContext);

  return (
    <div className="col-md-3 txt-black mb-4" >
      <div className="card game-card">
        <img className="game-img" src={props.sampleImgUrl} alt="." />
        <div className="card-body">
          <h5 className="card-title text-center">{props.name}</h5>
          <p className="card-text text-center">
            Min/Max Bet: P {props.min_bet} - P {props.max_bet}
          </p>
          <div className="text-center">
            <Link
              to={props.game_type === 0 ? `/${ctx.user.accountType}/gameroom/settings/${props.game_id}` : 
              props.game_type === 3 ? `/${ctx.user.accountType}/gameroom/SaklaSettings/${props.game_id}` : `/${ctx.user.accountType}/gameroom/TotalisatorSettings/${props.game_id}`}
              className="btn btn-color register-btn text-light"
            >
              Enter
            </Link>
          </div>
        </div>
        {/* {props.game_id} to pass */}
      </div>
    </div>
  );
}
