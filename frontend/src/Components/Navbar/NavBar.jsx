import React from "react";
import { Link } from "react-router-dom";
import "./NavBar.css";

function NavBar(props) {
  function handleLogOut() {
    props.isOut(true);
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
        <span className="navbar-brand smaller-time">{dd}</span>
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
              {props.user === "masteragent" && (
                <Link className="nav-link active" to={`/${props.user}/agents`}>
                  Agents
                </Link>
              )}
            </li>
            <li className="nav-item">
              {(props.user === "player" || props.user === "admin") && (
                <Link
                  className="nav-link active"
                  aria-current="page"
                  to={`/${props.user}/gameroom`}
                >
                  {props.user === "admin" ? "Game MGMT" : "Game Room"}
                </Link>
              )}
              {(props.user === "agent" || props.user === "masteragent") && (
                <Link
                  className="nav-link active"
                  aria-current="page"
                  to={`/${[props.user]}/players`}
                >
                  Players
                </Link>
              )}
            </li>
            <li className="nav-item">
              {props.user === "admin" && (
                <Link
                  className="nav-link active"
                  aria-current="page"
                  to={`/${[props.user]}/masteragents`}
                >
                  Master Agents
                </Link>
              )}
            </li>
            <li className="nav-item">
              {props.user === "admin" && (
                <Link className="nav-link active" to={`/${props.user}/agents`}>
                  Agents
                </Link>
              )}
            </li>
            <li className="nav-item">
              {props.user === "admin" && (
                <Link
                  className="nav-link active"
                  aria-current="page"
                  to={`/${[props.user]}/players`}
                >
                  Players
                </Link>
              )}
            </li>
            <li className="nav-item">
              <Link className="nav-link active" to={`/${props.user}/wallet`}>
                Wallet
              </Link>
            </li>
            {props.user === "admin" ? null : (
              <li className="nav-item">
                <Link
                  className="nav-link active right-border"
                  to={`/${props.user}/transactions`}
                >
                  {props.user === "player" ? "My Transactions" : "Transactions"}
                </Link>
              </li>
            )}
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
                to={`/${props.user}/account`}
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
