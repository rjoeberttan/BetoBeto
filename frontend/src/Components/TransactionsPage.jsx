import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../store/auth-context";
import { toast, ToastContainer } from "react-toastify";

export default function TransactionsPage() {
  const accountHeader = "http://localhost:4003";
  const bankHeader = "http://localhost:4006";
  const betHeader = "http://localhost:4005";
  const ctx = useContext(AuthContext);
  const [usersList, setUsersList] = useState([]);
  const [activeUserId, setActiveUserId] = useState(ctx.user.accountID);
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
  }, []);

  function getUsersList() {
    let accType = ctx.user.accountType;
    if (accType === "admin"){
      accType=0
    } else if (accType === "masteragent"){
      accType=1
    } else if (accType === "agent"){
      accType=2
    } else {
      accType=3
    }

    axios({
      method: "get",
      url: `${accountHeader}/getAccountList/${ctx.user.accountID}/${accType}`,
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
      headers: {
        "Authorization": "h75*^*3DWwHFb4$V",
      },
    })
      .then((res) => {
        const data = res.data.data;
        console.log(data);
        setBetList(data);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function setActiveUser(e) {
    const [accountId, username] = e.target.value.split("-");
    setActiveUserId(accountId);
    setActiveUsername(username);
    e.preventDefault();
  }

  function handleFilterChange(e) {
    const value = Number(e.target.value);
    setUserFilter(value)
    if ((value !== 0) || (value !== 9)) {
      const x = usersList.filter((user) => user.account_type === value);
      setUserFilter(e.target.value);
      setFilteredList(x);
      if (x.length > 0){
        setActiveUserId(x[0].account_id);
        setActiveUsername(x[0].username);
        getTransactionsTable(x[0].account_id)
      }
    } else if (value === 9) {
      setActiveUserId(ctx.user.accountID);
      setActiveUsername(ctx.user.username);
      getTransactionsTable(ctx.user.accountID)
    } 
    else {
      setFilteredList(usersList);
      setUserFilter(e.target.value);
      setActiveUserId(usersList[0].account_id);
      setActiveUsername(usersList[0].username);
      getTransactionsTable(usersList[0].account_id)
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
      toast.error('Sorry there are no transaction found on your query')
    }  
    else if (ctx.accountType === "player") {
      setActiveUserId(ctx.user.acountID)
      getTransactionsTable(activeUserId);
      getBetTable(activeUserId)
    } else {
      getTransactionsTable(activeUserId);
      getBetTable(activeUserId)
    }
    e.preventDefault();
  }


  function renderChoiceAll(){
    if (ctx.user.accountType === "admin"){
      return(
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
      )
    }
  }

  function renderChoiceMasterAgent(){

    if (ctx.user.accountType === "admin"){
      return(
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
      )
    }
  }

  function renderChoiceAgent(){
    let defaultVal = false;
    if (ctx.user.accountType === "masteragent"){
      defaultVal = true
    }
    if ((ctx.user.accountType === "admin") || (ctx.user.accountType === "masteragent")){
      return(
        <div class="form-check form-check-inline">
            <input
              class="form-check-input"
              type="radio"
              name="inlineRadioOptions"
              value="2"
              onChange={handleFilterChange}
              defaultChecked={defaultVal}
            />
            <label class="form-check-label">Agents</label>
        </div>
      )
    }
  }

  function renderChoicePlayer(){
    let defaultVal = false;
    if (ctx.user.accountType === "agent"){
      defaultVal = true
    }
    if (ctx.user.accountType !== "player"){
      return(
        <div class="form-check form-check-inline">
          <input
            class="form-check-input"
            type="radio"
            name="inlineRadioOptions"
            value="3"
            onChange={handleFilterChange}
            defaultChecked={defaultVal}
          />
          <label class="form-check-label">Player</label>
        </div>
      )
    }
  }

  function renderChoiceSelf(){
    let defaultVal = false;
    if (ctx.user.accountType !== "player"){
      return(
        <div class="form-check form-check-inline">
          <input
            class="form-check-input"
            type="radio"
            name="inlineRadioOptions"
            value="9"
            onChange={handleFilterChange}
            defaultChecked={defaultVal}
          />
          <label class="form-check-label">Self</label>
        </div>
      )
    } 
  }

  function renderUserFilterHeading() {
    if (ctx.user.accountType !== "player") {
      return (<h4 className="lead smaller-device">User Filter</h4>)
    } else {
      return;
    }
  }

  function renderChoices(){
    return (
      <div>
        <div classname="row">         
          {renderChoiceAll()}
          {renderChoiceMasterAgent()}
          {renderChoiceAgent()}
          {renderChoicePlayer()}  
          {renderChoiceSelf()}         
        </div>
      </div>
    )
  }

  function renderEmptyTable(value){
    if (value){
      return (
        <div> 
          <h3>No Transactions within Time Range</h3>
        </div>
      )
    } else {
      return
    }
  }

  function renderDateFilter(){
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
          {ctx.user.accountType === "player" ? renderSearchButton(): null}
        </div>
      )
  }

  function renderSearchButton(){
    return (
      <div className="col-md-2">
        <button
          className="btn btn-color transaction-btn text-light col-xs-12"
          onClick={handleSearchButton}
        >
          Search
        </button>
      </div>
    )
  }

  function renderUserFilter() {
    if (ctx.user.accountType !== "player"){
      return (
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
        {renderSearchButton()}
      </div>   
      </div>
      )
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
      {transactionsList.length === 0 ? renderEmptyTable(true): renderEmptyTable(false) }
      
      {(userFilter === "3" || (ctx.user.accountType === "player")) ? 
       ( <table class="table table-success table-striped">
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
              <tr>
                <td>{x.placement_date.substring(0, 10)}</td>
                <td>{x.bet_id}</td>
                <td>{x.market_id}</td>
                <td>{x.description}</td>
                <td>₱ {x.stake.toFixed(2)}</td>
                <td>₱ {x.cummulative ? x.cummulative.toFixed(2) : "-"}</td>
                <td>{x.status === 1 ? "Settled" : "Pending"}</td>
                <td>{x.result}</td>
                <td>{x.settled_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        ): null
      }
      {(transactionsList.length === 0) && (userFilter === "3")? renderEmptyTable(true): renderEmptyTable(false) }


    </div>
  );
}
