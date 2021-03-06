import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
const axios = require("axios").default;

export const AuthContext = React.createContext({});

export default function AuthContextProvider(props) {
  const accountHeader = process.env.REACT_APP_HEADER_ACCOUNT;
  const accAuthorization = {
    "Authorization": process.env.REACT_APP_KEY_ACCOUNT,
  };
  const [account, setAccount] = useState({
    username: "",
    accountType: "",
    accountID: "",
    email: "",
    phoneNum: "",
    commission: ""
  });
  const [walletBalance, setWalletBalance] = useState(null);
  const [commission, setCommission] = useState(null)

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  //WHEN USER REFRESH, CHECK IF STILL LOGGED IN (TOKEN)
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios({
      method: "get",
      url: `${accountHeader}/isUserAuth`,
      headers: {
        "x-access-token": token,
        "Authorization": process.env.REACT_APP_KEY_ACCOUNT,
      },
    })
      .then((res) => {
        if (res.status === 200) {
          if (res.data.accountType === 0) {
            setAccount({
              username: res.data.username,
              accountID: res.data.accountId,
              accountType: "admin",
              email: res.data.email,
              phoneNum: res.data.phoneNum,
            });
          } else if (res.data.accountType === 1) {
            setAccount({
              username: res.data.username,
              accountID: res.data.accountId,
              accountType: "masteragent",
              email: res.data.email,
              phoneNum: res.data.phoneNum,
            });
          } else if (res.data.accountType === 2) {
            setAccount({
              username: res.data.username,
              accountID: res.data.accountId,
              accountType: "agent",
              email: res.data.email,
              phoneNum: res.data.phoneNum,
            });
          } else if (res.data.accountType === 3) {
            setAccount({
              username: res.data.username,
              accountID: res.data.accountId,
              accountType: "player",
              email: res.data.email,
              phoneNum: res.data.phoneNum,
            });
          } else if (res.data.accountType === 4) {
            setAccount({
              username: res.data.username,
              accountID: res.data.accountId,
              accountType: "declarator",
              email: res.data.email,
              phoneNum: res.data.phoneNum,
            });
          } else if (res.data.accountType === 5) {
            setAccount({
              username: res.data.username,
              accountID: res.data.accountId,
              accountType: "grandmaster",
              email: res.data.email,
              phoneNum: res.data.phoneNum,
            });
          }
          axios({
            method: "get",
            url: `${accountHeader}/getWalletBalance/${res.data.accountId}`,
            headers: accAuthorization,
          })
            .then((res2) => {
              const walletBalance = res2.data.wallet;
              setWalletBalance(walletBalance);
            })
            .catch((err) => {
              console.log(err);
            });

          axios({
              method: "get",
              url: `${accountHeader}/getCommission/${res.data.accountId}`,
              headers: accAuthorization,
            })
              .then((res3) => {
                console.log(res3)
                const commission = res3.data.commission;
                setCommission(commission);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function walletHandler(wallet) {
    setWalletBalance(wallet);
  }

  function loginHandler(person) {
    console.log(accountHeader);
    if (person.username === "") {
      setErrorMessage("Username can't be empty");
    } else if (person.password === "") {
      setErrorMessage("Password can't be empty");
    } else {
      axios({
        method: "post",
        url: `${accountHeader}/login`,
        headers: accAuthorization,
        data: {
          username: person.username,
          password: person.password,
        },
      })
        .then((res) => {
          if (res.data.accountStatus === 1) {
            const accountType = res.data.accountType;

            if (
              (accountType === 0 || accountType === 4) &&
              window.location.pathname === "/admin"
            ) {
              console.log("ok admin && declarator");
              if (accountType === 0) {
                setAccount({
                  username: person.username,
                  email: res.data.email,
                  phoneNum: res.data.phoneNum,
                  accountType: "admin",
                });
              } else if (accountType === 4) {
                setAccount({
                  username: res.data.username,
                  accountID: res.data.accountId,
                  accountType: "declarator",
                  email: res.data.email,
                  phoneNum: res.data.phoneNum,
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
                url: `${accountHeader}/getWalletBalance/${res.data.accountId}`,
                headers: accAuthorization,
              })
                .then((res2) => {
                  const walletBalance = res2.data.wallet;
                  setWalletBalance(walletBalance);
                })
                .catch((err) => {
                  console.log(err);
                });

              axios({
                  method: "get",
                  url: `${accountHeader}/getCommission/${res.data.accountId}`,
                  headers: accAuthorization,
                })
                  .then((res3) => {
                    console.log(res3)
                    const commission = res3.data.commission;
                    setCommission(commission);
                  })
                  .catch((err) => {
                    console.log(err);
                  });
              setIsLoggedIn(true);
            } else if (
              accountType !== 0 &&
              accountType !== 4 &&
              window.location.pathname === "/"
            ) {
              console.log("ok agent, ma, p");
              if (accountType === 1) {
                setAccount({
                  username: person.username,
                  email: res.data.email,
                  phoneNum: res.data.phoneNum,
                  accountType: "masteragent",
                  commission: res.data.commission,
                });
              } else if (accountType === 2) {
                setAccount({
                  username: person.username,
                  email: res.data.email,
                  phoneNum: res.data.phoneNum,
                  accountType: "agent",
                  commission: res.data.commission,
                });
              } else if (accountType === 3) {
                setAccount({
                  username: person.username,
                  email: res.data.email,
                  phoneNum: res.data.phoneNum,
                  commission: res.data.commission,
                  accountType: "player",
                });
              } else if (accountType === 5) {
                setAccount({
                  username: person.username,
                  email: res.data.email,
                  phoneNum: res.data.phoneNum,
                  accountType: "grandmaster",
                  commission: res.data.commission,
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
                url: `${accountHeader}/getWalletBalance/${res.data.accountId}`,
                headers: accAuthorization,
              })
                .then((res2) => {
                  const walletBalance = res2.data.wallet;
                  setWalletBalance(walletBalance);
                })
                .catch((err) => {
                  console.log(err);
                });
              
              axios({
                  method: "get",
                  url: `${accountHeader}/getCommission/${res.data.accountId}`,
                  headers: accAuthorization,
                })
                  .then((res3) => {
                    console.log(res3)
                    const commission = res3.data.commission;
                    setCommission(commission);
                  })
                  .catch((err) => {
                    console.log(err);
                  });
              setIsLoggedIn(true);
            } else {
              toast.error("Invalid login page");
            }
          } else {
            toast.error("Your account is locked, please contact your Agent");
          }
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
        walletHandler: walletHandler,
        user: account,
        hostHeader: accountHeader,
        walletBalance: walletBalance,
        commission: commission
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
