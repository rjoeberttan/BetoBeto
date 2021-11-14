import React, { useEffect, props, useState, createContext, useContext } from "react";
import { AuthContext } from "../../store/auth-context";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

function UserCard({
  key,
  accountId,
  accountType,
  username,
  noOfAgents,
  noOfPlayers,
  mobile,
  status,
  commission,
  lastEditChange,
  walletBalance,
  editor,
  editorId
}) {

  //=============================================
  // Variables Initialization
  //=============================================
  const accountHeader = "http://localhost:4003";
  const bankHeader = "http://localhost:4006"
  const ctx = useContext(AuthContext)
  const [numAgents, setNumAgents] = useState(0);
  const [numPlayers, setNumPlayers] = useState(0);
  const [commissionNew, setCommission] = useState(0);
  const [topUpAmount, setTopUpAmount] = useState(0);
  const [currentWallet, setCurrentWallet] = useState(walletBalance)
  const [currentStatus, setCurrentStatus] = useState(status)
  const [agentName, setAgentName] = useState("");
  const [lockStatusText, setLockStatusText] = useState("LOCK ACCOUNT");
  const [password, setPassword] = useState({
    password: "",
    confirmPassword: "",
  });

  //=============================================
  // Use Effect and helper Functions
  //=============================================
  useEffect(() => {
    getNumberOfAgents()
    getNumberOfPlayers()
    getAgentName()
    
    if(status === "LOCKED"){
      setLockStatusText("UNLOCK ACCOUNT")
    } 
  }, [])

  function getNumberOfAgents(){
    axios({
      method: "get",
      url: `${accountHeader}/getCountUnderUser/${accountId}`,
      headers: {
        "Authorization": "uKRd;$SuXd8b$MFX",
      },
    })
      .then((res) => {
        setNumAgents(res.data.count)
        
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function getNumberOfPlayers(){
    axios({
      method: "get",
      url: `${accountHeader}/getCountPlayer/${accountId}`,
      headers: {
        "Authorization": "uKRd;$SuXd8b$MFX",
      },
    })
      .then((res) => {
        setNumPlayers(res.data.count)
        
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function getAgentName(){
    axios({
      method: "get",
      url: `${accountHeader}/getAgentName/${accountId}`,
      headers: {
        "Authorization": "uKRd;$SuXd8b$MFX",
      },
    })
      .then((res) => {
        console.log(res.data.agentName)
        setAgentName(res.data.agentName)
      })
      .catch((err) => {
        console.log(err);
      });

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
      toast.error("Sorry. Password do not match.")
    } 
    else if (password.password.length < 8 || password.password.length > 20) {
      toast.error("Password should be between 8 to 20 characters")
      //toaster pssword length error
    } 
    else {
      axios({
        method: "post",
        url: `${accountHeader}/updatePassword`,
        headers: {
          "Authorization": "uKRd;$SuXd8b$MFX",
        },
        data: {
          password: password.password,
          accountId: accountId,
          editorUsername: editor,
        },
      })
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  
    e.preventDefault();
  }

  function submitCommission(e) {
    axios({
      method: "post",
      url: `${accountHeader}/updateCommission`,
      headers: {
        "Authorization": "uKRd;$SuXd8b$MFX",
      },
      data: {
        commission: commissionNew,
        accountId: accountId,
        editorUsername: editor,
      },
    })
      .then((res) => {
        console.log(res);
        // toast.success("Commission Updated");
      })
      .catch((err) => {
        console.log(err);
      });
    e.preventDefault();
  }

  function submitTopUp(e){
    console.log(editorId, editor, accountId, username, topUpAmount)
    axios({
      method: "post",
      url: `${bankHeader}/transferFunds`,
      headers: {
        "Authorization": "[9@kw7L>F86_P](p",
      },
      data: {
        fromAccountId:editorId,
        fromUsername: editor,
        toAccountId: accountId,
        toUsername: username,
        amount: parseFloat(topUpAmount).toFixed(2) 
      },
    })
      .then((res) => {
        let newWallet = parseFloat(ctx.walletBalance) - parseFloat(topUpAmount);
        ctx.walletHandler(newWallet);

        newWallet = parseFloat(currentWallet) + parseFloat(topUpAmount);
        setCurrentWallet(newWallet)
        console.log(res);
        toast.success(res.data.message, {
          autoClose : 1500
        })
      })
      .catch((err) => {
        console.log(err);
        toast.error("Failed fund transfer");
      });
    // e.preventDefault();
  }


  function changeAccountStatus(e){   
    const currentStatusDigit = currentStatus === "ACTIVE" ? "1": "0"

    axios({
      method: "post",
      url: `${accountHeader}/changeAccountStatus`,
      headers: {
        "Authorization": "uKRd;$SuXd8b$MFX",
      },
      data: {
        status: currentStatusDigit,
        accountId: accountId,
        editorUsername: editor,
      },
    })
      .then((res) => {
        const newStatusDigit = res.data.accountStatus
        const newStatus = newStatusDigit === 1 ? "ACTIVE" : "LOCKED"
        setCurrentStatus(newStatus)
        
        if(newStatus === "LOCKED"){
          setLockStatusText("UNLOCK ACCOUNT")
          // toast.success("Account successfully unlocked");
        } else {
          setLockStatusText("LOCK ACCOUNT")
          // toast.success("Account successfully locked");
        }
      })
      .catch((err) => {
        console.log(err);
      });
    e.preventDefault();
  }





  //============================================
  // Conditional Rendering Stuff
  //============================================
  function renderNoOfAgents(accountType){
    if (accountType === "1"){ 
      return (
        <div className="col-md-12 text-spacing">
                <b>No. of Agents:</b> {numAgents}
            </div>
      )
    } else{
      return;
    }
  }

  function renderNoOfPlayers(accountType){
    if ((accountType === "1" )|| (accountType === "2")){ 
      return (
        <div className="col-md-12  text-spacing">
          <b>No. of Players:</b> {numPlayers}
        </div>
      )
    } else{
      return;
    }
  }

  function renderCommission(accountType){
    console.log(accountType)
    if ((accountType === "1" )|| (accountType === "2")){ 
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
                onChange={(e) => setCommission(e.target.value)}
              />
            </div>
            <div className="col-md-4 col-4">
              <button className="btn btn-color text-light" onClick={submitCommission}>Save</button>
            </div>
          </div>
        </div>
      )
    } else{
      return;
    }
  }


  function renderAgentName(accountType){
    if ((accountType === "2" )|| (accountType === "3")){ 
      return (
        <div className="col-md-12  text-spacing">
          <b>Agent Name:</b> {agentName}
        </div>
      )
    } else{
      return;
    }
  }


  return (
    <div className="col-sm-4 wallet-card">
      <ToastContainer/>
      <div className="card">
        <div className="card-body">
          <h3>{username}</h3>
          <div className="row">
            {renderAgentName(accountType)}
            {renderNoOfAgents(accountType)}
            {renderNoOfPlayers(accountType)}
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
                  <b>Wallet:</b> ₱{currentWallet}
                </div>
                <div className="col-md-4 col-6">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Top Up"
                    onChange={(e) => setTopUpAmount(e.target.value)}
                  />
                </div>
                <div className="col-md-4 col-6">
                  <button className="btn btn-color text-light" onClick={submitTopUp}>Top Up</button>
                </div>
              </div>
            </div>
            <div className="col-md-7">
              <b>Action:</b>
            </div>
            <div className="col-md-12 text-spacing">
              <div className="row">
                <div className="col-md-4 col-4">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Change PW"
                    name="password"
                    onChange={handleChangePassword}
                  />
                </div>
                <div className="col-md-4 col-4">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Confirm PW"
                    name="confirmPassword"
                    onChange={handleChangePassword}
                  />
                </div>
                <div className="col-md-4 col-4">
                  <button className="btn btn-color text-light" onClick={submitPassword}>Save PW</button>
                </div>
              </div>
            </div>
            <div className="col-md-12 text-center">
              <button className="btn btn-color register-btn text-light" onClick={changeAccountStatus}>
                {lockStatusText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserCard;
