import React from "react";

function Banner() {
  return (
    <div>
      <nav
        className="navbar navbar-dark"
        style={{ backgroundColor: "#191a19" }}
      >
        <div className="container-fluid">
          <span className="navbar-brand">Beto Beto Gaming</span>
          <form className="d-flex">
            <div className="text-light">
              <span>Welcome Player!</span>
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
