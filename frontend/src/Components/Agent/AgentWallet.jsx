import axios from "axios";
import React, { useEffect, useContext, useState } from "react";
import { AuthContext } from "../../store/auth-context";
import WalletRequestTable from "../WalletRequestTable";
import WithdrawalReq from "../WithdrawalReq";
import DepositRequest from "../DepositRequest";
import { toast, ToastContainer } from "react-toastify";
import "./AgentWallet.css";

function AgentWallet() {
  //============================================
  // Variable and useState Definitions
  //============================================
  const ctx = useContext(AuthContext);
  const accountHeader = process.env.REACT_APP_HEADER_ACCOUNT;
  const bankHeader = process.env.REACT_APP_HEADER_BANK;
  const accAuthorization = {
    "Authorization": process.env.REACT_APP_KEY_ACCOUNT,
  };
  const bankAuthorization = { "Authorization": process.env.REACT_APP_KEY_BANK };
  const [depositRequest, setDepositRequest] = useState([]);
  const [withdrawalRequest, setWithdrawalRequest] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [activeUserId, setActiveUserId] = useState("");
  const [activeUsername, setActiveUsername] = useState("");
  const [amount, setAmount] = useState();
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
    totalEarnings: 0,
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
    getUnsettledDeposits();
    getUnsettledWithdrawals();
    getUsersList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getUnsettledDeposits() {
    const accType =
      ctx.user.accountType === "admin"
        ? 0
        : ctx.user.accountType === "masteragent"
        ? 1
        : 2;
    axios({
      method: "get",
      url: `${bankHeader}/getUnsettledRequest/${ctx.user.accountID}/${accType}/0`,
      headers: bankAuthorization,
    })
      .then((res) => {
        const data = res.data.data;
        console.log(data);
        setDepositRequest(data);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function getUnsettledWithdrawals() {
    const accType =
      ctx.user.accountType === "admin"
        ? 0
        : ctx.user.accountType === "masteragent"
        ? 1
        : 2;
    axios({
      method: "get",
      url: `${bankHeader}/getUnsettledRequest/${ctx.user.accountID}/${accType}/2`,
      headers: bankAuthorization,
    })
      .then((res) => {
        const data = res.data.data;
        console.log(data);
        setWithdrawalRequest(data);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function getUsersList() {
    axios({
      method: "get",
      url: `${accountHeader}/getAccountList/${ctx.user.accountID}/2`,
      headers: accAuthorization,
    })
      .then((res) => {
        const data = res.data.data;
        console.log(data);
        setUsersList(data);
        setActiveUsername(data[0].username);
        setActiveUserId(data[0].account_id);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  //=====================================================
  // Event Handler Functions
  //=====================================================
  function setActiveUser(e) {
    const [accountId, username] = e.target.value.split("-");
    // console.log(accountId, username)
    setActiveUserId(accountId);
    setActiveUsername(username);

    e.preventDefault();
  }

  function handleAmount(e){
    setAmount(parseFloat(e.target.value).toFixed(0))
    // const input = (e.target.value)
    // const inputNum = (e.target.value)

    // if (inputNum < 999999999){
    //   if (input.indexOf('.') > 0) {
    //     const decimalLength = input.length - input.indexOf('.') - 1;
    //     if (decimalLength < 3){
    //       setAmount(e.target.value)
    //     }
    //   } else {
    //     setAmount(e.target.value)
    //   }
    // }
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

  function calculateEarnings(transList) {
    let depositAccepted = 0;
    let withdrawalAccepted = 0;
    let depositRequested = 0;
    let withdrawalRequested = 0;
    let fundTransfers = 0;
    let fundReceived = 0;
    let commissions = 0;

    transList.forEach((trx) => {
      console.log(trx.transaction_type, trx.amount);
      if (trx.transaction_type === 0 && trx.status === 1) {
        depositRequested += trx.amount;
      } else if (trx.transaction_type === 1) {
        depositAccepted += trx.amount;
      } else if (trx.transaction_type === 2 && trx.status === 1) {
        withdrawalRequested += trx.amount;
      } else if (trx.transaction_type === 3) {
        withdrawalAccepted += trx.amount;
      } else if (trx.transaction_type === 4) {
        fundTransfers += trx.amount;
      } else if (trx.transaction_type === 5) {
        fundReceived += trx.amount;
      } else if (trx.transaction_type === 6) {
        commissions += trx.amount;
      }
    });

    var totalEarnings =
      depositAccepted -
      depositRequested +
      withdrawalRequested -
      withdrawalAccepted -
      fundTransfers +
      fundReceived +
      commissions;

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
        totalEarnings: totalEarnings.toFixed(2),
      };
    });
  }

  function getEarnings(e) {
    console.log("here");
    axios({
      method: "get",
      url: `${bankHeader}/getTransactionHistory/${ctx.user.accountID}/${dateFilter.startDate} 00:00/${dateFilter.endDate} 23:59`,
      headers: bankAuthorization,
    })
      .then((res) => {
        const data = res.data.data;
        console.log(res);
        calculateEarnings(data);
      })
      .catch((err) => {
        console.log(err);
      });

    e.preventDefault();
  }

  function submitTransfer(e) {
    const senderWallet = parseFloat(ctx.walletBalance).toFixed(2);
    if (amount <= 0){
      toast.error("Invalid Amount")
    }
    else if (senderWallet < parseFloat(amount)) {
      toast.error("Wallet balance is bigger than to send");
    } else {
      const data = {
        fromAccountId: ctx.user.accountID,
        fromUsername: ctx.user.username,
        toAccountId: activeUserId,
        toUsername: activeUsername,
        amount: amount,
      };
      console.log(data);

      axios({
        method: "post",
        url: `${bankHeader}/transferFunds`,
        headers: bankAuthorization,
        data: data,
      })
        .then((res) => {
          let newWallet = parseFloat(ctx.walletBalance) - parseFloat(amount);
          ctx.walletHandler(newWallet);
          toast.success(res.data.message);
        })
        .catch((err) => {
          toast.error("Fund transfer failed");
        });
    }

    e.preventDefault();
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
          <div className="col-sm-6 wallet-card">
            <div className="card">
              <div className="card-body">
                <div className="row">
                  <div className="admin-wallet-font">
                    <b>Date Filter:</b>
                  </div>
                  <div className="col-md-4">
                    <input
                      className="date-style form-label"
                      type="date"
                      name="startDate"
                      value={dateFilter.startDate}
                      onChange={handleDateChange}
                    />
                  </div>
                  <div className="col-md-4">
                    <input
                      className="date-style form-label"
                      type="date"
                      name="endDate"
                      value={dateFilter.endDate}
                      onChange={handleDateChange}
                    />
                  </div>
                  <div className="col-md-4">
                    <button
                      className="btn btn-color transaction-btn text-light col-xs-12"
                      onClick={getEarnings}
                    >
                      Search
                    </button>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-7 col-6 admin-wallet-font">
                    <b>(+) Deposit Accepted</b>
                  </div>
                  <div className="col-md-5 col-6 admin-wallet-font">
                    ₱{earnings.totalDepositAccepted}
                  </div>
                  <div className="col-md-7 col-6 admin-wallet-font">
                    <b>(-) Withdrawal Accepted</b>
                  </div>
                  <div className="col-md-5 col-6 admin-wallet-font">
                    ₱{earnings.totalWithdrawalAccepted}
                  </div>
                  <div className="col-md-7 col-6 admin-wallet-font">
                    <b>(-) Deposit Requested</b>
                  </div>
                  <div className="col-md-5 col-6 admin-wallet-font">
                    ₱{earnings.totalDepositRequested}
                  </div>
                  <div className="col-md-7 col-6 admin-wallet-font">
                    <b>(+) Withdrawal Requested</b>
                  </div>
                  <div className="col-md-5 col-6 admin-wallet-font">
                    ₱{earnings.totalWithdrawalRequested}
                  </div>
                  <div className="col-md-7 col-6 admin-wallet-font">
                    <b>(-) Fund Transfers</b>
                  </div>
                  <div className="col-md-5 col-6 admin-wallet-font">
                    ₱{earnings.totalFundTransfers}
                  </div>
                  <div className="col-md-7 col-6 admin-wallet-font">
                    <b>(+) Fund Received</b>
                  </div>
                  <div className="col-md-5 col-6 admin-wallet-font">
                    ₱{earnings.totalFundReceived}
                  </div>
                  <div className="col-md-7 col-6 admin-wallet-font">
                    <b>(+) Commissions</b>
                  </div>
                  <div className="col-md-5 col-6 admin-wallet-font">
                    ₱{earnings.totalCommissions}
                  </div>
                  <div className="col-md-7 col-6 admin-wallet-font">
                    <b>Total Earnings</b>
                  </div>
                  <div className="col-md-5 col-6 admin-wallet-font">
                    ₱{earnings.totalEarnings}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 wallet-card">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Transfer Funds</h5>
                <div className="row wallet-box">
                  <div className="col-md-4">
                    <label className="col-form-label">Username</label>
                  </div>
                  <div className="col-md-12">
                    <select className="form-select" onChange={setActiveUser}>
                      {usersList.map((x) => (
                        <option
                          key={Math.random()}
                          value={x.account_id + "-" + x.username}
                        >
                          {x.username}{" "}
                        </option>
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
                      value={amount}
                      onChange={handleAmount}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="col-md-12 text-center">
                  <button
                    className="btn btn-color register-btn text-light"
                    onClick={submitTransfer}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
          <DepositRequest
            accId={ctx.user.accountID}
            header="http://localhost:4006"
            col="6"
          />
          <WithdrawalReq
            accId={ctx.user.accountID}
            header="http://localhost:4006"
            walletBalance={ctx.walletBalance}
            col="6"
          />
        </div>
      </form>

      <div className="row second-box">
        <div className="col-md-12">
          <h2>Deposit Request</h2>
          <table className="table table-success table-striped">
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
          <table className="table table-success table-striped">
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

export default AgentWallet;
