import React from "react";
import "./MasterWallet.css";
import WithdrawalReq from "../WithdrawalReq";
import DepositRequest from "../DepositRequest";

function MasterWallet() {
  return (
    <div className="container text-light container-wallet">
      <div className="heading-text">
        <h1 className="display-5 small-device bold-small">Wallet</h1>
      </div>
      <form>
        <div className="row txt-black">
          {/* card one */}
          <div className="col-sm-3 wallet-card">
            <div className="card">
              <div className="card-body">
                <div className="wallet-spacing">
                  <h5 className="card-title">Wallet balance</h5>
                  <div className="card-text">P 2,000.00</div>
                </div>
                <div className="wallet-spacing">
                  <h5 className="card-title">Commissions</h5>
                  <div className="card-text">P 2,000.00</div>
                </div>
                <hr />
                <h4>No. of Agents 10</h4>
                <h4>No. of Players 50</h4>
              </div>
            </div>
          </div>

          {/* card two */}
          <div className="col-sm-3 wallet-card">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Transfer Funds</h5>
                <div className="wallet-box master-wallet">
                  <div class="form-check form-check-inline">
                    <input
                      class="form-check-input"
                      type="radio"
                      name="inlineRadioOptions"
                      value="option1"
                    />
                    <label class="form-check-label">All</label>
                  </div>
                  <div class="form-check form-check-inline">
                    <input
                      class="form-check-input"
                      type="radio"
                      name="inlineRadioOptions"
                      value="option2"
                    />
                    <label class="form-check-label">Agents</label>
                  </div>
                  <div class="form-check form-check-inline">
                    <input
                      class="form-check-input"
                      type="radio"
                      name="inlineRadioOptions"
                      value="option3"
                    />
                    <label class="form-check-label">Player</label>
                  </div>
                </div>

                <div className="row wallet-box">
                  <div className="col-md-4">
                    <label className="col-form-label">Username</label>
                  </div>
                  <div className="col-md-12">
                    <select class="form-select">
                      <option selected>Player_01</option>
                      <option>Player_02</option>
                      <option>Player_03</option>
                      <option>Player_04</option>
                    </select>
                  </div>
                </div>
                <div className="row wallet-box wallet-box-2">
                  <div className="col-md-4">
                    <label className="col-form-label">Amount</label>
                  </div>
                  <div className="col-md-12">
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
          {/* card three */}
          {/* <div className="col-sm-4 wallet-card">
            <div className="card">
              <div className="card-body">
                <div className="wallet-spacing">
                  <h5 className="card-title">Deposit Request:</h5>
                  <div className="card-text">3 request</div>
                </div>
                <div className="wallet-spacing">
                  <h5 className="card-title">Withdrawal Request:</h5>
                  <div className="card-text">2 request</div>
                </div>
              </div>
            </div>
          </div> */}
          {/* card sample */}
          <DepositRequest accId={12} header="sdad" col="3" />
          <WithdrawalReq accId={12} header="sdad" walletBalance="12" col="3" />
        </div>
      </form>
      <div className="row second-box">
        <div className="col-md-6">
          <h2>Deposit Request</h2>
          <table class="table table-success table-striped">
            <thead>
              <tr>
                <th scope="col">Username</th>
                <th scope="col">Cellphone No.</th>
                <th scope="col">User Type</th>
                <th scope="col">Amount</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">July 10</th>
                <td>Mark</td>
                <td>Otto</td>
                <td>@mdo</td>
                <td>
                  <button className="btn btn-color text-light">Confirm</button>
                </td>
              </tr>
              <tr>
                <th scope="row">July 11</th>
                <td>Jacob</td>
                <td>Thornton</td>
                <td>@fat</td>
                <td>
                  <button className="btn btn-color text-light">Confirm</button>
                </td>
              </tr>
              <tr>
                <th scope="row">July 12</th>
                <td>Larry the Bird</td>
                <td>@twitter</td>
                <td>123123</td>
                <td>
                  <button className="btn btn-color text-light">Confirm</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="col-md-6">
          <h2>Withdrawal Request</h2>
          <table class="table table-success table-striped">
            <thead>
              <tr>
                <th scope="col">Username</th>
                <th scope="col">Cellphone No.</th>
                <th scope="col">User Type</th>
                <th scope="col">Amount</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">July 10</th>
                <td>Mark</td>
                <td>Otto</td>
                <td>@mdo</td>
                <td>
                  <button className="btn btn-color text-light">Confirm</button>
                </td>
              </tr>
              <tr>
                <th scope="row">July 11</th>
                <td>Jacob</td>
                <td>Thornton</td>
                <td>@fat</td>
                <td>
                  <button className="btn btn-color text-light">Confirm</button>
                </td>
              </tr>
              <tr>
                <th scope="row">July 12</th>
                <td>Larry the Bird</td>
                <td>@twitter</td>
                <td>123123</td>
                <td>
                  <button className="btn btn-color text-light">Confirm</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default MasterWallet;
