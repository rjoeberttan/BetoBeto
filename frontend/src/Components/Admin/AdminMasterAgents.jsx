import React, { useContext, useEffect, useState } from "react";
import UserCard from "../Usercard/UserCard";
import { AuthContext } from "../../store/auth-context";
import axios from "axios";
import "./AdminPlayers.css";

function AdminMasterAgents() {
  const ctx = useContext(AuthContext);
  const accountHeader = process.env.REACT_APP_HEADER_ACCOUNT;
  const [masterAgents, setMasterAgents] = useState([]);

  useEffect(() => {
    getUserList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getUserList() {
    axios({
      method: "get",
      url: `${accountHeader}/getAccountList/${ctx.user.accountID}/0`,
      headers: {
        "Authorization": process.env.REACT_APP_KEY_ACCOUNT,
      },
    })
      .then((res) => {
        const data = res.data.data;
        const masterAgentss = data.filter((x) => x.account_type === 1);
        setMasterAgents(masterAgentss);
      })
      .catch((err) => {});
  }
  return (
    <div className="container text-light container-wallet">
      <div className="heading-text">
        <h1 className="display-5 small-device bold-small">
          Manage Master Agents
        </h1>
      </div>
      <div className="row">
        <div className="col-sm-2">
          <label className="label-txt">Filter by Master Players</label>
        </div>
        <div className="col-sm-2 col-10">
          <input
            type="text"
            className="form-control"
            placeholder="MasterAgent"
          />
        </div>
        <div className="col-md-2">
          <button className="btn btn-color transaction-btn text-light col-xs-12">
            Search
          </button>
        </div>
      </div>
      <div className="row text-black second-box">
        {masterAgents.map((x) => (
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
            accountType="1"
          />
        ))}
      </div>
    </div>
  );
}

export default AdminMasterAgents;
