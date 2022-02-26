import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../store/auth-context";
import { toast } from "react-toastify";
import Select from "react-select";
import Switch from "react-switch";

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
  const [originalTrans, setOriginalTrans] = useState([]);
  const [betList, setBetList] = useState([]);
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1)
  const [paginatedPosts, setPaginatedPosts] = useState([]);
  const [switchChecked, setSwitchChecked] = useState(false);
  const [BetPages, setBetPages] = useState([]);
  const [currentBetPage, setCurrentBetPage] = useState(1)
  const [paginatedBets, setPaginatedBets] = useState([]);
  
  

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

    //HandleAllUserSearch
    console.log(dateFilter.startDate, dateFilter.endDate)
    axios({
      method: "get",
      url: `${bankHeader}/getAllTransactionHistory/${ctx.user.accountID}/${ctx.user.accountType}/2021-01-01 00:00/2030-12-31 23:59`,
      headers: bankAuthorization,
    })
      .then((res) => {
        const data = res.data.data;
        console.log(data);
        setTransactionsList(data);
        setOriginalTrans(data)

        // Calculated Pages
        const pageSize = 50;
        const pageCount = data? Math.ceil(data.length/pageSize) : 0;
        var pages = [];
        for (var i = 1; i<= pageCount; i++){
          pages.push(i)
        }
        setPages(pages)

        const pageNo = 1
        setCurrentPage(1);
        const startIndex = (pageNo - 1) * pageSize    
        const endIndex = (pageNo * pageSize)
        const newTransactions = data.slice(startIndex, endIndex)
        setPaginatedPosts(newTransactions)
      })
      .catch((err) => {
        console.log(err);
      });
    
    axios({
        method: "get",
        url: `${betHeader}/getAllBetHistory/${ctx.user.accountID}/${ctx.user.accountType}/2021-01-01 00:00/2030-12-31 23:59`,
        headers: betAuthorization,
      })
        .then((res) => {
          const data = res.data.data;
          setBetList(data);
          // Calculated Pages
          const pageSize = 50;
          const pageCount = data? Math.ceil(data.length/pageSize) : 0;
          var pages = [];
          for (var i = 1; i<= pageCount; i++){
            pages.push(i)
          }
          setBetPages(pages)


          const pageNo = 1
          setCurrentBetPage(1);
          const startIndex = (pageNo - 1) * pageSize    
          const endIndex = (pageNo * pageSize)
          const newTransactions = data.slice(startIndex, endIndex)
          setPaginatedBets(newTransactions)
        })
        .catch((err) => {
          console.log(err);
        });
      setUserFilter("3");



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
    } else if (accType === "player") {
      accType = 3;
    } else if (accType === "grandmaster") {
      accType = 5;
    }
    else {
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
        // getTransactionsTable(data[0].account_id);
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
        console.log(res.data.data);
        const data = res.data.data;
        setTransactionsList(data);

        // Calculated Pages
        const pageSize = 50;
        const pageCount = data? Math.ceil(data.length/pageSize) : 0;
        var pages = [];
        for (var i = 1; i<= pageCount; i++){
          pages.push(i)
        }
        setPages(pages)


        const pageNo = 1
        setCurrentPage(1);
        const startIndex = (pageNo - 1) * pageSize    
        const endIndex = (pageNo * pageSize)
        const newTransactions = data.slice(startIndex, endIndex)
        setPaginatedPosts(newTransactions)
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
        // Calculated Pages
        const pageSize = 50;
        const pageCount = data? Math.ceil(data.length/pageSize) : 0;
        var pages = [];
        for (var i = 1; i<= pageCount; i++){
          pages.push(i)
        }
        setBetPages(pages)


        const pageNo = 1
        setCurrentBetPage(1);
        const startIndex = (pageNo - 1) * pageSize    
        const endIndex = (pageNo * pageSize)
        const newTransactions = data.slice(startIndex, endIndex)
        setPaginatedBets(newTransactions)
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function setActiveUser(e) {
    const [accountId, username] = e.value.split("-");
    setActiveUserId(accountId);
    setActiveUsername(username);
  }

  function handleFilterChange(e) {
    const value = Number(e.target.value);
    setSwitchChecked(false)
    console.log("gere")
    setTransactionsList([])
    setPaginatedPosts([])
    setBetList([])
    setCurrentPage(1)
    if (value !== 0 && value !== 9) {
      const x = usersList.filter((user) => user.account_type === value);
      setUserFilter(e.target.value);
      setFilteredList(x);
      // if (x.length > 0) {
      //   setActiveUserId(x[0].account_id);
      //   setActiveUsername(x[0].username);
      //   getTransactionsTable(x[0].account_id);
      //   getBetTable(x[0].account_id);
      // }
    } else if (value === 9) {
      setUserFilter(e.target.value);
      setFilteredList([]);
      setActiveUserId(ctx.user.accountID);
      setActiveUsername(ctx.user.username);
      // getTransactionsTable(ctx.user.accountID);
      // getBetTable(ctx.user.accountID);
    } else {
      setFilteredList(usersList);
      setUserFilter(e.target.value);
      setActiveUserId(usersList[0].account_id);
      setActiveUsername(usersList[0].username);
      // getTransactionsTable(usersList[0].account_id);
      // getBetTable(usersList[0].account_id);
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
    setSwitchChecked(false)

    
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
    if (ctx.user.accountType === "admin" || ctx.user.accountType === "grandmaster") {
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

  function renderChoiceGrandMaster() {
    if (ctx.user.accountType === "admin") {
      return (
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            name="inlineRadioOptions"
            value="5"
            onChange={handleFilterChange}
          />
          <label className="form-check-label">Grand Master</label>
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
      ctx.user.accountType === "masteragent" || ctx.user.accountType === "grandmaster"
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
      return <h4 className="lead smaller-device">Username Filter</h4>;
    } else {
      return;
    }
  }

  function renderChoices() {
    return (
      <div>
        <div>
          {renderChoiceAll()}
          {renderChoiceGrandMaster()}
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

  function handleAllUserSearch(e) {
    console.log(dateFilter.startDate, dateFilter.endDate)
    setSwitchChecked(false)
    axios({
      method: "get",
      url: `${bankHeader}/getAllTransactionHistory/${ctx.user.accountID}/${ctx.user.accountType}/2021-01-01 00:00/2030-12-31 23:59`,
      headers: bankAuthorization,
    })
      .then((res) => {
        const data = res.data.data;
        console.log(data);
        setTransactionsList(data);

        // Calculated Pages
        const pageSize = 50;
        const pageCount = data? Math.ceil(data.length/pageSize) : 0;
        var pages = [];
        for (var i = 1; i<= pageCount; i++){
          pages.push(i)
        }
        setPages(pages)

        const pageNo = 1
        setCurrentPage(1);
        const startIndex = (pageNo - 1) * pageSize    
        const endIndex = (pageNo * pageSize)
        const newTransactions = data.slice(startIndex, endIndex)
        setPaginatedPosts(newTransactions)
      })
      .catch((err) => {
        console.log(err);
      });
    
    axios({
        method: "get",
        url: `${betHeader}/getAllBetHistory/${ctx.user.accountID}/${ctx.user.accountType}/2021-01-01 00:00/2030-12-31 23:59`,
        headers: betAuthorization,
      })
        .then((res) => {
          const data = res.data.data;
          setBetList(data);
          // Calculated Pages
          const pageSize = 50;
          const pageCount = data? Math.ceil(data.length/pageSize) : 0;
          var pages = [];
          for (var i = 1; i<= pageCount; i++){
            pages.push(i)
          }
          setBetPages(pages)


          const pageNo = 1
          setCurrentBetPage(1);
          const startIndex = (pageNo - 1) * pageSize    
          const endIndex = (pageNo * pageSize)
          const newTransactions = data.slice(startIndex, endIndex)
          setPaginatedBets(newTransactions)
        })
        .catch((err) => {
          console.log(err);
        });
      setUserFilter("3");

    e.preventDefault();
  }

  function handleGMUserSearch(e) {
    setSwitchChecked(false)
    axios({
      method: "get",
      url: `${bankHeader}/getAllTransactionHistory/${ctx.user.accountID}/${ctx.user.accountType}/2021-01-01 00:00/2030-12-31 23:59`,
      headers: bankAuthorization,
    })
      .then((res) => {
        const data = res.data.data;
        var newArr = data.filter((el) => {
          return el.account_type === 5;
        });
        setTransactionsList(newArr);
        setBetList([])

        // Calculated Pages
        const pageSize = 50;
        const pageCount = newArr? Math.ceil(newArr.length/pageSize) : 0;
        var pages = [];
        for (var i = 1; i<= pageCount; i++){
          pages.push(i)
        }
        setPages(pages)


        const pageNo = 1
        setCurrentPage(1);
        const startIndex = (pageNo - 1) * pageSize    
        const endIndex = (pageNo * pageSize)
        const newTransactions = newArr.slice(startIndex, endIndex)
        setPaginatedPosts(newTransactions)
      })
      .catch((err) => {
        console.log(err);
      });

    e.preventDefault();
  }

  function handleMAUserSearch(e) {
    setSwitchChecked(false)
    axios({
      method: "get",
      url: `${bankHeader}/getAllTransactionHistory/${ctx.user.accountID}/${ctx.user.accountType}/2021-01-01 00:00/2030-12-31 23:59`,
      headers: bankAuthorization,
    })
      .then((res) => {
        const data = res.data.data;
        console.log(data)
        var newArr = data.filter((el) => {
          return el.account_type === 1;
        });
        setTransactionsList(newArr);
        setBetList([])

        // Calculated Pages
        const pageSize = 50;
        const pageCount = newArr? Math.ceil(newArr.length/pageSize) : 0;
        var pages = [];
        for (var i = 1; i<= pageCount; i++){
          pages.push(i)
        }
        setPages(pages)


        const pageNo = 1
        setCurrentPage(1);
        const startIndex = (pageNo - 1) * pageSize    
        const endIndex = (pageNo * pageSize)
        const newTransactions = newArr.slice(startIndex, endIndex)
        setPaginatedPosts(newTransactions)
      })
      .catch((err) => {
        console.log(err);
      });

    e.preventDefault();
  }

  function handleAgentUserSearch(e) {
    setSwitchChecked(false)
    axios({
      method: "get",
      url: `${bankHeader}/getAllTransactionHistory/${ctx.user.accountID}/${ctx.user.accountType}/2021-01-01 00:00/2030-12-31 23:59`,
      headers: bankAuthorization,
    })
      .then((res) => {
        const data = res.data.data;
        var newArr = data.filter((el) => {
          return el.account_type === 2;
        });
        setTransactionsList(newArr);
        setBetList([])

        // Calculated Pages
        const pageSize = 50;
        const pageCount = newArr? Math.ceil(newArr.length/pageSize) : 0;
        var pages = [];
        for (var i = 1; i<= pageCount; i++){
          pages.push(i)
        }
        setPages(pages)


        const pageNo = 1
        setCurrentPage(1);
        const startIndex = (pageNo - 1) * pageSize    
        const endIndex = (pageNo * pageSize)
        const newTransactions = newArr.slice(startIndex, endIndex)
        setPaginatedPosts(newTransactions)
      })
      .catch((err) => {
        console.log(err);
      });

    e.preventDefault();
  }

  function handlePlayerUserSearch(e) {
    setSwitchChecked(false)
    axios({
      method: "get",
      url: `${bankHeader}/getAllTransactionHistory/${ctx.user.accountID}/${ctx.user.accountType}/2021-01-01 00:00/2030-12-31 23:59`,
      headers: bankAuthorization,
    })
      .then((res) => {
        const data = res.data.data;
        var newArr = data.filter((el) => {
          return el.account_type === 3;
        });
        setTransactionsList(newArr);
        setUserFilter("3");

        // Calculated Pages
        const pageSize = 50;
        const pageCount = newArr? Math.ceil(newArr.length/pageSize) : 0;
        var pages = [];
        for (var i = 1; i<= pageCount; i++){
          pages.push(i)
        }
        setPages(pages)


        const pageNo = 1
        setCurrentPage(1);
        const startIndex = (pageNo - 1) * pageSize    
        const endIndex = (pageNo * pageSize)
        const newTransactions = newArr.slice(startIndex, endIndex)
        setPaginatedPosts(newTransactions)
      })
      .catch((err) => {
        console.log(err);
      });

    axios({
      method: "get",
      url: `${betHeader}/getAllBetHistory/${ctx.user.accountID}/${ctx.user.accountType}/2021-01-01 00:00/2030-12-31 23:59`,
      headers: betAuthorization,
    })
      .then((res) => {
        const data = res.data.data;
        setBetList(data);
        
        // Calculated Pages
        const pageSize = 50;
        const pageCount = data? Math.ceil(data.length/pageSize) : 0;
        var pages = [];
        for (var i = 1; i<= pageCount; i++){
          pages.push(i)
        }
        setBetPages(pages)


        const pageNo = 1
        setCurrentBetPage(1);
        const startIndex = (pageNo - 1) * pageSize    
        const endIndex = (pageNo * pageSize)
        const newTransactions = data.slice(startIndex, endIndex)
        setPaginatedBets(newTransactions)
      })
      .catch((err) => {
        console.log(err);
      });
    setUserFilter("3");
    e.preventDefault();
  }

  function renderAllUserSearch() {
    if (ctx.user.accountType === "admin" || ctx.user.accountType === "grandmaster" || ctx.user.accountType === "masteragent") {
      return (
        <div className="col-md-2 col-6" style={{ marginBottom: "10px" }}>
          <button
            className="btn btn-color transaction-btn text-light col-xs-12"
            onClick={handleAllUserSearch}
          >
            Search All Users
          </button>
        </div>
      );
    }
  }

  function renderGMUserSearch() {
    if (ctx.user.accountType === "admin") {
      return (
        <div className="col-md-2 col-6" style={{ marginBottom: "10px" }}>
          <button
            className="btn btn-color transaction-btn text-light col-xs-12"
            onClick={handleGMUserSearch}
          >
            Search GM Users
          </button>
        </div>
      );
    }
  }

  function renderMAUserSearch() {
    if (
      ctx.user.accountType === "admin" ||
      ctx.user.accountType === "grandmaster"
    ) {
      return (
        <div className="col-md-2 col-6" style={{ marginBottom: "10px" }}>
          <button
            className="btn btn-color transaction-btn text-light col-xs-12"
            onClick={handleMAUserSearch}
          >
            Search MA Users
          </button>
        </div>
      );
    }
  }

  function renderAgentUserSearch() {
    if (ctx.user.accountType === "admin" || ctx.user.accountType === "grandmaster" || ctx.user.accountType === "masteragent" ) {
      return (
        <div className="col-md-2 col-6">
          <button
            className="btn btn-color transaction-btn text-light col-xs-12"
            onClick={handleAgentUserSearch}
          >
            Search Agent Users
          </button>
        </div>
      );
    }
  }

  function renderPlayerUserSearch() {
    if (ctx.user.accountType !== "player") {
      return (
        <div className="col-md-2 col-6">
          <button
            className="btn btn-color transaction-btn text-light col-xs-12"
            onClick={handlePlayerUserSearch}
          >
            Search Player Users
          </button>
        </div>
      );
    }
  }

  function renderExcludeTransactionList() {
    console.log(ctx.user.accountType)
    if (ctx.user.accountType === "admin" || ctx.user.accountType === "grandmaster" || ctx.user.accountType === "masteragent") {
      return (
        <div className="col-md-2 col-6">
          <h4 className="lead smaller-device">Exclude Commissions?</h4>
          <Switch checked={switchChecked} onChange={handleTransSwitch} className="react-switch" height={20} handleDiameter={19}/>
        </div>
      );
    } else {
      return null;
    }
  }

  function renderUserFilter() {
    const colorStyles = {
      option: (provided, state) => ({
        ...provided,
        color: "black",
      }),
    };

    const options = [];
    filteredList.map((x) => {
      options.push({
        value: x.account_id + "-" + x.username,
        label: x.username,
      });
    });
    if (ctx.user.accountType !== "player") {
      return (
        <div className="row">
          <div className="col-md-1">
            <label className="col-form-label">Username</label>
          </div>
          <div className="col-md-2">
            <Select
              onChange={setActiveUser}
              options={options}
              styles={colorStyles}
            ></Select>
          </div>
          <div className="col-md-2">{renderSearchButton()}</div>
        </div>
      );
    }
  }

 function handleTransSwitch(e){
    setSwitchChecked(e)

    if (e){
      var withoutCommission = transactionsList.filter((el) => {
        return el.transaction_type !== 6
      })
      // Calculated Pages
      const pageSize = 50;
      const pageCount = withoutCommission? Math.ceil(withoutCommission.length/pageSize) : 0;
      var pages = [];
      for (var i = 1; i<= pageCount; i++){
        pages.push(i)
      }
      setPages(pages)


      const pageNo = 1
      setCurrentPage(1);
      const startIndex = (pageNo - 1) * pageSize    
      const endIndex = (pageNo * pageSize)
      const newTransactions = withoutCommission.slice(startIndex, endIndex)
      setPaginatedPosts(newTransactions)
    } else {
      // Calculated Pages
      const pageSize = 50;
      const pageCount = transactionsList? Math.ceil(transactionsList.length/pageSize) : 0;
      var pages = [];
      for (var i = 1; i<= pageCount; i++){
        pages.push(i)
      }
      setPages(pages)


      const pageNo = 1
      setCurrentPage(1);
      const startIndex = (pageNo - 1) * pageSize    
      const endIndex = (pageNo * pageSize)
      const newTransactions = transactionsList.slice(startIndex, endIndex)
      setPaginatedPosts(newTransactions)

    }

  }

  function pagination(command) {
    var pageNo = currentPage
    if (command === "first") {
      setCurrentPage(1)
      pageNo = 1
    } else if (command === "next" && currentPage < pages.length){
      setCurrentPage(currentPage + 1)
      pageNo = currentPage + 1
    } else if (command === "prev" && currentPage !== 1){
      setCurrentPage(currentPage - 1)
      pageNo = currentPage - 1
    } else if (command === "last" ){
      setCurrentPage(pages.length)
      pageNo = pages.length
    }


    const pageSize = 50
    const startIndex = (pageNo - 1) * pageSize    
    const endIndex = (pageNo * pageSize)
    const newTransactions = transactionsList.slice(startIndex, endIndex)
    setPaginatedPosts(newTransactions)
  }

  function betPagination(command){
    var pageNo = currentBetPage
    if (command === "first") {
      setCurrentBetPage(1)
      pageNo = 1
    } else if (command === "next" && currentBetPage < BetPages.length){
      setCurrentBetPage(currentBetPage + 1)
      pageNo = currentBetPage + 1
    } else if (command === "prev" && currentBetPage !== 1){
      setCurrentBetPage(currentBetPage - 1)
      pageNo = currentBetPage - 1
    } else if (command === "last" ){
      setCurrentBetPage(BetPages.length)
      pageNo = BetPages.length
    }

    const pageSize = 50
    const startIndex = (pageNo - 1) * pageSize    
    const endIndex = (pageNo * pageSize)
    const newTransactions = betList.slice(startIndex, endIndex)
    setPaginatedBets(newTransactions)
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
        <h4 className="lead smaller-device">Type Filter</h4>
        <div className="row" style={{ marginTop: "10px" }}>
          {renderAllUserSearch()}
          {renderGMUserSearch()}
          {renderMAUserSearch()}
          {renderAgentUserSearch()}
          {renderPlayerUserSearch()}
        </div>
        {renderExcludeTransactionList()}
      </form>
      
      <div className="table-responsive">

        <div className="d-flex justify-content-center">
          <nav>
            <ul className="pagination">
                <li className = "page-item"><p className="page-link" onClick={ () => pagination("first")}> &lt;&lt; </p> </li>
                <li className = "page-item"><p className="page-link" onClick={ () => pagination("prev")}> &lt; </p> </li>
                <li className = "page-item"><p className="page-link"> {currentPage}/{pages.length} </p> </li>
                <li className = "page-item"><p className="page-link" onClick={ () => pagination("next")}> &gt; </p> </li>
                <li className = "page-item"><p className="page-link" onClick={ () => pagination("last")}> &gt;&gt; </p> </li>
            </ul>
          </nav>
        </div>

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
            {paginatedPosts.map((x) => (
              <tr key={Math.random()}>
                {/* <td>{x.placement_date}</td> */}
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
      {transactionsList.length === 0
        ? renderEmptyTable(true)
        : renderEmptyTable(false)}

      {userFilter === "3" || ctx.user.accountType === "player" ? (
        <div className="table-responsive">

          <div className="d-flex justify-content-center">
            <nav>
              <ul className="pagination">
                  <li className = "page-item"><p className="page-link" onClick={ () => betPagination("first")}> &lt;&lt; </p> </li>
                  <li className = "page-item"><p className="page-link" onClick={ () => betPagination("prev")}> &lt; </p> </li>
                  <li className = "page-item"><p className="page-link"> {currentBetPage}/{BetPages.length} </p> </li>
                  <li className = "page-item"><p className="page-link" onClick={ () => betPagination("next")}> &gt; </p> </li>
                  <li className = "page-item"><p className="page-link" onClick={ () => betPagination("last")}> &gt;&gt; </p> </li>
              </ul>
            </nav>
          </div>

          <table className="table table-success table-striped">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Bet ID</th>
                <th scope="col">Username/Account ID</th>
                <th scope="col">Market ID</th>
                <th scope="col">Description</th>
                <th scope="col">Stake</th>
                <th scope="col">Winnings</th>
                <th scope="col">Cummulative</th>
                <th scope="col">Status</th>
                <th scope="col">Result</th>
                <th scope="col">Settled Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBets.map((x) => (
                <tr key={Math.random()}>
                  <td>{new Date(Date.parse(x.placement_date)).toLocaleString(('en-us', {timeZone : 'Asia/Taipei'}))}</td>
                  <td>{x.bet_id}</td>
                  <td>{!x.username ? x.account_id : x.username}</td>
                  <td>{x.market_id}</td>
                  <td>{x.description}</td>
                  <td>₱ {x.stake.toFixed(2)}</td>
                  <td>₱ {x.winnings === null ? 0.00 : x.winnings.toFixed(2)}</td>
                  <td>₱ {x.cummulative ? x.cummulative.toFixed(2) : "-"}</td>
                  <td>
                    {x.status === 0
                      ? "Pending"
                      : x.status === 1
                      ? "Lose"
                      : "Win"}
                  </td>
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
