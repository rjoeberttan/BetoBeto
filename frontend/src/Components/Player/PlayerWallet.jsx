import React, { useContext } from "react";
import "./PlayerWallet.css";
import { AuthContext } from "../../store/auth-context";
import DepositRequest from "../DepositRequest";
import WithdrawalReq from "../WithdrawalReq";

function Wallet() {
  //====================================
  // Variables and State Init
  //====================================
  const ctx = useContext(AuthContext);

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
                  ₱{parseFloat(ctx.walletBalance).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
          <DepositRequest accId={ctx.user.accountID} col="4" />
          <WithdrawalReq
            accId={ctx.user.accountID}
            walletBalance={ctx.walletBalance}
            col="4"
          />
        </div>
      </form>
    </div>
  );
}

export default Wallet;
