import React from "react";

function AdminAgentCard({
  masterAgentNo,
  agentNo,
  noOfPlayers,
  mobile,
  status,
  lastPwChange,
  walletBalance,
}) {
  return (
    <div className="col-sm-4 wallet-card">
      <div className="card">
        <div className="card-body">
          <h3>{agentNo}</h3>
          <div className="row">
            <div className="row text-spacing">
              <div className="col-md-12">
                <b>Master Agent:</b> {masterAgentNo}
              </div>
              <div className="col-md-5">
                <b>No. of Players:</b> {noOfPlayers}
              </div>
              <div className="col-md-7">
                <b>Mobile No:</b> {mobile}
              </div>
            </div>
            <div className="col-md-7 text-spacing">
              <b>Status:</b> {status}
            </div>
            <div className="col-md-12 text-spacing">
              <b>Last password change:</b> {lastPwChange}
            </div>
            <div className="col-md-12 text-spacing">
              <div className="row">
                <div className="col-md-4 col-4">
                  <b>Commission %</b>
                </div>
                <div className="col-md-4 col-4">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="1.5"
                  />
                </div>
                <div className="col-md-4 col-4">
                  <button className="btn btn-color text-light">Save</button>
                </div>
              </div>
            </div>
            <div className="col-md-12 text-spacing">
              <div className="row">
                <div className="col-md-4">
                  <b>Wallet:</b> {walletBalance}
                </div>
                <div className="col-md-4 col-6">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Top Up"
                  />
                </div>
                <div className="col-md-4 col-6">
                  <button className="btn btn-color text-light">Top Up</button>
                </div>
              </div>
            </div>
            <div className="col-md-7">
              <b>Action:</b>
            </div>
            <div className="col-md-12 text-spacing">
              <div className="row">
                <div className="col-md-4 col-4">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Change PW"
                  />
                </div>
                <div className="col-md-4 col-4">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Confirm PW"
                  />
                </div>
                <div className="col-md-4 col-4">
                  <button className="btn btn-color text-light">Save PW</button>
                </div>
              </div>
            </div>
            <div className="col-md-12 text-center">
              <button className="btn btn-color register-btn text-light">
                Lock Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAgentCard;
