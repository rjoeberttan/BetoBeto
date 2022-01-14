import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import YoutubeEmbed from "../Youtube";
import TextScroller from "../TextScroller";
import "./LiveRoom.css";
import { AuthContext } from "../../store/auth-context";
import socket from "../Websocket/socket";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-toastify/dist/ReactToastify.min.css";
const axios = require("axios");

function LiveRoom() {
  //===========================================
  // Global Variables and useState init
  //===========================================
  const ctx = useContext(AuthContext);
  const [color, setColor] = useState("red");
  const [placeBetDisabled, setPlaceBetDisabled] = useState(false);
  const [placeTipDisabled, setPlaceTipDisabled] = useState(false);
  const [placeBetText, setPlaceBetText] = useState("Place Bet");
  const [gameDetails, setGameDetails] = useState({
    banner: "",
    description: "",
    is_live: "",
    max_bet: "",
    min_bet: "",
    name: "",
    win_multip1: "",
    win_multip2: "",
    win_multip3: "",
    youtube_url: "",
  });
  const [marketDetails, setMarketDetails] = useState({
    description: "",
    market_id: "",
    status: "",
    result: "",
  });
  const [statusStyle, setStatusStyle] = useState({color: ""})
  const [betTotals, setBetTotals] = useState({
    RED: "0.00",
    BLUE: "0.00",
    GREEN: "0.00",
    WHITE: "0.00",
    PURPLE: "0.00",
    YELLOW: "0.00",
  });
  const [stake, setStake] = useState();
  const [tip, setTip] = useState();
  const { gameId } = useParams();
  const gameHeader = process.env.REACT_APP_HEADER_GAME;
  const betHeader = process.env.REACT_APP_HEADER_BET;
  const accountHeader = process.env.REACT_APP_HEADER_ACCOUNT;
  const gameAuthorization = { "Authorization": process.env.REACT_APP_KEY_GAME };
  const accAuthorization = { "Authorization": process.env.REACT_APP_KEY_ACCOUNT};
  const betAuthorization = { "Authorization": process.env.REACT_APP_KEY_BET };

  //===========================================
  // UseEffect
  //===========================================
  useEffect(() => {
    socket.emit("join_room", "colorGame");
    getLatestGameDetails();
    getLatestMarketDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      getColorGameBetTotals()
    }, 5000);

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketDetails]);

  function getLatestGameDetails() {
    axios({
      method: "get",
      url: `${gameHeader}/getGameDetails/${gameId}`,
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
        win_multip1: data.win_multip1,
        win_multip2: data.win_multip2,
        win_multip3: data.win_multip3,
        youtube_url: data.youtube_url,
      });
    });
  }

  function manageStatusStyle(marketStatus){
    if (marketStatus === 0){
      setStatusStyle({color: "green"})
    } else if (marketStatus === 1) {
      setStatusStyle({color: "red"})
    } else if (marketStatus === 2) {
      setStatusStyle({color: "purple"})
    } 
  }

  function getLatestMarketDetails() {
    //get market details
    axios({
      method: "get",
      url: `${gameHeader}/getLatestMarketDetails/${gameId}/${gameDetails.name}`,
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
      manageStatusStyle(market.status)
      handlePlaceBetButtonStatus(market.status);
    });
  }

  function getColorGameBetTotals() {
    axios({
      method: "get",
      url: `${gameHeader}/getColorGameBetTotals/${gameId}/${marketDetails.market_id}/${gameDetails.name}`,
      headers: {
        "Authorization": process.env.REACT_APP_KEY_GAME
      },
    })
      .then((res) => {
        const values = res.data.data;
        setBetTotals({
          BLUE: values[0].total,
          WHITE: values[1].total,
          RED: values[2].total,
          GREEN: values[3].total,
          YELLOW: values[4].total,
          PURPLE: values[5].total,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  //===========================================
  // Websocket Functions
  //===========================================
  useEffect(() => {
    socket.on("received_market_update", (data) => {
      console.log("received")
      setMarketDetails((prev) => {
        return {
          ...prev,
          market_id: data.marketId,
          status: data.status,
        };
      });
      manageStatusStyle(data.status)
      handlePlaceBetButtonStatus(data.status);

      var newStatus = data.status
      // Update wallet Balance if Market is Resulted
      if (newStatus === 2){
        setTimeout(() => {
          console.log("do this")
          axios({
            method: "get",
            url: `${accountHeader}/getWalletBalance/${ctx.user.accountID}`,
            headers: accAuthorization,
          })
            .then((res) => {
              const walletBalance = res.data.wallet;
              ctx.walletHandler(walletBalance)
              toast.info("Wallet Balance Updated")
            })
            .catch((err) => {
              console.log(err);
              
            });
        }, 2000);
        
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  //===========================================
  // Handle Change and Button Click Functions
  //===========================================
  function placeBet(e) {
    const data = {
      marketId: marketDetails.market_id,
      gameId: gameId,
      accountId: ctx.user.accountID,
      gameName: gameDetails.name,
      choice: color.toUpperCase(),
      stake: stake,
      wallet: ctx.walletBalance,
      maxBet: gameDetails.max_bet
    };

    var stakeAmt= parseFloat(stake)
    var minBet = parseFloat(gameDetails.min_bet).toFixed(2)
    var maxBet = parseFloat(gameDetails.max_bet).toFixed(2)

    if ((minBet > stakeAmt) || (stakeAmt > maxBet)){
      toast.error(`Acceptable stake amount: ₱${minBet}-₱${maxBet}`)
    } else {
      axios({
        method: "post",
        url: `${betHeader}/placeBet`,
        headers: betAuthorization,
        data: data,
      })
        .then((res) => {
          console.log(res);
          const newWallet = parseFloat(ctx.walletBalance) - parseFloat(stake);
          ctx.walletHandler(newWallet);
  
          //Disable Button for 5 seconds
          setPlaceBetDisabled(true);
          setPlaceBetText("Please Wait");
  
          setTimeout(() => {
            setPlaceBetText("Place Bet");
            setPlaceBetDisabled(false);
            setStake('');
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
  }

  function handleStakeChange(e) {

    const currentStake = parseFloat(e.target.value).toFixed(0);
    const walletBalance = parseFloat(ctx.walletBalance);

    if (currentStake > walletBalance || marketDetails.status !== 0) {
      console.log(currentStake, walletBalance)
      console.log("Insufficient Funds");
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

      console.log(data);

      axios({
        method: "post",
        url: `${betHeader}/sendTip`,
        headers: betAuthorization,
        data: data,
      })
        .then((res) => {
          console.log(res);
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
    const input = (e.target.value)
    const inputNum = parseFloat(e.target.value)

    if (inputNum < 9999999999) {
      if (input.indexOf('.') > 0) {
        console.log("found")  
        const decimalLength = input.length - input.indexOf('.') - 1;
        console.log(decimalLength)
        if (decimalLength < 3){
          const currenttip = parseFloat(e.target.value);
          const walletBalance = parseFloat(ctx.walletBalance);
          if (currenttip > walletBalance) {
            setPlaceTipDisabled(true);
            setTip(parseFloat(e.target.value))
          } else {
            setPlaceTipDisabled(false);
            setTip(parseFloat(e.target.value))
        }
        console.log("still in here")
      }
      } else {
          const currenttip = parseFloat(e.target.value);
          const walletBalance = parseFloat(ctx.walletBalance);
          if (currenttip > walletBalance) {
            setPlaceTipDisabled(true);
            setTip(parseFloat(e.target.value))
          } else {
            setPlaceTipDisabled(false);
            setTip(parseFloat(e.target.value))
      }
    }
  }
  }



  function handleChange(e) {
    const { value } = e.target;
    setColor(value);
  }

  const style = {
    backgroundColor: "",
  };

  if (color === "red") {
    style.backgroundColor = "#db2828";
  } else if (color === "blue") {
    style.backgroundColor = "#2185d0";
  } else if (color === "green") {
    style.backgroundColor = "#21ba45";
  } else if (color === "yellow") {
    style.backgroundColor = "#fbbd08";
  } else if (color === "white") {
    style.backgroundColor = "aliceblue";
  } else if (color === "purple") {
    style.backgroundColor = "#a333c8";
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
        <div className="col-md-8">
          <YoutubeEmbed embedId={gameDetails.youtube_url} />
        </div>
        <div className="col-md-4 live-room-colorbox">
          <div className="card txt-black">
            <div className="card-body">
              <h4 className="card-title">
                Current Market ID: {marketDetails.market_id}
              </h4>
              <h5 className="card-text" style={statusStyle}>
                Betting Status:{" "}
                  {marketDetails.status === 0
                  ? " OPEN"
                  : marketDetails.status === 1
                  ? " CLOSED"
                  : " RESULTED"}
              </h5>
                <p className="card-text">
                Min/Max Bet: ₱{parseFloat(gameDetails.min_bet).toFixed(2)} - ₱{parseFloat(gameDetails.max_bet).toFixed(2)}

              </p>
              <div className="row text-center">
                <label className="col-sm-3 col-5 red-box radio-button fix-padding-left">
                  <input
                    className="radio-card"
                    type="radio"
                    name="colors"
                    value="red"
                    onChange={handleChange}
                  />
                  <label className="color-name">Total: ₱ {betTotals.RED}</label>
                </label>
                <label className="col-sm-3 col-5 blue-box radio-button fix-padding-left">
                  <input
                    className="radio-card"
                    type="radio"
                    name="colors"
                    value="blue"
                    onChange={handleChange}
                  />
                  <label className="color-name">
                    Total: ₱ {betTotals.BLUE}
                  </label>
                </label>
                <label className="col-sm-3 col-5 green-box radio-button fix-padding-left">
                  <input
                    className="radio-card"
                    type="radio"
                    name="colors"
                    value="green"
                    onChange={handleChange}
                  />
                  <label htmlFor="huey" className="color-name">
                    Total: ₱ {betTotals.GREEN}
                  </label>
                </label>
                <label className="col-sm-3 col-5 yellow-box radio-button fix-padding-left">
                  <input
                    className="radio-card"
                    type="radio"
                    name="colors"
                    value="yellow"
                    onChange={handleChange}
                  />
                  <label htmlFor="huey" className="color-name">
                    Total: ₱ {betTotals.YELLOW}
                  </label>
                </label>
                <label className="col-sm-3 col-5 white-box radio-button fix-padding-left">
                  <input
                    className="radio-card"
                    type="radio"
                    name="colors"
                    value="white"
                    onChange={handleChange}
                  />
                  <label htmlFor="huey" className="color-name">
                    Total: ₱ {betTotals.WHITE}
                  </label>
                </label>
                <label className="col-sm-3 col-5 purple-box radio-button fix-padding-left">
                  <input
                    className="radio-card"
                    type="radio"
                    name="colors"
                    value="purple"
                    onChange={handleChange}
                  />
                  <label htmlFor="huey" className="color-name">
                    Total: ₱ {betTotals.PURPLE}
                  </label>
                </label>
              </div>
              <div className="row wallet-box">
                <div className="col-md-4 col-3">
                  <div className="stake-box" style={style}>
                    Stake
                  </div>
                </div>
                <div className="col-md-7 col-8 input-box">
                  <input
                    type="number"
                    className="form-control"
                    onWheel={(e) => e.target.blur()}
                    placeholder={`₱${parseFloat(gameDetails.min_bet).toFixed(2)}-₱${parseFloat(gameDetails.max_bet).toFixed(2)} `}
                    onChange={handleStakeChange}
                    value={stake}
                  />
                </div>
              </div>
              <div className="col-md-12 text-center">
                <button
                  type="submit"
                  className="btn btn-color game-btn text-light"
                  disabled={placeBetDisabled}
                  onClick={placeBet}
                >
                  {placeBetText}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="label-margin">
        <div className="text-center">
          <div className="card text-black">
            <div className="card-body">
              <h5 className="card-title">Donation Box</h5>
              <p className="card-text">If you enjoy playing, you can tip me!</p>
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
  );
}

export default LiveRoom;
