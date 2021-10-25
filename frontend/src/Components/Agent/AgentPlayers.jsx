import React from "react";
import AgentPlayerCard from "./AgentPlayerCard";
import "./AgentPlayers.css";

function AgentPlayers() {
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
        <AgentPlayerCard
          playerNo="Player_01"
          agentNo="Agent_01"
          mobile="09152723321"
          status="ACTIVE"
          lastPwChange="09/26/2019"
          walletBalance="P500"
        />
        <AgentPlayerCard
          playerNo="Player_02"
          agentNo="Agent_02"
          mobile="09152723321"
          status="ACTIVE"
          lastPwChange="09/26/2019"
          walletBalance="P500"
        />
        <AgentPlayerCard
          playerNo="Player_03"
          agentNo="Agent_03"
          mobile="09152723321"
          status="ACTIVE"
          lastPwChange="09/26/2019"
          walletBalance="P500"
        />
      </div>
    </div>
  );
}

export default AgentPlayers;
