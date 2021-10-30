import React, {useContext} from "react";
import { AuthContext } from "../../store/auth-context";

function Banner(props) {
  const ctx = useContext(AuthContext)
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
              <br />
              <span>Wallet: ₱{ctx.walletBalance}</span>
            </div>
          </form>
        </div>
      </nav>
    </>
  );
}

export default Banner;
