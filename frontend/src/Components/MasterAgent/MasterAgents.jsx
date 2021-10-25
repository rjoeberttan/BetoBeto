import React from "react";
import MasterAgentCard from "./MasterAgentCard";

function MasterAgents() {
  return (
    <div className="container text-light container-wallet">
      <div className="heading-text">
        <h1 className="display-5 small-device bold-small">Manage Agents</h1>
      </div>
      <div className="row">
        <div className="col-sm-1">
          <label className="label-txt">Filter Agent</label>
        </div>
        <div className="col-sm-2 col-10">
          <input type="text" className="form-control" placeholder="Agent" />
        </div>
        <div className="col-md-2">
          <button className="btn btn-color transaction-btn text-light col-xs-12">
            Search
          </button>
        </div>
      </div>
      <div className="row text-black second-box">
        <MasterAgentCard
          agentNo="Agent_01"
          noOfPlayers="10"
          mobile="09152723321"
          status="ACTIVE"
          lastPwChange="09/26/2019"
          walletBalance="P500"
        />
        <MasterAgentCard
          agentNo="Agent_02"
          noOfPlayers="10"
          mobile="09152723321"
          status="ACTIVE"
          lastPwChange="09/26/2019"
          walletBalance="P500"
        />
        <MasterAgentCard
          agentNo="Agent_03"
          noOfPlayers="10"
          mobile="09152723321"
          status="ACTIVE"
          lastPwChange="09/26/2019"
          walletBalance="P500"
        />
      </div>
    </div>
  );
}

export default MasterAgents;
