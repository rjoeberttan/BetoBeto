import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../store/auth-context";
import { toast } from "react-toastify";
import Select from "react-select";
import Switch from "react-switch";

import "./TransactionsPage.css";

export default function ShiftEarnings() {
  const accountHeader = process.env.REACT_APP_HEADER_ACCOUNT;
  const accAuthorization = {
    "Authorization": process.env.REACT_APP_KEY_ACCOUNT,
  };
  const [shiftList, setShiftList] = useState([])


  useEffect(() => {
    axios({
      method: "get",
      url: `${accountHeader}/getShifts`,
      headers: accAuthorization,
    })
    .then((res) => {
     setShiftList(res.data.data)
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
        <h1 className="display-5 small-device bold-small">Shift Earnings</h1>
      </div>
      
      <div className="table-responsive">

        <table className="table table-success table-striped transaction-page-spacing">
          <thead>
            <tr>
              <th scope="col">Username</th>
              <th scope="col">Game Name</th>
              <th scope="col">Time In</th>
              <th scope="col">Time Out</th>
              <th scope="col">Total Bets</th>
              <th scope="col">Total Loss</th>
              <th scope="col">Total Commissions</th>
              <th scope="col">Total Earnings</th>
            </tr>
          </thead>
          <tbody>
            {shiftList.map((x) => (
              <tr key={Math.random()}>
                <td>{x.username}</td>
                <td>{subbed(x.name)}</td>
                <td>{dateFixed(x.time_in)}</td>
                <td>{dateFixed(x.time_out)}</td>
                <td>₱ {amountFixed(x.total_bets_placed)}</td>
                <td>₱ {amountFixed(x.total_loss)}</td>
                <td>₱ {amountFixed(x.total_commissions)}</td>
                <td>₱ {amountFixed(x.total_earnings)}</td>
                {/* <td>{x.placement_date}</td> */}
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
      
      {shiftList.length === 0 ? renderEmptyTable(true) : renderEmptyTable(false)}
    </div>
  );
}
