import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from "react-router-dom";
// LOGIN REGISTER IMPORTS
import Login from "./Components/LoginRegisterForms/Login";
import Register from "./Components/LoginRegisterForms/Register";
//BANNER NAVBAR IMPORTS
import Banner from "./Components/Navbar/Banner";
import NavBar from "./Components/Navbar/NavBar";
//PLAYER IMPORTS
import PlayerGameRoom from "./Components/Player/PlayerGameRoom";
import PlayerTransactions from "./Components/Player/PlayerTransactions";
import PlayerAccount from "./Components/Player/PlayerAccount";
import PlayerLiveRoom from "./Components/Player/LiveRoom";
import PlayerWallet from "./Components/Player/PlayerWallet";
//AGENT IMPORTS
import AgentPlayers from "./Components/Agent/AgentPlayers";
import AgentTransactions from "./Components/Agent/AgentTransactions";
import AgentAccount from "./Components/Agent/AgentAccount";
import AgentWallet from "./Components/Agent/AgentWallet";
//MASTERAGENT IMPORTS
import MasterAgents from "./Components/MasterAgent/MasterAgents";
import MasterPlayers from "./Components/MasterAgent/MasterPlayers";
import MasterTransactions from "./Components/MasterAgent/MasterTransactions";
import MasterAccount from "./Components/MasterAgent/MasterAccount";
import MasterWallet from "./Components/MasterAgent/MasterWallet";
//ADMIN IMPORTS
import AdminGameRoom from "./Components/Admin/AdminGameRoom";
import AdminGameSettings from "./Components/Admin/AdminGameSettings";
import AdminMasterAgents from "./Components/Admin/AdminMasterAgents";
import AdminAgents from "./Components/Admin/AdminAgents";
import AdminPlayers from "./Components/Admin/AdminPlayers";
import AdminAccount from "./Components/Admin/AdminAccount";
import AdminWallet from "./Components/Admin/AdminWallet";
//CSS IMPORTS
import "./App.css";

function App() {
  const user = {
    email: "testing",
    password: "123",
    type: "admin",
  };

  const [authorize, setAuthorize] = useState(false);

  const [message, setMessage] = useState("");

  function checkDetails(details) {
    console.log(details);
    if (details.username === user.email && details.password === user.password) {
      setAuthorize(true);
      setMessage("Successfully logged in");

      localStorage.setItem("token", "xxx");
    } else {
      console.log("Invalid credentials");
      setMessage("Invalid credentials");
      setAuthorize(false);
    }
  }

  function isOut() {
    setAuthorize(false);
  }

  function poropor() {
    return <div>ERROR</div>;
  }

  return (
    <Router>
      <div className="App">
        {/* ONLY AUTHORIZED CAN ACCESS THESE ROUTES/PAGES */}
        {authorize ? <Banner user={user.email} /> : null}
        {authorize ? (
          <NavBar user={user.type} authorize={authorize} isOut={isOut} />
        ) : null}

        {/* REDIRECT TO WHICH PAGE(PLAYER, AGENT, MASTERAGENT, OR ADMIN) */}
        {authorize && user.type === "player" ? (
          <Redirect to="/player/gameroom" />
        ) : null}
        {authorize && user.type === "agent" ? (
          <Redirect to="/agent/players" />
        ) : null}
        {authorize && user.type === "masteragent" ? (
          <Redirect to="/masteragent/agents" />
        ) : null}
        {authorize && user.type === "admin" ? (
          <Redirect to="/admin/gameroom" />
        ) : null}
        <Switch>
          {/* LOGIN REGISTER ROUTES */}
          <Route path="/" exact>
            <Login details={checkDetails} message={message} />
          </Route>
          <Route path="/register/:accid" exact component={Register} />

          {/* PLAYER ROUTES */}
          <Route path="/player/wallet" exact component={PlayerWallet} />
          <Route path="/player/gameroom" exact component={PlayerGameRoom} />
          <Route
            path="/player/transactions"
            exact
            component={PlayerTransactions}
          />
          <Route path="/player/account" exact component={PlayerAccount} />
          <Route
            path="/player/GameRoom/live"
            exact
            component={PlayerLiveRoom}
          />

          {/* AGENT ROUTES */}
          <Route path="/agent/players" exact component={AgentPlayers} />
          <Route path="/agent/wallet" exact component={AgentWallet} />
          <Route
            path="/agent/transactions"
            exact
            component={AgentTransactions}
          />
          <Route path="/agent/account" exact component={AgentAccount} />

          {/* MASTERAGENT ROUTES */}
          <Route path="/masteragent/agents" exact component={MasterAgents} />
          <Route path="/masteragent/players" exact component={MasterPlayers} />
          <Route path="/masteragent/wallet" exact component={MasterWallet} />
          <Route
            path="/masteragent/transactions"
            exact
            component={MasterTransactions}
          />
          <Route path="/masteragent/account" exact component={MasterAccount} />

          {/* ADMIN ROUTES */}
          <Route path="/admin/gameroom" exact component={AdminGameRoom} />
          <Route
            path="/admin/gameroom/settings"
            exact
            component={AdminGameSettings}
          />
          <Route
            path="/admin/masteragents"
            exact
            component={AdminMasterAgents}
          />
          <Route path="/admin/agents" exact component={AdminAgents} />
          <Route path="/admin/players" exact component={AdminPlayers} />
          <Route path="/admin/wallet" exact component={AdminWallet} />
          <Route path="/admin/account" exact component={AdminAccount} />

          {/* 404 ROUTES */}
          <Route path="*" exact component={poropor} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;
