import axios from "axios";
import React, { useEffect, useContext, useState } from "react";
import { AuthContext } from "../../store/auth-context";
import WalletRequestTable from "../WalletRequestTable";
import "./MasterWallet.css";
import WithdrawalReq from "../WithdrawalReq";
import DepositRequest from "../DepositRequest";
import { toast, ToastContainer, Zoom } from "react-toastify";

function MasterWallet() {
  //============================================
  // Variable and useState Definitions
  //============================================
  const ctx = useContext(AuthContext);
  const accountHeader = process.env.REACT_APP_HEADER_ACCOUNT
  const bankHeader = process.env.REACT_APP_HEADER_BANK
  const accAuthorization = {"Authorization" : process.env.REACT_APP_KEY_ACCOUNT}
  const bankAuthorization = {"Authorization" : process.env.REACT_APP_KEY_BANK}
  const [depositRequest, setDepositRequest] = useState([])
  const [withdrawalRequest, setWithdrawalRequest] = useState([])
  const [usersList, setUsersList] = useState([])
  const [userFilter, setUserFilter] = useState("0");
  const [filteredList, setFilteredList] = useState([]);
  const [activeUserId, setActiveUserId] = useState("")
  const [activeUsername, setActiveUsername] = useState("")
  const [amount, setAmount] = useState(0);
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  });
  const [earnings, setEarnings] = useState({
    totalDepositRequested: 0,
    totalDepositAccepted: 0,
    totalWithdrawalRequested: 0,
    totalWithdrawalAccepted: 0,
    totalFundTransfers: 0,
    totalFundReceived: 0,
    totalCommissions: 0,
    totalEarnings: 0
  });

  //============================================
  // useEffect Definitions
  //============================================
  useEffect(() => {
    const date = new Date();
    const dateToday = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}`;
    setDateFilter({
      startDate: dateToday,
      endDate: dateToday,
    });
    getUnsettledDeposits()
    getUnsettledWithdrawals()
    getUsersList()
  }, [])

  function getUnsettledDeposits(){
    const accType = (ctx.user.accountType === "admin") ? 0 : (ctx.user.accountType === "masteragent" ? 1 : 2)
    axios({
      method: "get",
      url: `${bankHeader}/getUnsettledRequest/${ctx.user.accountID}/${accType}/0`,
      headers: bankAuthorization
    })
      .then((res) => {
        const data = res.data.data;
        console.log(data)
        setDepositRequest(data)
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function getUnsettledWithdrawals(){
    const accType = (ctx.user.accountType === "admin") ? 0 : (ctx.user.accountType === "masteragent" ? 1 : 2)
    axios({
      method: "get",
      url: `${bankHeader}/getUnsettledRequest/${ctx.user.accountID}/${accType}/2`,
      headers: bankAuthorization
    })
      .then((res) => {
        const data = res.data.data;
        console.log(data)
        setWithdrawalRequest(data)
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function getUsersList() {
    axios({
      method: "get",
      url: `${accountHeader}/getAccountList/${ctx.user.accountID}/1`,
      headers: accAuthorization
    })
      .then((res) => {
        const data = res.data.data;
        console.log(data)
        setUsersList(data);
        setActiveUsername(data[0].username)
        setActiveUserId(data[0].account_id)
        setFilteredList(data)
      })
      .catch((err) => {
        console.log(err);
      });
  }


  //=====================================================
  // Event Handler Functions
  //=====================================================
  function setActiveUser(e){
    const [accountId, username] = (e.target.value).split("-")
    // console.log(accountId, username)
    setActiveUserId(accountId)
    setActiveUsername(username)

    e.preventDefault()
  }

  function handleAmount(e){
    const amount = parseFloat(e.target.value).toFixed(2)
    setAmount(amount)
  }

  function submitTransfer(e){
    const senderWallet = parseFloat(ctx.walletBalance).toFixed(2)

    if (senderWallet < parseFloat(amount)) {
      toast.error("Wallet balance is bigger than to send")
    } else {
      const data = {
        fromAccountId: ctx.user.accountID,
        fromUsername: ctx.user.username,
        toAccountId: activeUserId,
        toUsername: activeUsername,
        amount: amount
      }
      console.log(data)
      
      axios({
        method: "post",
        url: `${bankHeader}/transferFunds`,
        headers: bankAuthorization,
        data: data
      })
        .then((res) => {
          let newWallet = parseFloat(ctx.walletBalance) - parseFloat(amount);
          ctx.walletHandler(newWallet);
          toast.success(res.data.message)
          
        })
        .catch((err) => {
          toast.error("Fund transfer failed", {
            autoClose : 1500
          })
        });
    }

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
    setDateFilter((prev) => {
      return {
        ...prev,
        [name]: value,
      };
    });

    e.preventDefault()
  }

  function calculateEarnings(transList){
    var depositAccepted = 0
    var withdrawalAccepted = 0
    var depositRequested = 0
    var withdrawalRequested = 0
    var fundTransfers = 0
    var fundReceived = 0
    var commissions = 0
    
    transList.map((trx) => {
      console.log(trx.transaction_type, trx.amount)
      if ((trx.transaction_type === 0) && (trx.status === 1)) {
        depositRequested += trx.amount
      } else if (trx.transaction_type === 1) {
        depositAccepted += trx.amount
      } else if ((trx.transaction_type === 2) && (trx.status === 1)) {
        withdrawalRequested += trx.amount
      } else if (trx.transaction_type === 3) {
        withdrawalAccepted += trx.amount
      } else if (trx.transaction_type === 4) {
        fundTransfers += trx.amount
      } else if (trx.transaction_type === 5) {
        fundReceived += trx.amount
      } else if (trx.transaction_type === 6) {
        commissions += trx.amount
      } 
    })

    var totalEarnings = depositAccepted 
    - depositRequested 
    + withdrawalRequested 
    - withdrawalAccepted
    - fundTransfers
    + fundReceived
    + commissions

    setEarnings((prev) => {
      return {
        ...prev,
        totalDepositRequested: depositRequested.toFixed(2),
        totalDepositAccepted: depositAccepted.toFixed(2),
        totalWithdrawalRequested: withdrawalRequested.toFixed(2),
        totalWithdrawalAccepted: withdrawalAccepted.toFixed(2),
        totalFundTransfers: fundTransfers.toFixed(2),
        totalFundReceived: fundReceived.toFixed(2),
        totalCommissions: commissions.toFixed(2),     
        totalEarnings: totalEarnings.toFixed(2)  
      }
    })
  }

  function getEarnings(e) {
    axios({
      method: "get",
      url: `${bankHeader}/getTransactionHistory/${ctx.user.accountID}/${dateFilter.startDate} 00:00/${dateFilter.endDate} 23:59`,
      headers: bankAuthorization
    })
      .then((res) => {
        const data = res.data.data;
        calculateEarnings(data)    
      })
      .catch((err) => {
        console.log(err);
      });
    
    e.preventDefault()
  }

  //=====================================================
  //  Components
  //=====================================================
  return (
    <div className="container text-light container-wallet">
      <ToastContainer />
      <div className="heading-text">
        <h1 className="display-5 small-device bold-small">Wallet</h1>
      </div>
      <form>
        <div className="row txt-black">
          {/* card one */}
          <div className="col-sm-3 wallet-card">
            <div className="card">
              <div className="card-body">
                <div className="row">
                  <div className="admin-wallet-font">
                    <b>Date Filter:</b>
                  </div>
                  <div className="col-md-10">
                    <input
                      className="date-style form-label"
                      type="date"
                      name="startDate"
                      value={dateFilter.startDate}
                      onChange={handleDateChange}
                    />
                  </div>
                  -
                  <div className="col-md-10">
                    <input
                      className="date-style form-label"
                      type="date"
                      name="endDate"
                      value={dateFilter.endDate}
                      onChange={handleDateChange}
                    />
                  </div>
                  <div className="col-md-8">
                    <button className="btn btn-color transaction-btn text-light col-xs-12" onClick={getEarnings}>
                      Search
                    </button>
                  </div>
                </div>
                <div className="wallet-spacing">
                  <h6 className="card-title">(+) Deposit Accepted</h6>
                  <div className="card-text">₱{earnings.totalDepositAccepted}</div>
                </div>
                <div className="wallet-spacing">
                  <h6 className="card-title">(-) Withdrawal Accepted</h6>
                  <div className="card-text">₱{earnings.totalWithdrawalAccepted}</div>
                </div>
                <div className="wallet-spacing">
                  <h6 className="card-title">(-) Deposit Requested</h6>
                  <div className="card-text">₱{earnings.totalDepositRequested}</div>
                </div>
                <div className="wallet-spacing">
                  <h6 className="card-title">(+) Withdrawal Requested</h6>
                  <div className="card-text">₱{earnings.totalWithdrawalRequested}</div>
                </div>
                <div className="wallet-spacing">
                  <h6 className="card-title">(-) Fund Transfers</h6>
                  <div className="card-text">₱{earnings.totalFundTransfers}</div>
                </div>
                <div className="wallet-spacing">
                  <h6 className="card-title">(+) Fund Received</h6>
                  <div className="card-text">₱{earnings.totalFundReceived}</div>
                </div>
                <div className="wallet-spacing">
                  <h6 className="card-title">(+) Commissions</h6>
                  <div className="card-text">₱{earnings.totalCommissions}</div>
                </div>
                <div className="wallet-spacing">
                  <h6 className="card-title">Total Earnings</h6>
                  <div className="card-text">₱{earnings.totalEarnings}</div>
                </div>
              </div>
            </div>
          </div>

          {/* card two */}
          <div className="col-sm-3 wallet-card">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Transfer Funds</h5>
                <div className="wallet-box master-wallet">
                  <div class="form-check form-check-inline">
                    <input
                      class="form-check-input"
                      type="radio"
                      name="inlineRadioOptions"
                      value="1"
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

                <div className="row wallet-box">
                  <div className="col-md-4">
                    <label className="col-form-label">Username</label>
                  </div>
                  <div className="col-md-12">
                    <select class="form-select" onChange={setActiveUser}>
                      {filteredList.map((x) => (
                        <option value={x.account_id + '-' + x.username}>{x.username} </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="row wallet-box wallet-box-2">
                  <div className="col-md-4">
                    <label className="col-form-label">Amount</label>
                  </div>
                  <div className="col-md-12">
                    <input
                      type="number"
                      className="form-control"
                      onWheel={(e) => e.target.blur()}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="col-md-12 text-center">
                  <button className="btn btn-color register-btn text-light" onClick={submitTransfer}>
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* card three */}
          {/* <div className="col-sm-4 wallet-card">
            <div className="card">
              <div className="card-body">
                <div className="wallet-spacing">
                  <h5 className="card-title">Deposit Request:</h5>
                  <div className="card-text">{depositRequest.length} request</div>
                </div>
                <div className="wallet-spacing">
                  <h5 className="card-title">Withdrawal Request:</h5>
                  <div className="card-text">{withdrawalRequest.length} request</div>
                </div>
              </div>
            </div>
          </div> */}
          {/* card sample */}
          <DepositRequest accId={ctx.user.accountID} header="http://localhost:4006" col="3" />
          <WithdrawalReq accId={ctx.user.accountID} header="http://localhost:4006" walletBalance={ctx.walletBalance} col="3" />
        </div>
      </form>


      <div className="row second-box">
        <div className="col-md-12">
          <h2>Deposit Request</h2>
          <table class="table table-success table-striped">
            <thead>
              <tr>
                <th scope="col">Username</th>
                <th scope="col">Cellphone No.</th>
                <th scope="col">User Type</th>
                <th scope="col">Amount</th>
                <th scope="col">Placement Date</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {depositRequest.map((x) => (
                <WalletRequestTable 
                  key={x.transaction_id}
                  transactionId={x.transaction_id}
                  requesterAccountId={x.account_id}
                  requesterUsername={x.username}
                  requesterType={x.account_type}
                  placementDate={x.placement_date.substring(0, 10)}
                  amount={x.amount}
                  phoneNum={x.phone_num}
                  accepterAccountId={ctx.user.accountID}
                  accepterUsername={ctx.user.username}
                  transactionType="0"
                  accepterWallet={ctx.walletBalance}
                />
              ))}
            </tbody>
          </table>
        </div>


        <div className="col-md-12">
          <h2>Withdrawal Request</h2>
          <table class="table table-success table-striped">
            <thead>
              <tr>
                <th scope="col">Username</th>
                <th scope="col">Cellphone No.</th>
                <th scope="col">User Type</th>
                <th scope="col">Amount</th>
                <th scope="col">Placement Date</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {withdrawalRequest.map((x) => (
                <WalletRequestTable 
                  key={x.transaction_id}
                  transactionId={x.transaction_id}
                  requesterAccountId={x.account_id}
                  requesterUsername={x.username}
                  requesterType={x.account_type}
                  placementDate={x.placement_date.substring(0, 10)}
                  amount={x.amount}
                  phoneNum={x.phone_num}
                  accepterAccountId={ctx.user.accountID}
                  accepterUsername={ctx.user.username}
                  transactionType="2"
                  accepterWallet={ctx.user.walletBalance}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default MasterWallet;
