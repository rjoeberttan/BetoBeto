import React, { useContext, useState } from "react";
import "./PlayerWallet.css";
import { AuthContext } from "../../store/auth-context";
import DepositRequest from "../DepositRequest";
import WithdrawalReq from "../WithdrawalReq";
const axios = require("axios").default;

function Wallet() {
  //====================================
  // Variables and State Init
  //====================================
  const ctx = useContext(AuthContext);
  const bankHeader = "http://localhost:4006";
  const [wdAmount, setWdAmount] = useState("0");

  //====================================
  // Event Handler Functions
  //====================================
  function handleWithdrawAmt(e) {
    setWdAmount(parseFloat(e.target.value).toFixed(2));
  }

  function submitWithdrawal(e) {
    console.log(wdAmount);
    if (parseFloat(wdAmount) > parseFloat(ctx.walletBalance).toFixed(2)) {
      console.log("Withdrawal amount is greater than current wallet");
    } else {
      axios({
        method: "post",
        url: `${bankHeader}/requestWithdrawal`,
        headers: {
          "Authorization": "[9@kw7L>F86_P](p",
        },
        data: {
          amount: wdAmount,
          accountId: ctx.user.accountID,
        },
      })
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.log(err);
        });
    }
    e.preventDefault();
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
                <div className="card-text wallet-balance">
                  P {parseFloat(ctx.walletBalance).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
          <DepositRequest accId={ctx.user.accountID} header={bankHeader} />
          <WithdrawalReq
            accId={ctx.user.accountID}
            header={bankHeader}
            walletBalance={ctx.walletBalance}
          />
        </div>
      </form>
    </div>
  );
}

export default Wallet;
