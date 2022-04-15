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
import PlayerAccount from "./Components/Player/PlayerAccount";
import PlayerLiveRoom from "./Components/Player/LiveRoom";
import PlayerWallet from "./Components/Player/PlayerWallet";
import Totalisator from "./Components/Player/Totalisator";
import PlayerSakla from "./Components/Sakla/PlayerSakla";
//AGENT IMPORTS
import AgentPlayers from "./Components/Agent/AgentPlayers";
import AgentWallet from "./Components/Agent/AgentWallet";
//MASTERAGENT IMPORTS
import MasterAgents from "./Components/MasterAgent/MasterAgents";
import MasterPlayers from "./Components/MasterAgent/MasterPlayers";
import MasterWallet from "./Components/MasterAgent/MasterWallet";
//ADMIN IMPORTS
import AdminGameRoom from "./Components/Admin/AdminGameRoom";
import AdminGameSettings from "./Components/Admin/AdminGameSettings";
import AdminMasterAgents from "./Components/Admin/AdminMasterAgents";
import AdminAgents from "./Components/Admin/AdminAgents";
import AdminPlayers from "./Components/Admin/AdminPlayers";
import AdminWallet from "./Components/Admin/AdminWallet";
import AdminGrandMasters from "./Components/Admin/AdminGrandMaster";
import AdminGameSettingsTotalisator from "./Components/Totalisator/AdminGameSettingsTotalisator";
import AdminGameSettingsSakla from "./Components/Sakla/AdminGameSettingsSakla";
//Grandmaster IMPORTS
import GMMasteragents from "./Components/Grandmaster/GMMasteragents";
import GMAgents from "./Components/Grandmaster/GMAgents";
import GMWallet from "./Components/Grandmaster/GMWallet";
import GMPlayers from "./Components/Grandmaster/GMPlayers";
//ERROR PAGE
import ErrorPage from "./Components/ErrorPage";
//IMPORT TRANSACTION TABLE
import TransactionsPage from "./Components/TransactionsPage";
//IMPORT SHIFT EARNINGS
import ShiftEarnings from "./Components/ShiftEarningsPage";
//IMPORT MARKET RESULTS
import MarketResults from "./Components/MarketResults";
//IMPORT MARKET RESULTS
import LiveFeed from "./Components/LiveFeed";
//CSS IMPORTS
import "./App.css";
import { AuthContext } from "./store/auth-context";
import MyAccount from "./Components/MyAccount";

