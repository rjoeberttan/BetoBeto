import React from "react";
import AdminAgentCard from "./AdminAgentCard";

function AdminAgents() {
  return (
    <div className="container text-light container-wallet">
      <div className="heading-text">
        <h1 className="display-5 small-device bold-small">Manage Agents</h1>
      </div>
      <div className="row">
        <div className="col-sm-1">
          <label className="label-txt">Filter Agent</label>
        </div>
        <div className="col-sm-2 col-12">
          <input type="text" className="form-control" placeholder="Agent" />
        </div>
        <div className="col-sm-2">
          <label className="label-txt">Filter By Master Agent</label>
        </div>
        <div className="col-sm-2 col-12">
          <input
            type="text"
            className="form-control"
            placeholder="Master Agent"
          />
        </div>
        <div className="col-sm-1 text-center">
          <button className="btn btn-color transaction-btn btnbtn spacing-btn-m text-light">
            Search
          </button>
        </div>
      </div>
      <div className="row text-black second-box">
        <AdminAgentCard
          masterAgentNo="MasterAgent_01"
          agentNo="Agent_01"
          noOfPlayers="10"
          mobile="09152723321"
          status="ACTIVE"
          lastPwChange="09/26/2019"
          walletBalance="P500"
        />
        <AdminAgentCard
          masterAgentNo="MasterAgent_01"
          agentNo="Agent_02"
          noOfPlayers="10"
          mobile="09152723321"
          status="ACTIVE"
          lastPwChange="09/26/2019"
          walletBalance="P500"
        />
        <AdminAgentCard
          masterAgentNo="MasterAgent_01"
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

export default AdminAgents;
