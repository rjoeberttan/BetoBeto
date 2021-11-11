import {React, useContext, useEffect, useState} from "react";
import UserCard from "../Usercard/UserCard";
import { AuthContext } from "../../store/auth-context";
import axios from "axios";
import "./AgentPlayers.css";

function AgentPlayers() {
  const ctx = useContext(AuthContext);
  const accountHeader = "http://localhost:4003";
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    getUserList();
  }, []);

  function getUserList() {
    axios({
      method: "get",
      url: `${accountHeader}/getAccountList/${ctx.user.accountID}/2`,
      headers: {
        "Authorization": "uKRd;$SuXd8b$MFX",
      },
    })
      .then((res) => {
        const data = res.data.data;
        const Players = data.filter((x) => x.account_type === 3);
        console.log(Players)
        setPlayers(Players);
      })
      .catch((err) => {
        console.log(err);
      });
  }




  return (
    <div className="container text-light container-wallet">
      <div className="heading-text">
        <h1 className="display-5 small-device bold-small">Manage Players</h1>
      </div>
      <div className="row">
        <div className="col-sm-1">
          <label className="label-txt">Filter Player</label>
        </div>
        <div className="col-sm-2 col-10">
          <input type="text" className="form-control" placeholder="Username" />
        </div>
        <div className="col-md-2">
          <button className="btn btn-color transaction-btn text-light col-xs-12">
            Search
          </button>
        </div>
      </div>
      <div className="row text-black second-box">
        {players.map((x) => (
                <UserCard 
                    key={x.account_id}
                    accountId={x.account_id}
                    username={x.username}
                    noOfAgents="TBS"
                    mobile={x.phone_num}
                    noOfPlayers="TBS"
                    commission={x.commission}
                    status={x.account_status === 1 ? "ACTIVE" : "LOCKED"}
                    lastEditChange={x.lastedit_date.substring(0, 10)}
                    walletBalance={x.wallet}
                    editor={ctx.user.username}
                    editorId={ctx.user.accountID}
                    accountType="3"
                  />
              ))
        }
      </div>
    </div>
  );
}

export default AgentPlayers;
