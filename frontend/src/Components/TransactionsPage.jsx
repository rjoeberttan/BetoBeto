import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../store/auth-context";
import { toast } from "react-toastify";

import "./TransactionsPage.css";

export default function TransactionsPage() {
  const accountHeader = process.env.REACT_APP_HEADER_ACCOUNT;
  const bankHeader = process.env.REACT_APP_HEADER_BANK;
  const betHeader = process.env.REACT_APP_HEADER_BET;
  const accAuthorization = {
    "Authorization": process.env.REACT_APP_KEY_ACCOUNT,
  };
  const bankAuthorization = { "Authorization": process.env.REACT_APP_KEY_BANK };
  const betAuthorization = { "Authorization": process.env.REACT_APP_KEY_BET };

  const ctx = useContext(AuthContext);
  const [usersList, setUsersList] = useState([]);
  const [activeUserId, setActiveUserId] = useState(ctx.user.accountID);
  // eslint-disable-next-line no-unused-vars
  const [activeUsername, setActiveUsername] = useState(ctx.user.username);
  const [userFilter, setUserFilter] = useState("0");
  const [filteredList, setFilteredList] = useState([]);
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  });
  const [transactionsList, setTransactionsList] = useState([]);
  const [betList, setBetList] = useState([]);

  useEffect(() => {
    const date = new Date();
    const dateToday = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}`;
    setDateFilter({
      startDate: dateToday,
      endDate: dateToday,
    });
    if (ctx.user.accountType !== 2) {
      getUsersList();
    }

    // Set Initial UserFilter
    if (ctx.accountType === 0) {
      setUserFilter("0");
    } else if (ctx.accountType === 1) {
      setUserFilter("2");
    } else if (ctx.user.accountType === 2) {
      setUserFilter("3");
    } else {
      setUserFilter("9");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getUsersList() {
    let accType = ctx.user.accountType;
    if (accType === "admin") {
      accType = 0;
    } else if (accType === "masteragent") {
      accType = 1;
    } else if (accType === "agent") {
      accType = 2;
    } else if (accType === "player"){
      accType = 3;
    } else {
      accType = 4;
    }

    axios({
      method: "get",
      url: `${accountHeader}/getAccountList/${ctx.user.accountID}/${accType}`,
      headers: accAuthorization,
    })
      .then((res) => {
        const data = res.data.data;
        setUsersList(data);
        setActiveUsername(data[0].username);
        setActiveUserId(data[0].account_id);
        getTransactionsTable(data[0].account_id);
        setFilteredList(data);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function getTransactionsTable(accountId) {
    axios({
      method: "get",
      url: `${bankHeader}/getTransactionHistory/${accountId}/${dateFilter.startDate} 00:00/${dateFilter.endDate} 23:59`,
      headers: bankAuthorization,
    })
      .then((res) => {
        const data = res.data.data;
        setTransactionsList(data);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function getBetTable(accountId) {
    axios({
      method: "get",
      url: `${betHeader}/getBetHistory/${accountId}/${dateFilter.startDate} 00:00/${dateFilter.endDate} 23:59`,
      headers: betAuthorization,
    })
      .then((res) => {
        const data = res.data.data;
        setBetList(data);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function setActiveUser(e) {
    console.log(e.target.value)
    const [accountId, username] = e.target.value.split("-");
    setActiveUserId(accountId);
    setActiveUsername(username);
    
    e.preventDefault();

    
  }

  function handleFilterChange(e) {
    const value = Number(e.target.value);
    console.log(value);
    if (value !== 0 && value !== 9) {
      const x = usersList.filter((user) => user.account_type === value);
      setUserFilter(e.target.value);
      setFilteredList(x);
      if (x.length > 0) {
        setActiveUserId(x[0].account_id);
        setActiveUsername(x[0].username);
        getTransactionsTable(x[0].account_id);
        getBetTable(x[0].account_id);
      }
    } else if (value === 9) {
      setUserFilter(e.target.value);
      setFilteredList([]);
      setActiveUserId(ctx.user.accountID);
      setActiveUsername(ctx.user.username);
      getTransactionsTable(ctx.user.accountID);
      getBetTable(ctx.user.accountID);
    } else {
      setFilteredList(usersList);
      setUserFilter(e.target.value);
      setActiveUserId(usersList[0].account_id);
      setActiveUsername(usersList[0].username);
      getTransactionsTable(usersList[0].account_id);
      getBetTable(usersList[0].account_id);
    }
  }

  function handleDateChange(e) {
    const { value, name } = e.target;
    setDateFilter((prev) => {
      return {
        ...prev,
        [name]: value,
      };
    });
  }

  function handleSearchButton(e) {
    if (dateFilter.startDate === "" || dateFilter.endDate === "") {
      toast.error("Sorry there are no transaction found on your query");
    } else if (ctx.accountType === "player") {
      setActiveUserId(ctx.user.acountID);
      getTransactionsTable(activeUserId);
      getBetTable(activeUserId);
    } else {
      console.log(activeUserId);
      getTransactionsTable(activeUserId);
      getBetTable(activeUserId);
    }
    e.preventDefault();
  }

  function renderChoiceAll() {
    if (ctx.user.accountType === "admin") {
      return (
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            name="inlineRadioOptions"
            value="0"
            onChange={handleFilterChange}
            defaultChecked
          />
          <label className="form-check-label">All</label>
        </div>
      );
    }
  }

  function renderChoiceMasterAgent() {
    if (ctx.user.accountType === "admin") {
      return (
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            name="inlineRadioOptions"
            value="1"
            onChange={handleFilterChange}
          />
          <label className="form-check-label">M. Agent</label>
        </div>
      );
    }
  }

  function renderChoiceAgent() {
    let defaultVal = false;
    if (ctx.user.accountType === "masteragent") {
      defaultVal = true;
    }
    if (
      ctx.user.accountType === "admin" ||
      ctx.user.accountType === "masteragent"
    ) {
      return (
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            name="inlineRadioOptions"
            value="2"
            onChange={handleFilterChange}
            defaultChecked={defaultVal}
          />
          <label className="form-check-label">Agents</label>
        </div>
      );
    }
  }

  function renderChoicePlayer() {
    let defaultVal = false;
    if (ctx.user.accountType === "agent") {
      defaultVal = true;
    }
    if (ctx.user.accountType !== "player") {
      return (
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            name="inlineRadioOptions"
            value="3"
            onChange={handleFilterChange}
            defaultChecked={defaultVal}
          />
          <label className="form-check-label">Player</label>
        </div>
      );
    }
  }

  function renderChoiceSelf() {
    let defaultVal = false;
    if (ctx.user.accountType !== "player") {
      return (
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            name="inlineRadioOptions"
            value="9"
            onChange={handleFilterChange}
            defaultChecked={defaultVal}
          />
          <label className="form-check-label">Self</label>
        </div>
      );
    }
  }

  function renderUserFilterHeading() {
    if (ctx.user.accountType !== "player") {
      return <h4 className="lead smaller-device">User Filter</h4>;
    } else {
      return;
    }
  }

  function renderChoices() {
    return (
      <div>
        <div>
          {renderChoiceAll()}
          {renderChoiceMasterAgent()}
          {renderChoiceAgent()}
          {renderChoicePlayer()}
          {renderChoiceSelf()}
        </div>
      </div>
    );
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

  function renderDateFilter() {
    return (
      <div className="row">
        <h4 className="lead smaller-device">Date Filter</h4>
        <div className="col-md-2">
          <input
            className="date-style form-label"
            type="date"
            name="startDate"
            value={dateFilter.startDate}
            onChange={handleDateChange}
          />
        </div>
        -
        <div className="col-md-2">
          <input
            className="date-style form-label"
            type="date"
            name="endDate"
            value={dateFilter.endDate}
            onChange={handleDateChange}
          />
        </div>
        {ctx.user.accountType === "player" ? renderSearchButton() : null}
      </div>
    );
  }

  function renderSearchButton() {
    return (
      <div className="col-md-2">
        <button
          className="btn btn-color transaction-btn text-light col-xs-12"
          onClick={handleSearchButton}
        >
          Search
        </button>
      </div>
    );
  }

  function renderUserFilter() {
    if (ctx.user.accountType !== "player") {
      return (
        <div className="row">
          <div className="col-md-1">
            <label className="col-form-label">Username</label>
          </div>
          <div className="col-md-2">
            <select className="form-select" onChange={setActiveUser}>
              {filteredList.map((x) => (
                <option
                  key={Math.random()}
                  value={x.account_id + "-" + x.username}
                >
                  {x.username}{" "}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">{renderSearchButton()}</div>
        </div>
      );
    }
  }
  return (
    <div className="container text-light container-transactions">
      <div className="heading-text">
        <h1 className="display-5 small-device bold-small">Transactions</h1>
      </div>
      <form>
        {renderDateFilter()}
        {renderUserFilterHeading()}
        {renderChoices()}
        {renderUserFilter()}
      </form>
      <div className="table-responsive">
        <table className="table table-success table-striped transaction-page-spacing">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Transaction ID</th>
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
                <td>{x.placement_date}</td>
                <td>{x.transaction_id}</td>
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
      {transactionsList.length === 0
        ? renderEmptyTable(true)
        : renderEmptyTable(false)}

      {userFilter === "3" || ctx.user.accountType === "player" ? (
        <div className="table-responsive">
          <table className="table table-success table-striped">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Bet ID</th>
                <th scope="col">Market ID</th>
                <th scope="col">Description</th>
                <th scope="col">Stake</th>
                <th scope="col">Cummulative</th>
                <th scope="col">Status</th>
                <th scope="col">Result</th>
                <th scope="col">Settled Date</th>
              </tr>
            </thead>
            <tbody>
              {betList.map((x) => (
                <tr key={Math.random()}>
                  <td>{x.placement_date.substring(0, 10)}</td>
                  <td>{x.bet_id}</td>
                  <td>{x.market_id}</td>
                  <td>{x.description}</td>
                  <td>₱ {x.stake.toFixed(2)}</td>
                  <td>₱ {x.cummulative ? x.cummulative.toFixed(2) : "-"}</td>
                  <td>{x.status === 0
                          ? "Pending"
                          : x.status === 1
                          ? "Lose"
                          : "Win"}</td>
                  <td>{x.result}</td>
                  <td>{x.settled_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {transactionsList.length === 0 && userFilter === "3"
        ? renderEmptyTable(true)
        : renderEmptyTable(false)}
    </div>
  );
}
