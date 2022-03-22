import React, { useEffect, useContext } from "react";
import { useState } from "react";
import {Button, Modal} from 'react-bootstrap';
import { AuthContext } from "../../store/auth-context";
import axios from "axios";
import { toast } from "react-toastify";
import "./Modal.css"


export default function ShowCommissionsModal(props){
  const [show, setShow] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  });
  const accountId = props.accountId
  const accountType = props.accountType
  const ctx = useContext(AuthContext);
  const bankHeader = process.env.REACT_APP_HEADER_BANK;
  const bankAuthorization = { "Authorization": process.env.REACT_APP_KEY_BANK };
  const accountHeader = process.env.REACT_APP_HEADER_ACCOUNT;
  const [usersList, setUsersList] = useState([]);
  const [transactionsList, setTransactionsList] = useState([]);
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1)
  const [paginatedPosts, setPaginatedPosts] = useState([]);
  const [commission, setCommission] = useState(0);

  useEffect(() => {

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  function handleDateChange(e) {
    const { value, name } = e.target;
    setDateFilter((prev) => {
      return {
        ...prev,
        [name]: value,
      };
    });
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


        var totalCommission = 0
        var commissionsOnly = data.filter((el) => {
          if (el.transaction_type === 6) {
            totalCommission = totalCommission + el.amount
          }
          return el.transaction_type === 6
        })
        setCommission(totalCommission)

        // Calculated Pages
        const pageSize = 50;
        const pageCount = commissionsOnly ? Math.ceil(data.length/pageSize) : 0;
        var pages = [];
        for (var i = 1; i<= pageCount; i++){
          pages.push(i)
        }
        setPages(pages)


        const pageNo = 1
        setCurrentPage(1);
        const startIndex = (pageNo - 1) * pageSize    
        const endIndex = (pageNo * pageSize)
        const newTransactions = commissionsOnly.slice(startIndex, endIndex)
        setPaginatedPosts(newTransactions)
        setTransactionsList(commissionsOnly);

      })
      .catch((err) => {
        console.log(err);
      });
  }

  function handleSearchButton(e) {
    if (dateFilter.startDate === "" || dateFilter.endDate === "") {
        toast.error("Sorry there are no transaction found on your query");
    } else {
      getTransactionsTable(accountId)
    }
    e.preventDefault();
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

  return (
      <div className="text-center" style={{marginTop: "2px"}}>
      {props.accountType !== "3" ? 
        <Button variant="primary" className="btn btn-color register-btn text-light" style={{border: "0px", borderRadius: "20px"}} onClick={() => setShow(true)}>
          Show Commissions
        </Button> : null 
      }
    <Modal
      show={show}
      onHide={() => setShow(false)}
      dialogClassName="modal-90w"
      aria-labelledby="example-custom-modal-styling-title"
    >
      <Modal.Header closeButton>
        <Modal.Title id="example-modal-sizes-title-lg">
         {props.username} - Commissions
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
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
          <h4 className="lead smaller-device">Total Commissions: P {parseFloat(commission).toFixed(2)}</h4>
          <table className="table table-success table-striped transaction-page-spacing">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Transaction ID</th>
                <th scope="col">Description</th>
                <th scope="col">Amount</th>
                <th scope="col">Cummulative</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPosts.map((x) => (
                <tr key={Math.random()}>
                  {/* <td>{x.placement_date}</td> */}
                  <td>{new Date(Date.parse(x.placement_date)).toLocaleString(('en-us', {timeZone : 'Asia/Taipei'}))}</td>
                  <td>{x.transaction_id}</td>
                  <td>{x.description}</td>
                  <td>₱ {x.amount.toFixed(2)}</td>
                  <td>₱ {x.cummulative ? x.cummulative.toFixed(2) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {transactionsList.length === 0
        ? renderEmptyTable(true)
        : renderEmptyTable(false)}
      </Modal.Body>
    </Modal>
  </div>
  )
}