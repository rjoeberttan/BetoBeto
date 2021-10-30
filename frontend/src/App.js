import React, { useContext } from "react";
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
import { AuthContext } from "./store/auth-context";

function App() {
  function poropor() {
    return <div>ERROR</div>;
  }

  const token = localStorage.getItem("token");

  const ctx = useContext(AuthContext);

  const user = {
    type: "player",
  };

  return (
    <Router>
      <div className="App">
        {/* ONLY AUTHORIZED CAN ACCESS THESE ROUTES/PAGES */}
        {/* {ctx.isLoggedIn ? <Banner user={ctx.user.email} /> : null}
        {ctx.isLoggedIn ? <NavBar user={ctx.user.type} /> : null} */}
        {ctx.isLoggedIn ? <Banner user={ctx.user.email} /> : null}
        {ctx.isLoggedIn ? <NavBar user={user.type} /> : null}

        <Switch>
          {/* LOGIN REGISTER ROUTES */}
          <Route path="/" exact>
            {/* REDIRECT TO WHICH PAGE(PLAYER, AGENT, MASTERAGENT, OR ADMIN) */}
            {/* {token && ctx.user.type === "player" ? (
              <Redirect to="/player/gameroom" />
            ) : null}
            {token && ctx.user.type === "agent" ? (
              <Redirect to="/agent/players" />
            ) : null}
            {token && ctx.user.type === "masteragent" ? (
              <Redirect to="/masteragent/agents" />
            ) : null}
            {token && ctx.user.type === "admin" ? (
              <Redirect to="/admin/gameroom" />
            ) : null} */}
            {token && user.type === "player" ? (
              <Redirect to="/player/gameroom" />
            ) : null}
            {token && user.type === "agent" ? (
              <Redirect to="/agent/players" />
            ) : null}
            {token && user.type === "masteragent" ? (
              <Redirect to="/masteragent/agents" />
            ) : null}
            {token && user.type === "admin" ? (
              <Redirect to="/admin/gameroom" />
            ) : null}
            <Login />
          </Route>
          <Route path="/register/:accid" exact component={Register} />

          {/* PLAYER ROUTES */}
          {token && user.type === "player" ? (
            <>
              <Route path="/player/wallet" exact component={PlayerWallet} />
              <Route path="/player/gameroom" exact component={PlayerGameRoom} />
              <Route
                path="/player/transactions"
                exact
                component={PlayerTransactions}
              />
              <Route path="/player/account" exact component={PlayerAccount} />
              <Route
                path="/player/gameRoom/live"
                exact
                component={PlayerLiveRoom}
              />
            </>
          ) : null}

          {/* AGENT ROUTES */}
          {token && user.type === "agent" ? (
            <>
              <Route path="/agent/players" exact component={AgentPlayers} />
              <Route path="/agent/wallet" exact component={AgentWallet} />
              <Route
                path="/agent/transactions"
                exact
                component={AgentTransactions}
              />
              <Route path="/agent/account" exact component={AgentAccount} />
            </>
          ) : null}

          {/* MASTERAGENT ROUTES */}
          {token && user.type === "masteragent" ? (
            <>
              <Route
                path="/masteragent/agents"
                exact
                component={MasterAgents}
              />
              <Route
                path="/masteragent/players"
                exact
                component={MasterPlayers}
              />
              <Route
                path="/masteragent/wallet"
                exact
                component={MasterWallet}
              />
              <Route
                path="/masteragent/transactions"
                exact
                component={MasterTransactions}
              />
              <Route
                path="/masteragent/account"
                exact
                component={MasterAccount}
              />
            </>
          ) : null}

          {/* ADMIN ROUTES */}
          {token && user.type === "admin" ? (
            <>
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
            </>
          ) : null}

          {/* 404 ROUTES */}
          <Route path="*" exact component={poropor} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;
