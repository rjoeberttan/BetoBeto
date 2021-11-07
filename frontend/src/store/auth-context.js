import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
const axios = require("axios").default;
require("dotenv").config();

export const AuthContext = React.createContext({});

export default function AuthContextProvider(props) {
  const hostHeader = "http://localhost:4003";
  const headers = { "Authorization": "uKRd;$SuXd8b$MFX" };
  const [account, setAccount] = useState({
    username: "",
    accountType: "",
    accountID: "",
  });
  const [walletBalance, setWalletBalance] = useState(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  //WHEN USER REFRESH, CHECK IF STILL LOGGED IN (TOKEN)
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios({
      method: "get",
      url: `${hostHeader}/isUserAuth`,
      headers: {
        "x-access-token": token,
        "Authorization": "uKRd;$SuXd8b$MFX",
      },
    })
      .then((res) => {
        if (res.status === 200) {
          if (res.data.accountType === 0) {
            setAccount({
              username: res.data.username,
              accountID: res.data.accountId,
              accountType: "admin",
            });
          } else if (res.data.accountType === 1) {
            setAccount({
              username: res.data.username,
              accountID: res.data.accountId,
              accountType: "masteragent",
            });
          } else if (res.data.accountType === 2) {
            setAccount({
              username: res.data.username,
              accountID: res.data.accountId,
              accountType: "agent",
            });
          } else if (res.data.accountType === 3) {
            setAccount({
              username: res.data.username,
              accountID: res.data.accountId,
              accountType: "player",
            });
          }
          axios({
            method: "get",
            url: `${hostHeader}/getWalletBalance/16`,
            headers: headers,
          })
            .then((res2) => {
              const walletBalance = res2.data.wallet;
              setWalletBalance(walletBalance);
            })
            .catch((err) => {
              console.log(err);
            });
          setIsLoggedIn(true);
        }
      })
      .catch((err) => {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        setAccount({
          username: "",
          accountType: "",
          accountID: "",
        });
        console.log("YOUR TOKEN HAS EXPIRED");
      });
  }, []);

  function loginHandler(person) {
    if (person.username === "") {
      setErrorMessage("Username can't be empty");
    } else if (person.password === "") {
      setErrorMessage("Password can't be empty");
    } else {
      axios({
        method: "post",
        url: `${hostHeader}/login`,
        headers: headers,
        data: {
          username: person.username,
          password: person.password,
        },
      })
        .then((res) => {
          const accountType = res.data.accountType;
  
          if (accountType === 0) {
            setAccount({
              username: person.username,
              accountType: "admin",
            });
          } else if (accountType === 1) {
            setAccount({
              username: person.username,
              accountType: "masteragent",
            });
          } else if (accountType === 2) {
            setAccount({
              username: person.username,
              accountType: "agent",
            });
          } else if (accountType === 3) {
            setAccount({
              username: person.username,
              accountType: "player",
            });
          }
          setAccount((prev) => {
            return {
              ...prev,
              accountID: res.data.accountId,
            };
          });
          const token = res.data.token;
          localStorage.setItem("token", token);
          //GET WALLET BALANCE
          axios({
            method: "get",
            url: `${hostHeader}/getWalletBalance/16`,
            headers: headers,
          })
            .then((res2) => {
              const walletBalance = res2.data.wallet;
              setWalletBalance(walletBalance);
            })
            .catch((err) => {
              console.log(err);
            });
          setIsLoggedIn(true);
        })
        .catch((err) => {
          toast.error("Invalid credentials");
        });
    }

  }

  function handleLogOut() {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  }

  // function handleWallet(e){
  //   console.log(e);
  // }

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: isLoggedIn,
        errorMessage: errorMessage,
        loginHandler: loginHandler,
        handleLogOut: handleLogOut,
        user: account,
        hostHeader: hostHeader,
        walletBalance: walletBalance,
        // handleWallet: handleWallet
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}

// ACCOUNT TYPES

// 0 admin
// 1 masteragent
// 2 agent
// 3 player
