import React, { useContext, useState } from "react";
import "./PlayerWallet.css";
import { AuthContext } from "../../store/auth-context";
const axios = require("axios").default;

function Wallet() {

  //====================================
  // Variables and State Init
  //====================================
  const ctx = useContext(AuthContext)
  const bankHeader = "http://localhost:4006";
  const [dpAmount, setDpAmount] = useState("0");
  const [wdAmount, setWdAmount] = useState("0");



  //====================================
  // Event Handler Functions
  //====================================
  function handleDepositAmt(e){
    setDpAmount(parseFloat(e.target.value).toFixed(2))
  }

  function handleWithdrawAmt(e){
    setWdAmount(parseFloat(e.target.value).toFixed(2))
  }

  function submitDeposit(e) {
    axios({
      method: "post",
      url: `${bankHeader}/requestDeposit`,
      headers: {
        "Authorization": "[9@kw7L>F86_P](p",
      },
      data: {
        amount: dpAmount,
        accountId: ctx.user.accountID
      },
    })
    .then((res) => {console.log(res)})
    .catch((err) => {console.log(err)})
    e.preventDefault()
  }

  function submitWithdrawal(e) {
    console.log(wdAmount)
    if (parseFloat(wdAmount) > parseFloat(ctx.walletBalance).toFixed(2)){
      console.log("Withdrawal amount is greater than current wallet")
    } else {
      axios({
        method: "post",
        url: `${bankHeader}/requestWithdrawal`,
        headers: {
          "Authorization": "[9@kw7L>F86_P](p",
        },
        data: {
          amount: wdAmount,
          accountId: ctx.user.accountID
        },
      })
      .then((res) => {console.log(res)})
      .catch((err) => {console.log(err)})
    }
    e.preventDefault()
  }




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
                <div className="card-text wallet-balance">P {parseFloat(ctx.walletBalance).toFixed(2)}</div>
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
                      placeholder=""
                      onChange={handleDepositAmt}
                    />
                  </div>
                </div>
                <div className="col-md-12 text-center">
                  <button className="btn btn-color register-btn text-light" onClick={submitDeposit}>
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
                      placeholder=""
                      onChange={handleWithdrawAmt}
                    />
                  </div>
                </div>
                <div className="col-md-12 text-center">
                  <button className="btn btn-color register-btn text-light" onClick={submitWithdrawal}>
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
