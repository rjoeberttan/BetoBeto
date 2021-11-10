import React, { useEffect, props, useState, createContext, useContext } from "react";
import { AuthContext } from "../../store/auth-context";
import axios from "axios";

function AdminMasterCard({
  key,
  accountId,
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
      console.log("password do not match");
      //toaster passwords do not match
    } 
    else if (password.password.length < 8 || password.password.length > 20) {
      console.log("password length error");
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
      })
      .catch((err) => {
        console.log(err);
      });
    // e.preventDefault();
  }


  return (
    <div className="col-sm-4 wallet-card">
      <div className="card">
        <div className="card-body">
          <h3>{username}</h3>
          <div className="row">
            <div className="row text-spacing">
              <div className="col-md-5">
                <b>No. of Agents:</b> {numAgents}
              </div>
              <div className="col-md-7">
                <b>Mobile No:</b> {mobile}
              </div>
            </div>
            <div className="col-md-7  text-spacing">
              <b>No. of Players:</b> {numPlayers}
            </div>
            <div className="col-md-7 text-spacing">
              <b>Status:</b> {status}
            </div>
            <div className="col-md-12 text-spacing">
              <b>Last edit change:</b> {lastEditChange}
            </div>
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
              <button className="btn btn-color register-btn text-light">
                Lock Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminMasterCard;
