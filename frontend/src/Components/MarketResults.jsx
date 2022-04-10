import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../store/auth-context";
import { toast } from "react-toastify";
import Select from "react-select";
import Switch from "react-switch";

import "./TransactionsPage.css";

export default function MarketResults() {
  const gameHeader = process.env.REACT_APP_HEADER_GAME;
  const gameAuthorization = { "Authorization": process.env.REACT_APP_KEY_GAME };
  const [marketList, setMarketList] = useState([])


  useEffect(() => {
    axios({
      method: "get",
      url: `${gameHeader}/getMarketResults`,
      headers: gameAuthorization,
    })
    .then((res) => {
      console.log(res)
     setMarketList(res.data.data)
    })
    .catch((err) => {
      console.log(err)
    })  
  }, [])

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
        <h1 className="display-5 small-device bold-small">Markets Result</h1>
      </div>
      
      <div className="table-responsive">

        <table className="table table-success table-striped transaction-page-spacing">
          <thead>
            <tr>
              <th scope="col">Market ID</th>
              <th scope="col">Game</th>
              <th scope="col">Result</th>
              <th scope="col">Settled Date</th>
            </tr>
          </thead>
          <tbody>
            {marketList.map((x) => (
              <tr key={Math.random()}>
                <td>{x.market_id}</td>
                <td>{x.description}</td>
                <td>{x.result}</td>
                <td>{dateFixed(x.settled_date)}</td>
                {/* <td>{x.placement_date}</td>
                {/* <td>{new Date(Date.parse(x.placement_date)).toLocaleString(('en-us', {timeZone : 'Asia/Taipei'}))}</td>
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
                <td>{x.settled_by}</td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {marketList.length === 0 ? renderEmptyTable(true) : renderEmptyTable(false)}
    </div>
  );
}
