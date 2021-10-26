import React from "react";
import AdminMasterCard from "./AdminMasterCard";
import "./AdminPlayers.css";

function AdminMasterAgents() {
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
        <AdminMasterCard
          masterAgentNo="MasterAgent_01"
          noOfAgents="10"
          mobile="09152723321"
          noOfPlayers="500"
          status="ACTIVE"
          lastPwChange="09/26/2019"
          walletBalance="P500"
        />
        <AdminMasterCard
          masterAgentNo="MasterAgent_02"
          noOfAgents="10"
          mobile="09152723321"
          noOfPlayers="500"
          status="ACTIVE"
          lastPwChange="09/26/2019"
          walletBalance="P500"
        />
        <AdminMasterCard
          masterAgentNo="MasterAgent_03"
          noOfAgents="10"
          mobile="09152723321"
          noOfPlayers="500"
          status="ACTIVE"
          lastPwChange="09/26/2019"
          walletBalance="P500"
        />
      </div>
    </div>
  );
}

export default AdminMasterAgents;
