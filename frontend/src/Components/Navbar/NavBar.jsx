import axios from "axios";
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { AuthContext } from "../../store/auth-context";
import "./NavBar.css";



function NavBar(props) {
  const ctx = useContext(AuthContext);
  const accountHeader = process.env.REACT_APP_HEADER_ACCOUNT;
  const accAuthorization = {
    "Authorization": process.env.REACT_APP_KEY_ACCOUNT,
  };

  function handleLogOut() {
    ctx.handleLogOut(true);
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



  //SHIFT MANAGEMENT
  function startShift(e){
    if (window.confirm("Start shift?")) {
      axios({
        method: "post",
        url: `${accountHeader}/startShift`,
        headers: accAuthorization,
        data: {
          accountId: ctx.user.accountID,
          username: ctx.user.username
        },
      })
      .then((res) => {
        toast.info("Shift successfully start")
      })
      .catch((err) => {
        toast.error("Server Error")
      })
    } else {
      toast.info("Start shift cancelled")
    }
  }

  function endShift(e){
    if (window.confirm("End Shift?")) {
      axios({
        method: "post",
        url: `${accountHeader}/endshift`,
        headers: accAuthorization,
        data: {
          accountId: ctx.user.accountID,
          username: ctx.user.username
        },
      })
      .then((res) => {
        toast.info("Shift successfully ended. Check Shift Earnings page")
      })
      .catch((err) => {
        var errorMessage = err.response.data.message === null ? "Server Error" : err.response.data.message 
        toast.error(errorMessage)
      })
    } else {
      toast.info("End shift cancelled")
    }
  }

  return (
    <nav className="navbar sticky-top navbar-expand-lg navbar-dark bg-green">
      <div className="container-fluid text-center">
        <ToastContainer />
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
              {(props.user === "player" ||
                props.user === "admin" ||
                props.user === "declarator") && (
                <Link
                  className="nav-link active"
                  aria-current="page"
                  to={`/${props.user}/gameroom`}
                >
                  {props.user === "admin" ? "Game MGMT" : "Game Room"}
                </Link>
              )}
            </li>

            <li className="nav-item">
              <div className="nav-item dropdown text-center">
                <span
                  className="nav-link dropdown-toggle drpdown-txt text-light right-border"
                  id="navbarDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Manage Users
                </span>
                <ul
                  className="dropdown-menu dropdown-menu-center"
                  aria-labelledby="navbarDropdown"
                >

                  {(props.user === "admin" ) && (
                    <Link className="text-center remove-underline" to={`/${props.user}/grandmaster`}>
                      <span className="dropdown-item">Grand Master</span>
                    </Link>
                  )}
                  {(props.user === "admin" || props.user === "grandmaster") && (
                    <Link className="text-center remove-underline" to={`/${props.user}/masteragents`}>
                      <span className="dropdown-item">Master Agents</span>
                    </Link>
                  )}

                  {(props.user === "masteragent" || props.user === "admin") && (
                    <Link className="text-center remove-underline" to={`/${props.user}/agents`}>
                      <span className="dropdown-item">Agents</span>
                    </Link>
                  )}

                  {(props.user !== "player") && (
                    <Link className="text-center remove-underline" to={`/${props.user}/players`}>
                      <span className="dropdown-item">Players</span>
                    </Link>
                  )}                
                </ul>
               </div>
            </li>
            
            <li className="nav-item">
              {props.user !== "declarator" && (
                <Link className="nav-link active" to={`/${props.user}/wallet`}>
                  Wallet
                </Link>
              )}
            </li>
            <li className="nav-item">
              <Link
                className="nav-link active right-border"
                to={`/${props.user}/transactions`}
              >
                Transactions
              </Link>
            </li>
            <li className="nav-item">
              {(props.user === "admin" || props.user === "declarator")&& (
                <Link className="nav-link active" to={`/${props.user}/shiftEarnings`}>
                  Shift Earnings
                </Link>
              )}
            </li>
            <li className="nav-item">
              {(props.user === "admin" || props.user === "declarator") && (
                <Link className="nav-link active" to={`/${props.user}/marketResults`}>
                  Market Result
                </Link>
              )}
            </li>
            <li className="nav-item">
              {(props.user === "admin" || props.user === "declarator") && (
                <Link className="nav-link active" to={`/${props.user}/livefeed`}>
                  Live Feed
                </Link>
              )}
            </li>
          </ul>
          <ul className="navbar-nav" >
            <li className="nav-item">
              {props.user === "declarator" && (
                <Link
                    className="nav-link active right-border"
                    onClick={startShift}
                    to={"#"}
                  >
                    Start Shift
                </Link>
              )}    
            </li>
            <li className="nav-item">
              {props.user === "declarator" && (
                <Link
                    className="nav-link active right-border"
                    onClick={endShift}
                    to={"#"}
                >
                  End Shift
                </Link>
              )}    
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
                to={`/${props.user}/account`}
              >
                <span className="dropdown-item">My Account</span>
              </Link>
              <span>
                <hr className="dropdown-divider" />
              </span>
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