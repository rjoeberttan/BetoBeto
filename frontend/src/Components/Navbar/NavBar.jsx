import React from "react";
import { Link } from "react-router-dom";
import "./NavBar.css";

function NavBar({ isOut }) {
  function handleLogOut() {
    isOut(true);
  }

  const today = new Date();

  const dd = today.toLocaleString("en-us", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  return (
    <nav className="navbar sticky-top navbar-expand-lg navbar-dark bg-green">
      <div className="container-fluid text-center">
        <span className="navbar-brand" to="/player/GameRoom">
          {dd}
        </span>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarScroll"
          aria-controls="navbarScroll"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarScroll">
          <ul className="navbar-nav me-auto my-2 my-lg-0 navbar-nav-scroll">
            <li className="nav-item">
              <Link
                className="nav-link active"
                aria-current="page"
                to="/player/GameRoom"
              >
                Game Room
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link active" to="/player/wallet">
                Wallet
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className="nav-link active right-border"
                to="/player/transactions"
              >
                My Transactions
              </Link>
            </li>
          </ul>
          <div className="nav-item dropdown text-center">
            <span
              className="nav-link dropdown-toggle drpdown-txt text-light right-border"
              id="navbarDropdown"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Profile
            </span>
            <ul
              className="dropdown-menu dropdown-menu-center"
              aria-labelledby="navbarDropdown"
            >
              <Link
                className="text-center remove-underline"
                to="/player/account"
              >
                <span className="dropdown-item">My Account</span>
              </Link>
              <Link>
                <hr className="dropdown-divider" />
              </Link>
              <Link
                to="/"
                className="text-center remove-underline"
                onClick={handleLogOut}
              >
                <span className="dropdown-item">Logout</span>
              </Link>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