function App() {
  const token = localStorage.getItem("token");
  const ctx = useContext(AuthContext);

  return (
    <Router>
      <div className="App">
        {/* ONLY AUTHORIZED CAN ACCESS THESE ROUTES/PAGES */}
        {/* {ctx.isLoggedIn ? <Banner user={ctx.user.email} /> : null}
        {ctx.isLoggedIn ? <NavBar user={ctx.ctx.user.accountType} /> : null} */}
        {ctx.isLoggedIn ? <Banner user={ctx.user.username} /> : null}
        {ctx.isLoggedIn ? <NavBar user={ctx.user.accountType} /> : null}

        <Switch>
          {/* LOGIN REGISTER ROUTES */}
          <Route path="/" exact>
            {token && ctx.user.accountType === "player" ? (
              <Redirect to="/player/gameroom" />
            ) : null}
            {token && ctx.user.accountType === "agent" ? (
              <Redirect to="/agent/players" />
            ) : null}
            {token && ctx.user.accountType === "masteragent" ? (
              <Redirect to="/masteragent/agents" />
            ) : null}
            {token && ctx.user.accountType === "admin" ? (
              <Redirect to="/admin/gameroom" />
            ) : null}
            {token && ctx.user.accountType === "declarator" ? (
              <Redirect to="/declarator/gameroom" />
            ) : null}
            {token && ctx.user.accountType === "grandmaster" ? (
              <Redirect to="/grandmaster/masteragents" />
            ) : null}
            <Login />
          </Route>

          <Route path="/admin" exact>
            {token && ctx.user.accountType === "admin" ? (
              <Redirect to="/admin/gameroom" />
            ) : null}
            {token && ctx.user.accountType === "declarator" ? (
              <Redirect to="/declarator/gameroom" />
            ) : null}
            <Login user=" Admin" />
          </Route>

          <Route path="/register/:agentid" exact>
            {token && ctx.user.accountType === "player" ? (
              <Redirect to="/player/gameroom" />
            ) : null}
            {token && ctx.user.accountType === "agent" ? (
              <Redirect to="/agent/players" />
            ) : null}
            {token && ctx.user.accountType === "masteragent" ? (
              <Redirect to="/masteragent/agents" />
            ) : null}
            {token && ctx.user.accountType === "admin" ? (
              <Redirect to="/admin/gameroom" />
            ) : null}
            {token && ctx.user.accountType === "declarator" ? (
              <Redirect to="/declarator/gameroom" />
            ) : null}
            <Register />
          </Route>

          {/* PLAYER ROUTES */}
          {token && ctx.user.accountType === "player" ? (
            <Switch>
              <Route path="/player/wallet" exact component={PlayerWallet} />
              <Route path="/player/gameroom" exact component={PlayerGameRoom} />
              <Route
                path="/player/transactions"
                exact
                component={TransactionsPage}
              />
              <Route path="/player/account" exact component={PlayerAccount} />
              <Route
                path="/player/gameRoom/live/:gameId"
                exact
                component={PlayerLiveRoom}
              />
              <Route
                path="/player/gameRoom/Totalisator/:gameid"
                exact
                component={Totalisator}
              />
              <Route
                path="/player/gameRoom/Sakla/:gameid"
                exact
                component={PlayerSakla}
              />
              <Route path="*" component={ErrorPage} />
            </Switch>
          ) : null}

          {/* AGENT ROUTES */}
          {token && ctx.user.accountType === "agent" ? (
            <Switch>
              <Route path="/agent/players" exact component={AgentPlayers} />
              <Route path="/agent/wallet" exact component={AgentWallet} />
              <Route
                path="/agent/transactions"
                exact
                component={TransactionsPage}
              />
              <Route
                path="/agent/marketResults"
                exact
                component={MarketResults}
              />
              <Route path="/agent/account" exact component={MyAccount} />
              <Route path="*" component={ErrorPage} />
            </Switch>
          ) : null}

          {/* MASTERAGENT ROUTES */}
          {token && ctx.user.accountType === "masteragent" ? (
            <Switch>
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
                path="/masteragent/marketResults"
                exact
                component={MarketResults}
              />
              <Route
                path="/masteragent/transactions"
                exact
                component={TransactionsPage}
              />
              <Route path="/masteragent/account" exact component={MyAccount} />
              <Route path="*" component={ErrorPage} />
            </Switch>
          ) : null}

          {/* Grandmaster ROUTES */}
          {token && ctx.user.accountType === "grandmaster" ? (
            <Switch>
              <Route
                path="/grandmaster/masteragents"
                exact
                component={GMMasteragents}
              />
              <Route path="/grandmaster/agents" exact component={GMAgents} />
              <Route path="/grandmaster/players" exact component={GMPlayers} />
              <Route path="/grandmaster/wallet" exact component={GMWallet} />
              <Route
                path="/grandmaster/transactions"
                exact
                component={TransactionsPage}
              />
              <Route
                path="/grandmaster/marketResults"
                exact
                component={MarketResults}
              />
              <Route path="/grandmaster/account" exact component={MyAccount} />
              <Route path="*" component={ErrorPage} />
            </Switch>
          ) : null}

          {/* ADMIN ROUTES */}
          {token && ctx.user.accountType === "admin" ? (
            <Switch>
              <Route path="/admin/gameroom" exact component={AdminGameRoom} />
              {/* <Route
                path="/admin/gameroom/settings"
                exact
                component={AdminGameSettings}
              /> */}
              <Route
                path="/admin/gameroom/settings/:gameid"
                exact
                component={AdminGameSettings}
              />
              <Route
                path="/admin/masteragents"
                exact
                component={AdminMasterAgents}
              />
              <Route
                path="/admin/grandmaster"
                exact
                component={AdminGrandMasters}
              />
              <Route path="/admin/agents" exact component={AdminAgents} />
              <Route path="/admin/players" exact component={AdminPlayers} />
              <Route path="/admin/wallet" exact component={AdminWallet} />
              <Route
                path="/admin/transactions"
                exact
                component={TransactionsPage}
              />
              <Route
                path="/admin/shiftEarnings"
                exact
                component={ShiftEarnings}
              />
              <Route
                path="/admin/marketResults"
                exact
                component={MarketResults}
              />
              <Route
                path="/admin/livefeed"
                exact
                component={LiveFeed}
              />
              <Route
                path="/admin/gameroom/TotalisatorSettings/:gameid"
                exact
                component={AdminGameSettingsTotalisator}
              />
              <Route
                path="/admin/gameroom/SaklaSettings/:gameid"
                exact
                component={AdminGameSettingsSakla}
              />
              <Route path="/admin/account" exact component={MyAccount} />
              <Route path="*" component={ErrorPage} />
            </Switch>
          ) : null}

          {/* ADMIN ROUTES */}
          {token && ctx.user.accountType === "declarator" ? (
            <Switch>
              <Route
                path="/declarator/gameroom"
                exact
                component={AdminGameRoom}
              />
              <Route
                path="/declarator/gameroom/settings/:gameid"
                exact
                component={AdminGameSettings}
              />
              <Route
                path="/declarator/gameroom/TotalisatorSettings/:gameid"
                exact
                component={AdminGameSettingsTotalisator}
              />
              <Route
                path="/declarator/transactions"
                exact
                component={TransactionsPage}
              />
              <Route
                path="/declarator/shiftEarnings"
                exact
                component={ShiftEarnings}
              />
              <Route
                path="/declarator/marketResults"
                exact
                component={MarketResults}
              />
              <Route
                path="/declarator/livefeed"
                exact
                component={LiveFeed}
              />
              <Route path="/declarator/account" exact component={MyAccount} />
              <Route path="*" component={ErrorPage} />
            </Switch>
          ) : null}

          {/* 404 ROUTES */}
          <Route path="*" component={ErrorPage} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;
