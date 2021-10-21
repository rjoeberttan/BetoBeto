import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from "react-router-dom";
import Banner from "./Components/Navbar/Banner";
import NavBar from "./Components/Navbar/NavBar";
import GameRoom from "./Components/Navbar/GameRoom";
import Wallet from "./Components/Navbar/Wallet";
import Transactions from "./Components/Navbar/Transactions";
import Account from "./Components/Navbar/Account";
import Login from "./Components/LoginRegisterForms/Login";
import Register from "./Components/LoginRegisterForms/Register";
import Player from "./Components/Player/Player";
import LiveRoom from "./Components/Player/LiveRoom";
import "./App.css";

function App() {
  const adminUser = {
    email: "testing",
    password: "123",
  };

  const [authorize, setAuthorize] = useState(false);

  const [message, setMessage] = useState("");

  function checkDetails(details) {
    console.log(details);
    if (
      details.username === adminUser.email &&
      details.password === adminUser.password
    ) {
      setAuthorize(true);
      setMessage("Successfully logged in");

      localStorage.setItem("token", "pakyu");
    } else {
      console.log("Invalid credentials");
      setMessage("Invalid credentials");
      setAuthorize(false);
    }
  }

  function isOut() {
    setAuthorize(false);
  }

  return (
    <Router>
      <div className="App">
        {authorize ? <Banner /> : null}
        {authorize ? <NavBar authorize={authorize} isOut={isOut} /> : null}
        {authorize ? <Redirect to="/player" /> : null}
        <Switch>
          <Route path="/" exact>
            <Login details={checkDetails} message={message} />
          </Route>
          <Route path="/register/:accid" exact component={Register} />
          <Route path="/player" exact>
            <Player details={adminUser} authorize={authorize} />
          </Route>
          <Route path="/player/wallet" exact component={Wallet} />
          <Route path="/player/gameroom" exact component={GameRoom} />
          <Route path="/player/transactions" exact component={Transactions} />
          <Route path="/player/account" exact component={Account} />
          <Route path="/player/GameRoom/live" exact component={LiveRoom} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;

// <Redirect to={{ pathname: "/player", data: { adminUser } }} />
