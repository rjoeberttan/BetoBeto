import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import YoutubeEmbed from "../Youtube";
import TextScroller from "../TextScroller";
import { AuthContext } from "../../store/auth-context";
import socket from "../Websocket/socket";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-toastify/dist/ReactToastify.min.css";
import "./PlayerSakla.css";
import CARD from "./1_BASTOS.PNG";
import CARD2 from "./1_ESPADA.PNG";
import CardModal from "./CardModal";
const axios = require("axios");

function PlayerSakla() {
  //===========================================
  // Global Variables and useState init
  //===========================================
  const ctx = useContext(AuthContext);
  const [placeBetDisabled, setPlaceBetDisabled] = useState(false);
  const [placeTipDisabled, setPlaceTipDisabled] = useState(false);
  const [placeBetText, setPlaceBetText] = useState("Place Bet");
  const [results, setResults] = useState([]);
  const [gameDetails, setGameDetails] = useState({
    banner: "",
    description: "",
    is_live: "",
    max_bet: "",
    min_bet: "",
    name: "",
    draw_multip: 0.00,
    youtube_url: "",
  });
  const [marketDetails, setMarketDetails] = useState({
    description: "",
    market_id: "",
    status: "",
    result: "",
  });
  const [statusStyle, setStatusStyle] = useState({ color: "" });
  const [stake, setStake] = useState(0);
  const [tip, setTip] = useState();
  const [betslip, setBetslip] = useState([]);
  const { gameid } = useParams();
  const gameHeader = process.env.REACT_APP_HEADER_GAME;
  const betHeader = process.env.REACT_APP_HEADER_BET;
  const accountHeader = process.env.REACT_APP_HEADER_ACCOUNT;
  const gameAuthorization = { "Authorization": process.env.REACT_APP_KEY_GAME };
  const accAuthorization = {
    "Authorization": process.env.REACT_APP_KEY_ACCOUNT,
  };
  const betAuthorization = { "Authorization": process.env.REACT_APP_KEY_BET };
  const [bet, setBet] = useState();
  
  //===========================================
  // UseEffect
  //===========================================
  useEffect(() => {
    
    getLatestGameDetails();
    getLatestMarketDetails();
    getMarketTrend();
    socket.emit("join_room", "totalisatorGame");
    // eslint-disable-next-line react-hooks/exhaustive-deps


    const interval2 = setInterval(() => {
      axios({
        method: "get",
        url: `${accountHeader}/getWalletBalance/${ctx.user.accountID}`,
        headers: accAuthorization,
      })
        .then((res) => {
          const walletBalance = res.data.wallet;
          ctx.walletHandler(walletBalance);
        })
        .catch((err) => {
          console.log(err);
        });
    }, 2000);
  }, []);

  function getMarketTrend() {
    axios({
      method: "get",
      url: `${gameHeader}/getMarketTrend/${gameid}`,
      headers: gameAuthorization,
    }).then((res) => {
      console.log(res.data.data.trends);
      setResults(res.data.data.trends)
    });
  }

  function getLatestGameDetails() {
    axios({
      method: "get",
      url: `${gameHeader}/getGameDetails/${gameid}`,
      headers: gameAuthorization,
    }).then((res) => {
      //get game details
      const { data } = res.data;
      setGameDetails({
        banner: data.banner,
        description: data.description,
        is_live: data.is_live,
        max_bet: data.max_bet,
        min_bet: data.min_bet,
        name: data.name,
        draw_multip: data.win_multip1, //draw
        youtube_url: data.youtube_url,
        
      });       
    });

  }

  function getBetSlips(marketid) {
    axios({
      method: "get",
      url: `${betHeader}/getAccountBetslips/${ctx.user.accountID}/${marketid}`,
      headers: betAuthorization,
    })
      .then((res) => {
        setBetslip(res.data.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function manageStatusStyle(marketStatus) {
    if (marketStatus === 0) {
      setStatusStyle({ color: "green" });
    } else if (marketStatus === 1) {
      setStatusStyle({ color: "red" });
    } else if (marketStatus === 2) {
      setStatusStyle({ color: "purple" });
    }
  }

  function getLatestMarketDetails() {
    //get market details
    axios({
      method: "get",
      url: `${gameHeader}/getLatestMarketDetails/${gameid}/${gameDetails.name}`,
      headers: gameAuthorization,
    }).then((res) => {
      //get game details
      const { market } = res.data.data;
      setMarketDetails({
        description: market.description,
        market_id: market.market_id,
        status: market.status,
        result: market.result,
      });
      manageStatusStyle(market.status);
      handlePlaceBetButtonStatus(market.status);
      getBetSlips(market.market_id);

      axios({
        method: "get",
        url: `${gameHeader}/getTotalisatorOdds/${gameid}/${market.market_id}`,
        headers: {
          "Authorization": process.env.REACT_APP_KEY_GAME,
        },
      }).then((res) => {
      });
    });
  }

  const [blink, setBlink] = useState();
  //===========================================
  // Websocket Functions
  //===========================================
  useEffect(() => {
    socket.on("received_totalisator_market_update", (data) => {
      if (data.gameId === gameid) {
        setMarketDetails((prev) => {
          return {
            ...prev,
            market_id: data.marketId,
            status: data.status,
          };
        });
        manageStatusStyle(data.status);
        handlePlaceBetButtonStatus(data.status);
        console.log(data.marketId)
        getBetSlips(data.marketId)
        // setTimeout(() => {
        //   getBetSlips(data.market_id);
        // }, 1000);
  
        var newStatus = data.status;
        // Update wallet Balance if Market is Resulted
        if (newStatus === 2) {
          setTimeout(() => {
            getMarketTrend();
            getBetSlips(data.marketId)
            axios({
              method: "get",
              url: `${accountHeader}/getWalletBalance/${ctx.user.accountID}`,
              headers: accAuthorization,
            })
              .then((res) => {
                const walletBalance = res.data.wallet;
                ctx.walletHandler(walletBalance);
                toast.info("Wallet Balance Updated");
              })
              .catch((err) => {
                console.log(err);
              });
          }, 2000);
        }
      }
    });
   
  // Styles
  // const [odd1Up, setOdd1Up] = useState(false)
  // const [odd1Down, setOdd1Down] = useState(false)
  // const [odd2Up, setOdd2Up] = useState(false)
  // const [odd2Down, setOdd2Down] = useState(false)
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  //===========================================
  // Handle Change and Button Click Functions
  //===========================================
  function placeBet(e) {
    //Disable Button for 5 seconds
    setPlaceBetDisabled(true);
    setPlaceBetText("Please Wait");
    
    handlePotentialWin();
    const data = {
      marketId: marketDetails.market_id,
      gameId: gameid,
      accountId: ctx.user.accountID,
      gameName: gameDetails.name,
      choice: bet,
      stake: stake,
      wallet: ctx.walletBalance,
      maxBet: gameDetails.max_bet,
    };

    var stakeAmt = parseFloat(stake);
    var minBet = parseFloat(gameDetails.min_bet).toFixed(2);
    var maxBet = parseFloat(gameDetails.max_bet).toFixed(2);

    if (minBet > stakeAmt || stakeAmt > maxBet) {
      toast.error(`Acceptable stake amount: ₱${minBet}-₱${maxBet}`);
    } else {
      axios({
        method: "get",
        url: `${accountHeader}/isAccountLocked/${ctx.user.accountID}`,
        headers: accAuthorization
      })
      .then((res) => {
        console.log(res.data.status)
        var isLocked = !res.data.status
        
        if (isLocked){
          toast.error("Account is locked. Bet is not placed. Please contact your agent.")
          setTimeout(() => {
            setPlaceBetText("Place Bet");
            setPlaceBetDisabled(false);
            setStake("");
          }, 5000);
        } else {
          axios({
            method: "post",
            url: `${betHeader}/placeTotalisatorBet`,
            headers: betAuthorization,
            data: data,
          })
            .then((res) => {
              const newWallet = parseFloat(ctx.walletBalance) - parseFloat(stake);
              ctx.walletHandler(newWallet);
              getBetSlips(marketDetails.market_id);
    
              setTimeout(() => {
                setPlaceBetText("Place Bet");
                setPlaceBetDisabled(false);
              }, 5000);
              toast.success(
                `Placed Bet successfully. BetId: ${res.data.data.betId}`,
                {
                  autoClose: 2000,
                }
              );
    
            })
            .catch((err) => {
              toast.error(err.response.data.message);
            });
        }
      })
      .catch((err) => {
        toast.error("Server Error")
        setTimeout(() => {
          setPlaceBetText("Place Bet");
          setPlaceBetDisabled(false);
          setStake("");
        }, 5000);
      })
    }
    setBet("");
    setPotentialWin(0)
  }

  function handleStakeChange(e) {
    handlePotentialWin(e.target.value, bet);
    const currentStake = parseFloat(e.target.value).toFixed(0);
    const walletBalance = parseFloat(ctx.walletBalance);

    if (currentStake > walletBalance || marketDetails.status !== 0) {
      setStake(parseFloat(e.target.value).toFixed(0));
      setPlaceBetDisabled(true);
    } else {
      setPlaceBetDisabled(false);
      setStake(parseFloat(e.target.value).toFixed(0));
    }
  }

  function handlePlaceBetButtonStatus(status) {
    if (status !== 0) {
      setPlaceBetDisabled(true);
    } else {
      setPlaceBetDisabled(false);
    }
  }

  function sendTip() {
    if (!tip) {
      toast.error("Sorry. Tip box can't be empty.", {
        autoClose: 1500,
      });
    } else {
      const data = {
        accountId: ctx.user.accountID,
        amount: tip,
        wallet: ctx.walletBalance,
      };

      axios({
        method: "post",
        url: `${betHeader}/sendTip`,
        headers: betAuthorization,
        data: data,
      })
        .then((res) => {
          const newWallet = parseFloat(ctx.walletBalance) - parseFloat(tip);
          ctx.walletHandler(newWallet);
          toast.success(`Thanks for the tip! Enjoy the game`, {
            autoClose: 1500,
          });
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }

  function handleTipChange(e) {
    const input = e.target.value;
    const inputNum = parseFloat(e.target.value);

    if (inputNum < 9999999999) {
      if (input.indexOf(".") > 0) {
        const decimalLength = input.length - input.indexOf(".") - 1;
        if (decimalLength < 3) {
          const currenttip = parseFloat(e.target.value);
          const walletBalance = parseFloat(ctx.walletBalance);
          if (currenttip > walletBalance) {
            setPlaceTipDisabled(true);
            setTip(parseFloat(e.target.value));
          } else {
            setPlaceTipDisabled(false);
            setTip(parseFloat(e.target.value));
          }
        }
      } else {
        const currenttip = parseFloat(e.target.value);
        const walletBalance = parseFloat(ctx.walletBalance);
        if (currenttip > walletBalance) {
          setPlaceTipDisabled(true);
          setTip(parseFloat(e.target.value));
        } else {
          setPlaceTipDisabled(false);
          setTip(parseFloat(e.target.value));
        }
      }
    }
  }

  function handleChange(e) {
    setBet(e.target.value);
    handlePotentialWin(stake, e.target.value)
  }

  function renderBetslips() {
    if (betslip.length === 0) {
      return <h4>No Open Betslips</h4>;
    } else {
      return (
        <div>
          {betslip.map((x) => (
            <div
              class="card text-white bg-secondary mb-3"
              style={{ height: "150px" }}
            >
              <h5>
                Bet #{x.bet_id} {x.description} <br></br> Market #{x.market_id}
              </h5>

              <p style={{ margin: "0px" }}>
                Status:{" "}
                {x.status === 0 ? "Pending" : x.status === 1 ? "Lose" : "Win"}
              </p>
              <p style={{ margin: "0px" }}>Stake: ₱{x.stake.toFixed(2)}</p>
              {x.status === 2 && <p>Winnings: ₱{x.winnings.toFixed(2)}</p>}
            </div>
          ))}
        </div>
      );
    }
  }

  const [potentialWin, setPotentialWin] = useState(0);

  function handlePotentialWin(amount, betChoice){
   
  }  

  function handleCardClick(e){
    //
    alert("hello");
  }

  return (
    <div className="container text-light container-game-room">
      <ToastContainer />
      <div className="heading-text">
        <h1 className="display-5 small-device bold-small">
          Live {gameDetails.name}
        </h1>
      </div>
      <div className="row">
        <div className="col-md-12 banner-message">
          <TextScroller text={gameDetails.banner} />
        </div>
        {/* PLAYER CARDS */}
        <div className="col-md-12 cardContainer">
            <div className="row text-center offset-md-1" style={{marginTop: "20px"}}>
              <CardModal />
              <CardModal />
              <CardModal />
              <CardModal />
              <CardModal />
              <CardModal />
              <CardModal />
              <CardModal />
              <CardModal />
              <CardModal />
            </div>
            <div className="row text-center offset-md-1" style={{marginTop: "20px"}}>
              <CardModal />
              <CardModal />
              <CardModal />
              <CardModal />
              <CardModal />
              <CardModal />
              <CardModal />
              <CardModal />
              <CardModal />
              <CardModal />
            </div>
        </div>
      </div>

      
      <div className="row">
          <div className="col-md-8" >
          {/* Market ID AND Bet Status */}
            <div className="col-md-12" style={{maxHeight: "75px", padding: "10px", marginBottom: "10px", backgroundColor: "#FFF"}}>
              <div className="row">
                <h5 className="col-md-6" style={{color: "black"}}>
                  Current Market ID: {marketDetails.market_id}
                </h5>
                <h5 className="col-md-6" style={statusStyle} >
                  <b>Betting Status:</b>{" "}
                  {marketDetails.status === 0
                    ? " OPEN"
                    : marketDetails.status === 1
                    ? " CLOSED"
                    : " RESULTED"}
                </h5>
              </div>
            </div>

            {/* Youtube */}
            <div className="col-md-12" style={{marginBottom: "10px"}}>
              <YoutubeEmbed embedId={gameDetails.youtube_url} />
            </div>

            {/* MARKET RESULTS */}
            <div className="col-md-12" style={{marginBottom: "10px"}}>
              <div className="text-center">
                <div className="card text-black">
                  <div className="card-body table-responsive-sm">
                    <h4 className="card-title">Market Results:</h4>
                    <div class="row results-padding">
                      {results.map((x) => {
                        return (
                          <div class="col-md-2 col-6 results-margin results-box-padding" style={(x.result === "PUTI" || x.result === "HIGH") ? {backgroundColor: "rgb(119, 196, 226)", border: "1px solid black"} : (x.result === "PULA" || x.result === "LOW") ? {backgroundColor: "#dd3d3d", border: "1px solid black"} : {backgroundColor: "#a333c8", border: "1px solid black"}}>
                            {x.market_id}
                          </div>
                        )
                        
                      })}

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
            {/* BetSlips */}
            <div className="col-md-12" style={{maxHeight: "544px", marginBottom: "10px", overflow: "auto"}}>
              <div className="card text-black">
                <div className="card-body table-responsive-sm">
                  <h4 className="card-title">Bets Placed</h4>
                  {renderBetslips()}
                </div>
              </div>
            </div>

            {/* Donation Box */}
            <div className="col-md-12">
              <div className="text-center">
                <div className="card text-black" style={{ height: "250px" }}>
                  <div className="card-body">
                    <h5 className="card-title" style={{ marginTop: "50px" }}>
                      Donation Box
                    </h5>
                    <p className="card-text">
                      If you enjoy playing, you can tip me!
                    </p>
                    <div className="input-group mb-2">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="P500"
                        onChange={handleTipChange}
                        value={tip}
                      />
                      <button
                        className="btn btn-color text-light"
                        type="button"
                        onClick={sendTip}
                        disabled={placeTipDisabled}
                      >
                        Tip
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>

      <div className="row">
        {/* <div className="label-margin col-md-4">
          <div className="text-center">
            <div className="card text-black" style={{ height: "250px" }}>
              <div className="card-body">
                <h5 className="card-title" style={{ marginTop: "50px" }}>
                  Donation Box
                </h5>
                <p className="card-text">
                  If you enjoy playing, you can tip me!
                </p>
                <div className="input-group mb-2">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="P500"
                    onChange={handleTipChange}
                    value={tip}
                  />
                  <button
                    className="btn btn-color text-light"
                    type="button"
                    onClick={sendTip}
                    disabled={placeTipDisabled}
                  >
                    Tip
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div> */}
        {/* Result Box */}
        {/* <div className="label-margin col-md-4">
          <div className="text-center">
            <div className="card text-black">
              <div className="card-body table-responsive-sm">
                <h4 className="card-title">Market Results:</h4>
                <div class="row results-padding">
                  {results.map((x) => {
                    return (
                      <div class="col-md-2 col-6 results-margin results-box-padding" style={(x.result === "PUTI" || x.result === "HIGH") ? {backgroundColor: "rgb(119, 196, 226)", border: "1px solid black"} : (x.result === "PULA" || x.result === "LOW") ? {backgroundColor: "#dd3d3d", border: "1px solid black"} : {backgroundColor: "#a333c8", border: "1px solid black"}}>
                        {x.market_id}
                      </div>
                    )
                    
                  })}

                </div>
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}

export default PlayerSakla;
