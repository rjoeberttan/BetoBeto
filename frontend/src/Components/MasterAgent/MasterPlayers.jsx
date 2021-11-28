import { React, useContext, useEffect, useState } from "react";
import UserCard from "../Usercard/UserCard";
import { AuthContext } from "../../store/auth-context";
import axios from "axios";

import "./MasterPlayers.css";

function MasterPlayers() {
  const ctx = useContext(AuthContext);
  const accountHeader = process.env.REACT_APP_HEADER_ACCOUNT;
  const accAuthorization = {
    "Authorization": process.env.REACT_APP_KEY_ACCOUNT,
  };

  const [players, setPlayers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [filteredPlayers, setFilteredPlayers] = useState([]);

  useEffect(() => {
    getUserList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getUserList() {
    axios({
      method: "get",
      url: `${accountHeader}/getAccountList/${ctx.user.accountID}/1`,
      headers: accAuthorization,
    })
      .then((res) => {
        const data = res.data.data;
        const Players = data.filter((x) => x.account_type === 3);
        console.log(Players);
        setPlayers(Players);
        setFilteredPlayers(Players)
      })
      .catch((err) => {
        console.log(err);
      });
  }
  function handleChange(e){
    const searchVal = e.target.value
    setUserSearch(searchVal)

    let filtered = []
   
    players.map((x) => {
      let username = x.username
      if (username.includes(searchVal)){
        filtered.push(x)
      }
    })
    setFilteredPlayers(filtered)
  }


  return (
    <div className="container text-light container-wallet">
      <div className="heading-text">
        <h1 className="display-5 small-device bold-small">Manage Players</h1>
      </div>
      <div className="row">
        <div className="col-sm-2">
          <label className="label-txt">Search Player</label>
        </div>
        <div className="col-sm-6">
          <div class="input-group w-50">
            <span class="input-group-text" id="basic-addon1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-search" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"></path>
              </svg>
            </span>
            <input type="text" className="form-control" placeholder="Username" value = {userSearch} onChange={handleChange} />
          </div>         
        </div>
      </div>
      <div className="row text-black second-box">
        {filteredPlayers.map((x) => (
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
        ))}
      </div>
    </div>
  );
}

export default MasterPlayers;
