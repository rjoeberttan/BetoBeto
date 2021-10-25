import React from "react";
import "./PlayerWallet.css";

function Wallet() {
  return (
    <div className="container text-light container-wallet">
      <div className="heading-text">
        <h1 className="display-5 small-device bold-small">My Wallet</h1>
      </div>
      <form>
        <div className="row txt-black">
          <div className="col-sm-4 wallet-card">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Wallet balance</h5>
                <div className="card-text wallet-balance">P 2,000.00</div>
              </div>
            </div>
          </div>
          <div className="col-sm-4 wallet-card">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Deposit Request</h5>
                <div className="row wallet-box">
                  <div className="col-md-3">
                    <label className="col-form-label wallet-label">
                      Amount
                    </label>
                  </div>
                  <div className="col-md-9">
                    <input
                      type="number"
                      className="form-control"
                      onWheel={(e) => e.target.blur()}
                      placeholder="P500"
                    />
                  </div>
                </div>
                <div className="col-md-12 text-center">
                  <button className="btn btn-color register-btn text-light">
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-4 wallet-card">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Withdrawal Request</h5>
                <div className="row wallet-box">
                  <div className="col-md-3">
                    <label className="col-form-label wallet-label">
                      Amount
                    </label>
                  </div>
                  <div className="col-md-9">
                    <input
                      type="number"
                      className="form-control"
                      onWheel={(e) => e.target.blur()}
                      placeholder="P500"
                    />
                  </div>
                </div>
                <div className="col-md-12 text-center">
                  <button className="btn btn-color register-btn text-light">
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Wallet;
