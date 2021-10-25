import React from "react";

function Banner(props) {
  return (
    <div>
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
              <span>Wallet: P2,000</span>
            </div>
          </form>
        </div>
      </nav>
    </div>
  );
}

export default Banner;
