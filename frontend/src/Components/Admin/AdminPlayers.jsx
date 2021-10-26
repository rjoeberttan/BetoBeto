import React from "react";
import AdminPlayerCard from "./AdminPlayerCard";
import "./AdminPlayers.css";

function AdminPlayers() {
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
        <AdminPlayerCard
          playerNo="Player_01"
          agentNo="Agent_01"
          mobile="09152723321"
          status="ACTIVE"
          lastPwChange="09/26/2019"
          walletBalance="P500"
        />
        <AdminPlayerCard
          playerNo="Player_02"
          agentNo="Agent_02"
          mobile="09152723321"
          status="ACTIVE"
          lastPwChange="09/26/2019"
          walletBalance="P500"
        />
        <AdminPlayerCard
          playerNo="Player_03"
          agentNo="Agent_03"
          mobile="09152723321"
          status="ACTIVE"
          lastPwChange="09/26/2019"
          walletBalance="P500"
        />
        <AdminPlayerCard
          playerNo="Player_01"
          agentNo="Agent_01"
          mobile="09152723321"
          status="ACTIVE"
          lastPwChange="09/26/2019"
          walletBalance="P500"
        />
        <AdminPlayerCard
          playerNo="Player_01"
          agentNo="Agent_01"
          mobile="09152723321"
          status="ACTIVE"
          lastPwChange="09/26/2019"
          walletBalance="P500"
        />
        <AdminPlayerCard
          playerNo="Player_01"
          agentNo="Agent_01"
          mobile="09152723321"
          status="ACTIVE"
          lastPwChange="09/26/2019"
          walletBalance="P500"
        />
      </div>
    </div>
  );
}

export default AdminPlayers;
