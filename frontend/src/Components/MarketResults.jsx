import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../store/auth-context";
import { toast } from "react-toastify";
import Select from "react-select";
import Switch from "react-switch";

import "./TransactionsPage.css";

export default function MarketResults() {
  const gameHeader = process.env.REACT_APP_HEADER_GAME;
  const gameAuthorization = { Authorization: process.env.REACT_APP_KEY_GAME };
  const betHeader = process.env.REACT_APP_HEADER_BET;
  const [gamesList, setGamesList] = useState([]);
  const [marketList, setMarketList] = useState([]);
  const [betList, setBetList] = useState([]);
  const [gameValue, setGameValue] = useState("Select Game");
  const [marketValue, setMarketValue] = useState("Select Market")
  
  const marketSelectInputRef = useRef();

  const colorStyles = {
    option: (provided, state) => ({
      ...provided,
      color: "black",
    }),
  };

  useEffect(() => {
    axios({
      method: "get",
      url: `${gameHeader}/getGamesList`,
      headers: gameAuthorization,
    })
      .then((res) => {
        console.log(res.data.data);
        setGamesList(res.data.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  function renderEmptyTable(value) {
    if (value) {
      return (
        <div>
          <h5 className="no-transactions">No bets placed on the market</h5>
        </div>
      );
    } else {
      return;
    }
  }

  // function subbed(x){
  //   var removed = x === null ?  "-" : x.slice(0, x.length - 8)
  //   return removed
  // }

  function dateFixed(x){
    var dateFixed = x === null ? "-" : new Date(Date.parse(x)).toLocaleString(('en-us', {timeZone : 'Asia/Taipei'}))
    return dateFixed
  }

  // function amountFixed(x){
  //   var amountFixed = x === null ? "0.00" : parseFloat(x).toFixed(2)
  //   return amountFixed

  // }

  function setGame(e) {
    console.log(e.value);
    setMarketList([])

    axios({
      method: "get",
      url: `${gameHeader}/getMarketsUnderGame/${e.value}`,
      headers: gameAuthorization,
    })
      .then((res) => {
        setMarketList(res.data.data.markets);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function setMarket(e) {
    const marketId = e.value;

    axios({
      method: "get",
      url: `${betHeader}/getBetMarketList/${marketId}`,
      headers: {
        "Authorization": process.env.REACT_APP_KEY_BET,
      },
    })
      .then((res) => {
        setBetList(res.data.data);
        console.log(res);
      })
      .catch((err) => {});

  }

  function fetchGameOptions() {
    var gamesOptions = [];
    gamesList.map((x) => {
      gamesOptions.push({
        value: x.game_id,
        label: x.basename,
      });
    });
    return gamesOptions;
  }

  function fetchMarketOptions() {
    var marketOptions = [];
    if (marketList.length !== 0){
      marketList.map((x) => {
        marketOptions.push({
          value: x.market_id,
          label: `${x.market_id} - Result: ${x.result}`
        })
      })
    } else {
      return []
    }

    return marketOptions;
  }

  return (
    <div className="container text-light container-transactions">
      <div className="heading-text">
        <h1 className="display-5 small-device bold-small mt-2">
          Market Details
        </h1>
      </div>

      <div className="row">
        <div className="col-md-1">
          <label className="col-form-label">Select Game:</label>
        </div>
        <div className="col-md-3">
          <Select
            onChange={setGame}
            options={fetchGameOptions()}
            styles={colorStyles}
          ></Select>
        </div>
      </div>

      <div className="row">
        <div className="col-md-1">
          <label className="col-form-label">Select Market:</label>
        </div>
        <div className="col-md-3">
          <Select
            onChange={setMarket}
            options={fetchMarketOptions()}
            styles={colorStyles}
          ></Select>
        </div>
      </div>

      <div className="table-responsive">

        <table className="table table-success table-striped transaction-page-spacing">
          <thead>
            <tr>
              <th scope="col">Bet ID</th>
              <th scope="col">Account ID</th>
              <th scope="col">Description</th>
              <th scope="col">Bet Amount</th>
              <th scope="col">Winnings</th>
              <th scope="col">Wallet Balance</th>
              <th scope="col">Bet Status</th>
              <th scope="col">Placement Date</th>
              <th scope="col">Settled Date</th>
            </tr>
          </thead>
          <tbody>
            {betList.map((x) => (
              <tr key={Math.random()}>
                <td>{x.bet_id}</td>
                <td>{x.account_id}</td>
                <td>{x.description}</td>
                <td>P {parseFloat(x.stake).toFixed(2)}</td>
                <td>P {parseFloat(x.winnings).toFixed(2)}</td>
                <td>P {parseFloat(x.cummulative).toFixed(2)}</td>
                <td>{(x.status === 1 ? "LOSE" : (x.status === 2 ? "WIN" : (x.status === 0 ? "PENDING" : "DRAW")))}</td>
                <td>{dateFixed(x.placement_date)}</td>
                <td>{dateFixed(x.settled_date)}</td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {betList.length === 0 ? renderEmptyTable(true) : renderEmptyTable(false)}
    </div>
  );
}
