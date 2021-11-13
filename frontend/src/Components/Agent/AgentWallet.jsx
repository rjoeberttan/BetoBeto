import axios from "axios";
import React, { useEffect, useContext, useState } from "react";
import { AuthContext } from "../../store/auth-context";
import WalletRequestTable from "../WalletRequestTable";
import "./AgentWallet.css";

function AgentWallet() {

  //============================================
  // Variable and useState Definitions
  //============================================
  const ctx = useContext(AuthContext);
  const bankHeader = "http://localhost:4006"
  const [depositRequest, setDepositRequest] = useState([])
  const [withdrawalRequest, setWithdrawalRequest] = useState([])

  //============================================
  // useEffect Definitions
  //============================================
  useEffect(() => {
    getUnsettledDeposits()
    getUnsettledWithdrawals()
  }, [])

  function getUnsettledDeposits(){
    const accType = (ctx.user.accountType === "admin") ? 0 : (ctx.user.accountType === "masteragent" ? 1 : 2)
    axios({
      method: "get",
      url: `${bankHeader}/getUnsettledRequest/${ctx.user.accountID}/${accType}/0`,
      headers: {
        "Authorization": "[9@kw7L>F86_P](p",
      },
    })
      .then((res) => {
        const data = res.data.data;
        console.log(data)
        setDepositRequest(data)
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function getUnsettledWithdrawals(){
    const accType = (ctx.user.accountType === "admin") ? 0 : (ctx.user.accountType === "masteragent" ? 1 : 2)
    axios({
      method: "get",
      url: `${bankHeader}/getUnsettledRequest/${ctx.user.accountID}/${accType}/2`,
      headers: {
        "Authorization": "[9@kw7L>F86_P](p",
      },
    })
      .then((res) => {
        const data = res.data.data;
        console.log(data)
        setWithdrawalRequest(data)
      })
      .catch((err) => {
        console.log(err);
      });
  }


  return (
    <div className="container text-light container-wallet">
      <div className="heading-text">
        <h1 className="display-5 small-device bold-small">Wallet</h1>
      </div>
      <form>
        <div className="row txt-black">
          <div className="col-sm-4 wallet-card">
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
                <h4>No. of players 50</h4>
              </div>
            </div>
          </div>
          <div className="col-sm-4 wallet-card">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Transfer Funds</h5>
                <div className="row wallet-box">
                  <div className="col-md-3">
                    <label className="col-form-label">Username</label>
                  </div>
                  <div className="col-md-9">
                    <select class="form-select">
                      <option selected>Player_01</option>
                      <option>Player_02</option>
                      <option>Player_03</option>
                      <option>Player_04</option>
                    </select>
                  </div>
                </div>
                <div className="row wallet-box wallet-box-2">
                  <div className="col-md-3">
                    <label className="col-form-label">Amount</label>
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
          </div>
        </div>
      </form>
      
      <div className="row second-box">
        <div className="col-md-12">
          <h2>Deposit Request</h2>
          <table class="table table-success table-striped">
            <thead>
              <tr>
                <th scope="col">Username</th>
                <th scope="col">Cellphone No.</th>
                <th scope="col">User Type</th>
                <th scope="col">Amount</th>
                <th scope="col">Placement Date</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {depositRequest.map((x) => (
                <WalletRequestTable 
                  key={x.transaction_id}
                  transactionId={x.transaction_id}
                  requesterAccountId={x.account_id}
                  requesterUsername={x.username}
                  requesterType={x.account_type}
                  placementDate={x.placement_date.substring(0, 10)}
                  amount={x.amount}
                  phoneNum={x.phone_num}
                  accepterAccountId={ctx.user.accountID}
                  accepterUsername={ctx.user.username}
                  transactionType="0"
                  accepterWallet={ctx.walletBalance}
                />
              ))}
            </tbody>
          </table>
        </div>


        <div className="col-md-12">
          <h2>Withdrawal Request</h2>
          <table class="table table-success table-striped">
            <thead>
              <tr>
                <th scope="col">Username</th>
                <th scope="col">Cellphone No.</th>
                <th scope="col">User Type</th>
                <th scope="col">Amount</th>
                <th scope="col">Placement Date</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {withdrawalRequest.map((x) => (
                <WalletRequestTable 
                  key={x.transaction_id}
                  transactionId={x.transaction_id}
                  requesterAccountId={x.account_id}
                  requesterUsername={x.username}
                  requesterType={x.account_type}
                  placementDate={x.placement_date.substring(0, 10)}
                  amount={x.amount}
                  phoneNum={x.phone_num}
                  accepterAccountId={ctx.user.accountID}
                  accepterUsername={ctx.user.username}
                  transactionType="2"
                  accepterWallet={ctx.user.walletBalance}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AgentWallet;
