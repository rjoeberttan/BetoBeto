import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../store/auth-context";
import { toast } from "react-toastify";
import Select from "react-select";
import Switch from "react-switch";

import "./TransactionsPage.css";

export default function LiveFeed() {
  const gameHeader = process.env.REACT_APP_HEADER_GAME;
  const gameAuthorization = { Authorization: process.env.REACT_APP_KEY_GAME };
  const bankHeader = process.env.REACT_APP_HEADER_BANK;
  const bankAuthorization = { Authorization: process.env.REACT_APP_KEY_BANK };
  const betHeader = process.env.REACT_APP_HEADER_BET;

  const [betList, setBetList] = useState([]);
  const [transactionsList, setTransactionsList] = useState([])
  const [previousDate, setPreviousDate] = useState()

  const colorStyles = {
    option: (provided, state) => ({
      ...provided,
      color: "black",
    }),
  };

  useEffect(() => {
    getTransactionsFeed()
    const interval = setInterval(() => {
      getTransactionsFeed()
    }, 5000);
  }, []);

  function getTransactionsFeed(){
    // Get Date
    const date = new Date();
    const dateTimeNow = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
    console.log(dateTimeNow)
    setPreviousDate(dateTimeNow)

    axios({
      method: "get",
      url: `${bankHeader}/getTransactionsFeed/${dateTimeNow}`,
      headers: bankAuthorization,
    })
      .then((res) => {
        setTransactionsList(res.data.transactions)
        console.log(res.data.transactions)
      })
      .catch((err) => {
        console.log(err);
      });
    
    axios({
      method: "get",
      url: `${bankHeader}/getBetsFeed/${dateTimeNow}`,
      headers: bankAuthorization,
    })
      .then((res) => {
        setBetList(res.data.transactions)
        console.log(res.data.transactions)
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function renderEmptyTable(value) {
    if (value) {
      return (
        <div>
          <h5 className="no-transactions">No Transactions within Time Range</h5>
        </div>
      );
    } else {
      return;
    }
  }

  function subbed(x){
    var removed = x === null ?  "-" : x.slice(0, x.length - 8)
    return removed
  }

  function dateFixed(x){
    var dateFixed = x === null ? "-" : new Date(Date.parse(x)).toLocaleString(('en-us', {timeZone : 'Asia/Taipei'}))
    return dateFixed
  }

  function amountFixed(x){
    var amountFixed = x === null ? "0.00" : parseFloat(x).toFixed(2)
    return amountFixed

  }


  return (
    <div className="container text-light container-transactions">
      <div className="heading-text">
        <h1 className="display-5 small-device bold-small mt-2">
          Live Feed
        </h1>
      </div>

      <div className="table-responsive">
        <h3 className="lead white smaller-device">Bets Feed</h3>
        <table className="table table-success table-striped transaction-page-spacing">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Bet ID</th>
              <th scope="col">Account ID/Username</th>
              <th scope="col">Description</th>
              <th scope="col">Stake</th>
              <th scope="col">Winnings</th>
              <th scope="col">Cummulative</th>
              <th scope="col">Status</th>
              <th scope="col">Settled Date</th>
            </tr>
          </thead>
          <tbody>
            {betList.map((x) => (
              <tr key={Math.random()}>
                <td>{new Date(Date.parse(x.placement_date)).toLocaleString(('en-us', {timeZone : 'Asia/Taipei'}))}</td>
                <td>{x.bet_id}</td>
                <td>{!x.username ? x.account_id : x.username}</td>
                <td>{x.description}</td>
                <td>₱ {parseFloat(x.stake).toFixed(2)}</td>
                <td>₱ {parseFloat(x.winnings).toFixed(2)}</td>
                <td>₱ {x.cummulative ? x.cummulative.toFixed(2) : "-"}</td>
                <td>
                  {x.status === 1
                    ? "LOSE"
                    : x.status === 2
                    ? "WIN"
                    : "PENDING"}
                </td>
                <td>{!x.settled_date ? "-" : new Date(Date.parse(x.settled_date)).toLocaleString(('en-us', {timeZone : 'Asia/Taipei'}))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-responsive">
        <h3 className="lead white smaller-device">Transactions Feed</h3>
        <table className="table table-success table-striped transaction-page-spacing">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Transaction ID</th>
              <th scope="col">Account ID/Username</th>
              <th scope="col">Description</th>
              <th scope="col">Amount</th>
              <th scope="col">Cummulative</th>
              <th scope="col">Status</th>
              <th scope="col">Settled by</th>
            </tr>
          </thead>
          <tbody>
            {transactionsList.map((x) => (
              <tr key={Math.random()}>
                <td>{new Date(Date.parse(x.placement_date)).toLocaleString(('en-us', {timeZone : 'Asia/Taipei'}))}</td>
                <td>{x.transaction_id}</td>
                <td>{!x.username ? x.account_id : x.username}</td>
                <td>{x.description}</td>
                <td>₱ {x.amount.toFixed(2)}</td>
                <td>₱ {x.cummulative ? x.cummulative.toFixed(2) : "-"}</td>
                <td>
                  {x.status === 1
                    ? "Settled"
                    : x.status === 2
                    ? "Cancelled"
                    : "Pending"}
                </td>
                <td>{x.settled_by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {transactionsList.length === 0 ? renderEmptyTable(true) : renderEmptyTable(false)}
    </div>
  );
}
