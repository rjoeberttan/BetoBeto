import React, { useContext } from "react";
import { AuthContext } from "../../store/auth-context";

function Banner(props) {
  const ctx = useContext(AuthContext);
  // function handleClick(e){
  //   ctx.handleWallet("Hello")
  //   e.preventDefault();
  // }

  return (
    <>
      <nav
        className="navbar navbar-dark"
        style={{ backgroundColor: "#191a19" }}
      >
        <div className="container-fluid">
          <span className="navbar-brand">Master Gambler</span>
          <form className="d-flex">
            <div className="text-light">
              <span>Welcome {props.user}!</span>
              {(ctx.user.accountType === "agent" ||
                ctx.user.accountType === "masteragent" ||
                ctx.user.accountType === "grandmaster") && (
                <div>
                  Commission: {parseFloat(ctx.user.commission).toFixed(2)}%
                </div>
              )}
              <div>Wallet: ₱{parseFloat(ctx.walletBalance).toFixed(2)}</div>
            </div>
          </form>
        </div>
      </nav>
    </>
  );
}

export default Banner;
