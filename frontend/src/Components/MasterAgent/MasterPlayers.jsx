import {React, useContext, useEffect, useState} from "react";
import UserCard from "../Usercard/UserCard";
import EmptyUsersUnder from "../EmptyUsersUnder";
import { AuthContext } from "../../store/auth-context";
import axios from "axios";

import "./MasterPlayers.css";

function MasterPlayers() {
  const ctx = useContext(AuthContext);
  const accountHeader = process.env.REACT_APP_HEADER_ACCOUNT;
  const accAuthorization = {"Authorization": process.env.REACT_APP_KEY_ACCOUNT}  
  
  function renderEmpty(){
    return (<div>Earl Empty</div>);
  }
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    getUserList();
  }, []);
  function renderEmpty(){
    return (<div>Earl Empty</div>);
  }
  function getUserList() {
    axios({
      method: "get",
      url: `${accountHeader}/getAccountList/${ctx.user.accountID}/1`,
      headers: accAuthorization
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
        <div className="col-sm-2 col-12">
          <input type="text" className="form-control" placeholder="Username" />
        </div>
        <div className="col-sm-1">
          <label className="label-txt">Filter Agent</label>
        </div>
        <div className="col-sm-2 col-12">
          <input type="text" className="form-control" placeholder="Agent" />
        </div>
        <div className="col-sm-1 text-center">
          <button className="btn btn-color transaction-btn btnbtn spacing-btn-m text-light">
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

export default MasterPlayers;
