import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../store/auth-context";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import  { AiOutlineEyeInvisible, AiOutlineEye} from 'react-icons/ai';
import ShowTransactionsModal from "./Modal";
import ShowUsersUnderModal from "./UsersUnderModal";
import ShowCommissionsModal from "./UserCommissionsModal";
import './UserCardstyles.css';

function UserCard({
  accountId,
  accountType,
  username,
  mobile,
  status,
  commission,
  lastEditChange,
  walletBalance,
  editor,
  editorId,
}) {
  //=============================================
  // Variables Initialization
  //=============================================
  const accountHeader = process.env.REACT_APP_HEADER_ACCOUNT;
  const bankHeader = process.env.REACT_APP_HEADER_BANK;
  const accAuthorization = {
    "Authorization": process.env.REACT_APP_KEY_ACCOUNT,
  };
  const bankAuthorization = { "Authorization": process.env.REACT_APP_KEY_BANK };

  const ctx = useContext(AuthContext);
  const [numPlayersGM, setNumPlayersGM] = useState(0);
  const [numUsersUnder, setNumUsersUnder] = useState(0);
  const [numUsersUnderUnder, setNumUsersUnderUnder] = useState(0);
  const [commissionNew, setCommission] = useState();
  const [topUpAmount, setTopUpAmount] = useState();
  const [deductAmount, setDeductAmount] = useState();
  const [currentWallet, setCurrentWallet] = useState(walletBalance);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [agentName, setAgentName] = useState("");
  const [lockStatusText, setLockStatusText] = useState("Lock Account");
  const [commiEarnings, setCommiEarnings] = useState(0)
  const [password, setPassword] = useState({
    password: "",
    confirmPassword: "",
  });

  //=============================================
  // Use Effect and helper Functions
  //=============================================
  useEffect(() => {
    getNumUsersUnder()
    getNumUsersUnderUnder()
    getNumPlayersGM()
    getCommissionEarnings()

    getAgentName();
    if (status === "LOCKED") {
      setLockStatusText("Unlock Account");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getCommissionEarnings(){
    axios({
      method: "get",
      url: `${bankHeader}/getTotalCommissions/${accountId}`,
      headers: bankAuthorization,
    })
      .then((res) => {
        setCommiEarnings(res.data.data.total);
      })
      .catch((err) => {});
  }

  function getNumUsersUnder() {
    axios({
      method: "get",
      url: `${accountHeader}/getCountUnderUser/${accountId}`,
      headers: accAuthorization,
    })
      .then((res) => {
        setNumUsersUnder(res.data.count);
      })
      .catch((err) => {});
  }

  function getNumUsersUnderUnder() {
    axios({
      method: "get",
      url: `${accountHeader}/getCountPlayer/${accountId}`,
      headers: accAuthorization,
    })
      .then((res) => {
        setNumUsersUnderUnder(res.data.count);
      })
      .catch((err) => {});
  }

  function getNumPlayersGM() {
    axios({
      method: "get",
      url: `${accountHeader}/getPlayersCountOfGM/${accountId}`,
      headers: accAuthorization,
    })
      .then((res) => {
        setNumPlayersGM(res.data.count);
      })
      .catch((err) => {});
  }

  function getAgentName() {
    axios({
      method: "get",
      url: `${accountHeader}/getAgentName/${accountId}`,
      headers: accAuthorization,
    })
      .then((res) => {
        setAgentName(res.data.agentName);
      })
      .catch((err) => {});
  }

  function getAgentName() {
    axios({
      method: "get",
      url: `${accountHeader}/getAgentName/${accountId}`,
      headers: accAuthorization,
    })
      .then((res) => {
        setAgentName(res.data.agentName);
      })
      .catch((err) => {});
  }

  //=============================================
  // Event Handler Functions
  //=============================================
  function handleChangePassword(e) {
    const { value, name } = e.target;
    setPassword((prev) => {
      return {
        ...prev,
        [name]: value,
      };
    });
  }

  function submitPassword(e) {
    if (password.password !== password.confirmPassword) {
      toast.error("Sorry. Password do not match.");
    } else if (password.password.length < 8 || password.password.length > 20) {
      toast.error("Password should be between 8 to 20 characters");
    } else {
      axios({
        method: "post",
        url: `${accountHeader}/updatePassword`,
        headers: accAuthorization,
        data: {
          password: password.password,
          accountId: accountId,
          editorUsername: editor,
        },
      })
        .then((res) => {
          toast.success(res.data.message, {
            autoClose: 1500,
          });
        })
        .catch((err) => {toast.error(err.message)});
    }

    e.preventDefault();
  }

  function submitCommission(e) {
    axios({
      method: "post",
      url: `${accountHeader}/updateCommission`,
      headers: accAuthorization,
      data: {
        commission: commissionNew,
        accountId: accountId,
        accountType: accountType,
        editorUsername: editor,
      },
    })
      .then((res) => {
        toast.success(
          res.data.message + " to " + res.data.data.commission + "%",
          {
            autoClose: 1500,
          }
        );
      })
      .catch((err) => {
        toast.error(err.response.data.message)
      });
    e.preventDefault();
  }

  function submitTopUp(e) {
    if (window.confirm("Confirm Top Up?")) {
      if (topUpAmount <= 0){
        toast.error("Invalid Amount")
      } else {
        axios({
          method: "post",
          url: `${bankHeader}/transferFunds`,
          headers: bankAuthorization,
          data: {
            fromAccountId: editorId,
            fromUsername: editor,
            toAccountId: accountId,
            toUsername: username,
            amount: parseFloat(topUpAmount).toFixed(2),
          },
        })
          .then((res) => {
            let newWallet = parseFloat(ctx.walletBalance) - parseFloat(topUpAmount);
            ctx.walletHandler(newWallet);
    
            newWallet = parseFloat(currentWallet) + parseFloat(topUpAmount);
            setCurrentWallet(newWallet);
            toast.success(res.data.message, {
              autoClose: 1500,
            });
          })
          .catch((err) => {
            toast.error("Failed fund transfer");
          });
        // e.preventDefault();
      }
    }    
  }


  function submitDeductAmount(e) {
    if (window.confirm("Confirm Wallet Deduction?")) {
      console.log(deductAmount)
      if ((parseFloat(deductAmount) <= 0) || (deductAmount === null)){
        toast.error("Invalid Amount")
      } else {
        axios({
          method: "post",
          url: `${bankHeader}/deductWallet`,
          headers: bankAuthorization,
          data: {
            deductorAccountId: editorId,
            deductorUsername: editor,
            deductedAccountId: accountId,
            deductedUsername: username,
            amount: parseFloat(deductAmount).toFixed(2),
          },
        })
          .then((res) => {
            let newWallet = parseFloat(ctx.walletBalance) + parseFloat(deductAmount);
            ctx.walletHandler(newWallet);
    
            newWallet = parseFloat(currentWallet) - parseFloat(deductAmount);
            setCurrentWallet(newWallet);
            toast.success(res.data.message, {
              autoClose: 1500,
            });
          })
          .catch((err) => {
            console.log(err.response.data.message)
            toast.error(`Failed Wallet Deduct. ${err.response.data.message}`);
          });
        // e.preventDefault();
      }
    }    
  }
  

  function changeAccountStatus(e) {
    const currentStatusDigit = currentStatus === "ACTIVE" ? "1" : "0";

    axios({
      method: "post",
      url: `${accountHeader}/changeAccountStatus`,
      headers: accAuthorization,
      data: {
        status: currentStatusDigit,
        accountId: accountId,
        editorUsername: editor,
      },
    })
      .then((res) => {
        const newStatusDigit = res.data.accountStatus;
        const newStatus = newStatusDigit === 1 ? "ACTIVE" : "LOCKED";
        setCurrentStatus(newStatus);

        if (newStatus === "LOCKED") {
          setLockStatusText("Unlock Account");
          toast.success("Account successfully locked", {
            autoClose: 1500,
          });
        } else {
          setLockStatusText("Lock Account");
          toast.success("Account successfully unlocked", {
            autoClose: 1500,
          });
        }
      })
      .catch((err) => {});
    e.preventDefault();
  }

  //============================================
  // Conditional Rendering Stuff
  //============================================
  function renderNoOfMasterAgents(accountType) {
    if (accountType === "5") {
      return (
        <div className="col-md-12 text-spacing">
          <b>No. of Masteragent:</b> {numUsersUnder}
        </div>
      );
    } else {
      return;
    }
  }

  function renderNoOfAgents(accountType) {
    if (accountType === "1") {
      return (
        <div className="col-md-12 text-spacing">
          <b>No. of Agents:</b> {numUsersUnder}
        </div>
      );
    } else if (accountType === "5") {
      return (
        <div className="col-md-12 text-spacing">
          <b>No. of Agents:</b> {numUsersUnderUnder}
        </div>
      );
    }
  }

  function renderNoOfPlayers(accountType) {
    if (accountType === "1") {
      return (
        <div className="col-md-12  text-spacing">
          <b>No. of Players:</b> {numUsersUnderUnder}
        </div>
      );
    } else if (accountType === "2") {
      return (
        <div className="col-md-12  text-spacing">
          <b>No. of Players:</b> {numUsersUnder}
        </div>
      ); 
    } else if (accountType === "5") {
      return (
        <div className="col-md-12  text-spacing">
          <b>No. of Players:</b> {numPlayersGM}
        </div>
      ); 
    } 
    else {
      return;
    }
  }


  function renderCommissionEarnings(accountType) {
    if (accountType === "1" || accountType === "2" || accountType === "5") {
      return (
        <div className="col-md-12 text-spacing">
          <b>Commission Earnings:</b> ??? {commiEarnings.toFixed(2)}
        </div>
      );
      }
  }

  function handleCommissionChange(e){
    const input = (e.target.value)
    const inputNum = (e.target.value)

    if (inputNum < 100){
      if (input.indexOf('.') > 0) {
        const decimalLength = input.length - input.indexOf('.') - 1;
        if (decimalLength < 3){
          setCommission(e.target.value)
        }
      } else {
        setCommission(e.target.value)
      }
    }
  }

  function renderCommission(accountType) {
    if (ctx.user.accountType !== "grandmaster"){
      if (accountType === "1" || accountType === "2") {
        return (
          <div className="col-md-12 text-spacing">
            <div className="row">
              <div className="col-md-4 col-4">
                <b>Commission %</b>
              </div>
              <div className="col-md-4 col-4">
                <input
                  type="number"
                  className="form-control"
                  placeholder={parseFloat(commission).toFixed(2)}
                  value={commissionNew}
                  onChange={handleCommissionChange}
                />
              </div>
              <div className="col-md-4 col-4">
                <button
                  className="btn btn-color text-light"
                  onClick={submitCommission}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        );
      } 
    }else {
      return;
    }
  }

  function renderAgentName(accountType){
    var title = accountType === "5" ? "Admin:" : accountType === "1" ? "Admin/GM:" : accountType === "2" ? "Master Agent:" : "Agent:" 

    return (
      <div className="col-md-12  text-spacing">
        <b>{title}</b> {agentName}
      </div>
    )
  }

  const [state, setstate] = useState(false);
  const [stateConfirm, setstateConfirm] = useState(false);

  const toggleBtn = () => {

    setstate(prevState => !prevState);

  }

  const toggleBtnConfirm = () => {

    setstateConfirm(prevState => !prevState);

  }

  return (
    <div className="col-sm-4 wallet-card">
      <ToastContainer />
      <div className="card">
        <div className="card-body">
          <h3>{username}</h3>
          <div className="row">
            {renderAgentName(accountType)}
            {renderNoOfMasterAgents(accountType)}
            {renderNoOfAgents(accountType)}
            {renderNoOfPlayers(accountType)}
            {renderCommissionEarnings(accountType)}
            <div className="col-md-12 text-spacing">
              <b>Phone No:</b> {mobile}
            </div>
            <div className="col-md-7 text-spacing">
              <b>Status:</b> {currentStatus}
            </div>
            <div className="col-md-12 text-spacing">
              <b>Last Edit Date:</b> {lastEditChange}
            </div>
            {renderCommission(accountType)}
            <div className="col-md-12 text-spacing">
              <div className="row">
                <div className="col-md-4">
                  <b>Wallet:</b> ???{currentWallet.toFixed(2)}
                </div>
                <div className="col-md-4 col-6">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Top Up"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(parseFloat(e.target.value).toFixed(0))}
                  />
                </div>
                <div className="col-md-4 col-6">
                  <button
                    className="btn btn-color text-light"
                    onClick={submitTopUp}
                  >
                    Top Up
                  </button>
                </div>
              </div>
              <div className="row">
                <div className="col-md-4">
                  <b>Deduct Wallet:</b>
                </div>
                <div className="col-md-4 col-6">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Deduct"
                    value={deductAmount}
                    onChange={(e) => setDeductAmount(parseFloat(e.target.value).toFixed(0))}
                  />
                </div>
                <div className="col-md-4 col-6">
                  <button
                    className="btn btn-color text-light"
                    onClick={submitDeductAmount}
                  >
                    Deduct
                  </button>
                </div>
              </div>
            </div>
            <div className="col-md-7">
              <b>Action:</b>
            </div>
            <div className="col-md-12 text-spacing">
              <div className="row">
                <div className="col row change-password">
                  <input
                    type="password"
                    className="form-control input-change-password col"
                    placeholder="Change PW"
                    name="password"
                    onChange={handleChangePassword}
                    type={state ? 'text' : 'password'}
                  />
                  <button 
                    type='button'
                    className="input-group-text col-2 button-show-password-card"
                    onClick={toggleBtn}
                  >
                    {state ? <AiOutlineEyeInvisible/> : <AiOutlineEye /> }</button>                     
                </div>
                <div className="col row confirm-password-card">
                  <input
                    type="password"
                    className="form-control input-change-password col"
                    placeholder="Confirm PW"
                    name="confirmPassword"
                    onChange={handleChangePassword}
                    type={stateConfirm ? 'text' : 'password'}
                  />
                  <button 
                    type='button'
                    className="input-group-text col-2 button-show-password-card"
                    onClick={toggleBtnConfirm}
                  >
                    {stateConfirm ? <AiOutlineEyeInvisible/> : <AiOutlineEye /> }</button>
                </div>
                <div className="col-md-4 col-4">
                  <button
                    className="btn btn-color text-light"
                    onClick={submitPassword}
                  >
                    Save PW
                  </button>
                </div>
              </div>
            </div>
            <div className="col-md-12 text-center">
              <button
                className="btn btn-color register-btn text-light"
                onClick={changeAccountStatus}
              >
                {lockStatusText}
              </button>
            </div>
            <ShowTransactionsModal username={username} accountId={accountId}/>
            {accountType !== 3 ? <ShowUsersUnderModal username={username} accountId={accountId} accountType={accountType} /> :
            null}
            {accountType !== 3 ? <ShowCommissionsModal username={username} accountId={accountId} accountType={accountType} /> :
            null}
            
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserCard;
