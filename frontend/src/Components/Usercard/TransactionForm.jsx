import React from "react";
import {useState, useContext} from "react";
import { toast } from "react-toastify";
import axios from "axios";

export default function TransactionForm (props){
    const bankHeader = process.env.REACT_APP_HEADER_BANK;
    const betHeader = process.env.REACT_APP_HEADER_BET;
    const bankAuthorization = { "Authorization": process.env.REACT_APP_KEY_BANK };
    const betAuthorization = { "Authorization": process.env.REACT_APP_KEY_BET };
    const [dateFilter, setDateFilter] = useState({
        startDate: "",
        endDate: "",
    });
    const [transactionsList, setTransactionsList] = useState([]);
    const [betList, setBetList] = useState([]);
    const [pages, setPages] = useState([]);
    const [currentPage, setCurrentPage] = useState(1)
    const [BetPages, setBetPages] = useState([]);
    const [currentBetPage, setCurrentBetPage] = useState(1)
    const [paginatedBets, setPaginatedBets] = useState([]);
    const [paginatedPosts, setPaginatedPosts] = useState([]);
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
          } else {
            getTransactionsTable(props.accountId);
            getBetTable(props.accountId);
          }
          e.preventDefault();
    }

    function getTransactionsTable(accountId) {
        axios({
          method: "get",
          url: `${bankHeader}/getTransactionHistory/${accountId}/${dateFilter.startDate} 00:00/${dateFilter.endDate} 23:59`,
          headers: bankAuthorization,
        })
          .then((res) => {
            console.log(res.data.data, "transactionlist");
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

    return (
        <form>
        <div className="">
            <h4 className="lead smaller-device">Date Filter</h4>
            <div className="col-md-2" style={{display:"inline"}}>
              <input
                className="date-style form-label"
                type="date"
                name="startDate"
                value={dateFilter.startDate}
                onChange={handleDateChange}
              />
            </div>
            -
            <div className="col-md-2" style={{display:"inline"}}>
              <input
                className="date-style form-label"
                type="date"
                name="endDate"
                value={dateFilter.endDate}
                onChange={handleDateChange}
              />
            </div>
            <div className="col-md-2" style={{display:"inline", marginLeft:"3px"}}>
                <button
                className="btn btn-color transaction-btn text-light col-xs-12"
                onClick={handleSearchButton}
                >
                Search
                </button>
            </div>
          </div>
          <div className="table-responsive">

            <div className="d-flex justify-content-center">
            <nav>
                <ul className="pagination">
                    <li className = "page-item"><p className="page-link" onClick={ () => pagination("first")}> &lt;&lt; </p> </li>
                    <li className = "page-item"><p className="page-link" onClick={ () => pagination("prev")}> &lt; </p> </li>
                    <li className = "page-item"><p className="page-link"> {currentPage} </p> </li>
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

        <div className="table-responsive">

          <div className="d-flex justify-content-center">
            <nav>
              <ul className="pagination">
                  <li className = "page-item"><p className="page-link" onClick={ () => betPagination("first")}> &lt;&lt; </p> </li>
                  <li className = "page-item"><p className="page-link" onClick={ () => betPagination("prev")}> &lt; </p> </li>
                  <li className = "page-item"><p className="page-link"> {currentBetPage} </p> </li>
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
      {transactionsList.length === 0
        ? renderEmptyTable(true)
        : renderEmptyTable(false)}
      </form>
    )
}