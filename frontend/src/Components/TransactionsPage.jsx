import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../store/auth-context";

export default function TransactionsPage() {
  const ctx = useContext(AuthContext);
  const [usersList, setUsersList] = useState([]);
  const [activeUserId, setActiveUserId] = useState("");
  const [activeUsername, setActiveUsername] = useState("");
  const accountHeader = "http://localhost:4003";
  const bankHeader = "http://localhost:4006";
  const [userFilter, setUserFilter] = useState("0");
  const [filteredList, setFilteredList] = useState([]);
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  });
  const [transactionsList, setTransactionsList] = useState([]);

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
  }, []);

  function getUsersList() {
    axios({
      method: "get",
      url: `${accountHeader}/getAccountList/${ctx.user.accountID}/0`,
      headers: {
        "Authorization": "uKRd;$SuXd8b$MFX",
      },
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
      headers: {
        "Authorization": "[9@kw7L>F86_P](p",
      },
    })
      .then((res) => {
        const data = res.data.data;
        console.log(data);
        setTransactionsList(data);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function setActiveUser(e) {
    const [accountId, username] = e.target.value.split("-");
    // console.log(accountId, username)
    setActiveUserId(accountId);
    setActiveUsername(username);
    e.preventDefault();
  }

  function handleFilterChange(e) {
    const value = Number(e.target.value);
    console.log(value);
    if (value !== 0) {
      const x = usersList.filter((user) => user.account_type === value);
      setUserFilter(e.target.value);
      setFilteredList(x);
    } else {
      console.log("gegege");
      setFilteredList(usersList);
      setUserFilter(e.target.value);
    }
  }

  function handleDateChange(e) {
    const { value, name } = e.target;
    console.log(name);
    console.log(value);
    setDateFilter((prev) => {
      return {
        ...prev,
        [name]: value,
      };
    });
    console.log(dateFilter);
  }

  function handleSearchButton(e) {
    if (dateFilter.startDate === "" || dateFilter.endDate === "") {
      alert("wala kang date");
    } else {
      getTransactionsTable(activeUserId);
    }
    e.preventDefault();
  }

  return (
    <div className="container text-light container-transactions">
      <div className="heading-text">
        <h1 className="display-5 small-device bold-small">Transactions</h1>
      </div>
      <form>
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
        </div>
        <div classname="row">
          <h4 className="lead smaller-device">User Filter</h4>
          <div class="form-check form-check-inline">
            <input
              class="form-check-input"
              type="radio"
              name="inlineRadioOptions"
              value="0"
              onChange={handleFilterChange}
              defaultChecked
            />
            <label class="form-check-label">All</label>
          </div>
          <div class="form-check form-check-inline">
            <input
              class="form-check-input"
              type="radio"
              name="inlineRadioOptions"
              value="1"
              onChange={handleFilterChange}
            />
            <label class="form-check-label">M. Agent</label>
          </div>
          <div class="form-check form-check-inline">
            <input
              class="form-check-input"
              type="radio"
              name="inlineRadioOptions"
              value="2"
              onChange={handleFilterChange}
            />
            <label class="form-check-label">Agents</label>
          </div>
          <div class="form-check form-check-inline">
            <input
              class="form-check-input"
              type="radio"
              name="inlineRadioOptions"
              value="3"
              onChange={handleFilterChange}
            />
            <label class="form-check-label">Player</label>
          </div>
        </div>
        <div className="row">
          <div className="col-md-1">
            <label className="col-form-label">Username</label>
          </div>
          <div className="col-md-2">
            <select class="form-select" onChange={setActiveUser}>
              {filteredList.map((x) => (
                <option value={x.account_id + "-" + x.username}>
                  {x.username}{" "}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <button
              className="btn btn-color transaction-btn text-light col-xs-12"
              onClick={handleSearchButton}
            >
              Search
            </button>
          </div>
        </div>
      </form>
      <table class="table table-success table-striped">
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
            <tr>
              <td>{x.placement_date.substring(0, 10)}</td>
              <td>{x.transaction_id}</td>
              <td>{x.description}</td>
              <td>₱ {x.amount.toFixed(2)}</td>
              <td>₱ {x.cummulative ? x.cummulative.toFixed(2) : "-"}</td>
              <td>{x.status === 1 ? "Settled" : "Pending"}</td>
              <td>{x.settled_by}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
