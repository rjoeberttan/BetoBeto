
import axios from "axios";
import React, { useEffect, useContext, useState } from "react";
import { AuthContext } from "../../store/auth-context";
import WalletRequestTable from "../WalletRequestTable";
import WithdrawalReq from "../WithdrawalReq";
import DepositRequest from "../DepositRequest";
import { toast, ToastContainer, Zoom } from "react-toastify";
import "./AgentWallet.css";

function AgentWallet() {

  //============================================
  // Variable and useState Definitions
  //============================================
  const ctx = useContext(AuthContext);
  const accountHeader = "http://localhost:4003"
  const bankHeader = "http://localhost:4006"
  const [depositRequest, setDepositRequest] = useState([])
  const [withdrawalRequest, setWithdrawalRequest] = useState([])
  const [usersList, setUsersList] = useState([])
  const [activeUserId, setActiveUserId] = useState("")
  const [activeUsername, setActiveUsername] = useState("")
  const [amount, setAmount] = useState(0);

  //============================================
  // useEffect Definitions
  //============================================
  useEffect(() => {
    getUnsettledDeposits()
    getUnsettledWithdrawals()
    getUsersList()
  }, [])

  function getUnsettledDeposits(){
    const accType = (ctx.user.accountType === "admin") ? 0 : (ctx.user.accountType === "masteragent" ? 1 : 2)
    axios({
      method: "get",
      url: `${bankHeader}/getUnsettledRequest/${ctx.user.accountID}/${accType}/0`,
      headers: {
        "Authorization": "[9@kw7L>F86_P](p",
      },
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
      headers: {
        "Authorization": "[9@kw7L>F86_P](p",
      },
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
      url: `${accountHeader}/getAccountList/${ctx.user.accountID}/2`,
      headers: {
        "Authorization": "uKRd;$SuXd8b$MFX",
      },
    })
      .then((res) => {
        const data = res.data.data;
        console.log(data)
        setUsersList(data);
        setActiveUsername(data[0].username)
        setActiveUserId(data[0].account_id)
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
        headers: {
          "Authorization": "[9@kw7L>F86_P](p",
        },
        data: data
      })
        .then((res) => {
          let newWallet = parseFloat(ctx.walletBalance) - parseFloat(amount);
          ctx.walletHandler(newWallet);
          toast.success(res.data.message)
          
        })
        .catch((err) => {
          toast.error("Fund transfer failed")
        });
    }

    e.preventDefault();
  }



  //=====================================================
  //  Components
  //=====================================================
  return (
    <div className="container text-light container-wallet">
      <ToastContainer/>
      <div className="heading-text">
        <h1 className="display-5 small-device bold-small">Wallet</h1>
      </div>
      <form>
        <div className="row txt-black">
          <div className="col-sm-3 wallet-card">
            <div className="card">
              <div className="card-body">
                <div className="wallet-spacing">
                  <h5 className="card-title">Wallet balance</h5>
                  <div className="card-text">P 2,000.00</div>
                </div>
                <div className="wallet-spacing">
                  <h5 className="card-title">Commissions</h5>
                  <div className="card-text">P 2,000.00</div>
                </div>
                <hr />
                <h4>No. of players 50</h4>
              </div>
            </div>
          </div>
          <div className="col-sm-3 wallet-card">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Transfer Funds</h5>
                <div className="row wallet-box">
                  <div className="col-md-4">
                    <label className="col-form-label">Username</label>
                  </div>
                  <div className="col-md-12">
                    <select class="form-select" onChange={setActiveUser}>
                      {usersList.map((x) => (
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
                      onChange={handleAmount}
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

export default AgentWallet;
