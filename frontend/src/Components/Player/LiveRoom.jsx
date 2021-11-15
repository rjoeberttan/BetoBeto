import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import YoutubeEmbed from "../Youtube";
import TextScroller from "../TextScroller";
import "./LiveRoom.css";
import { socketIOClient, io } from "socket.io-client";
import { AuthContext } from "../../store/auth-context";
import socket from "../Websocket/socket";

import { ToastContainer, toast, Zoom, Bounce } from "react-toastify";
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
  const [placeBetText, setPlaceBetText] = useState("Place Bet")
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
  const [betTotals, setBetTotals] = useState({
    RED: "0.00",
    BLUE: "0.00",
    GREEN: "0.00",
    WHITE: "0.00",
    PURPLE: "0.00",
    YELLOW: "0.00",
  });
  const [stake, setStake] = useState(0);
  const [tip, setTip] = useState(0);
  const { gameId } = useParams();
  const accountHeader = "http://localhost:4003";
  const gameHeader = "http://localhost:4004";
  const betHeader = "http://localhost:4005";
  socket.emit("join_room", "colorGame");

  //===========================================
  // UseEffect
  //===========================================
  useEffect(() => {
    getLatestGameDetails();
    getLatestMarketDetails();
  }, []);

  useEffect(() => {
    getColorGameBetTotals();
  }, [marketDetails]);

  function getLatestGameDetails() {
    axios({
      method: "get",
      url: `${gameHeader}/getGameDetails/${gameId}`,
      headers: {
        "Authorization": "Q@k=jLc-3CCK3Fc%",
      },
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

  function getLatestMarketDetails() {
    //get market details
    axios({
      method: "get",
      url: `${gameHeader}/getLatestMarketDetails/${gameId}`,
      headers: {
        "Authorization": "Q@k=jLc-3CCK3Fc%",
      },
    }).then((res) => {
      //get game details
      const { market } = res.data.data;
      setMarketDetails({
        description: market.description,
        market_id: market.market_id,
        status: market.status,
        result: market.result,
      });
      handlePlaceBetButtonStatus(market.status);
    });
  }

  function getColorGameBetTotals() {
    console.log(
      `${gameHeader}/getColorGameBetTotals/${gameId}/${marketDetails.market_id}`
    );
    axios({
      method: "get",
      url: `${gameHeader}/getColorGameBetTotals/${gameId}/${marketDetails.market_id}`,
      headers: {
        "Authorization": "Q@k=jLc-3CCK3Fc%",
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
      setMarketDetails((prev) => {
        return {
          ...prev,
          market_id: data.marketId,
          status: data.status,
        };
      });
      handlePlaceBetButtonStatus(data.status);
    });
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
    };

    console.log(data);

    axios({
      method: "post",
      url: `${betHeader}/placeBet`,
      headers: {
        "Authorization": "h75*^*3DWwHFb4$V",
      },
      data: data,
    })
      .then((res) => {
        console.log(res);
        const newWallet = parseFloat(ctx.walletBalance) - parseFloat(stake);
        ctx.walletHandler(newWallet);

        //Disable Button for 5 seconds
        setPlaceBetDisabled(true)
        setPlaceBetText("Please Wait")
        
        
        setTimeout(() => {
          console.log("disabled")
          setPlaceBetText("Place Bet")
          setPlaceBetDisabled(false)
          
        }, 5000)
        

        toast.success(`Placed Bet successfully. BetId: ${res.data.data.betId}`);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function handleStakeChange(e) {
    const currentStake = parseFloat(e.target.value);
    const walletBalance = parseFloat(ctx.walletBalance);

    if (currentStake > walletBalance || marketDetails.status !== 0) {
      console.log("Insufficient Funds");
      setPlaceBetDisabled(true);
    } else {
      setPlaceBetDisabled(false);
      setStake(currentStake);
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
      console.log("Tip Amount cannot be empty");
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
        headers: {
          "Authorization": "h75*^*3DWwHFb4$V",
        },
        data: data,
      })
        .then((res) => {
          console.log(res);
          const newWallet = parseFloat(ctx.walletBalance) - parseFloat(tip);
          ctx.walletHandler(newWallet);
          toast.success(`Thanks for the tip! Enjoy the game`);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }

  function handleTipChange(e) {
    const currenttip = parseFloat(e.target.value);
    const walletBalance = parseFloat(ctx.walletBalance);

    if (currenttip > walletBalance) {
      setPlaceTipDisabled(true);
    } else {
      setPlaceTipDisabled(false);
      setTip(currenttip);
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
    <ToastContainer/>
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
          <YoutubeEmbed embedId="5qap5aO4i9A" />
        </div>
        <div className="col-md-4 live-room-colorbox">
          <div class="card txt-black">
            <div class="card-body">
              <h5 class="card-title">
                Current Market ID: {marketDetails.market_id}
              </h5>
              <p class="card-text">
                Betting Status:{" "}
                {marketDetails.status === 0
                  ? " OPEN"
                  : marketDetails.status === 1
                  ? " CLOSED"
                  : " RESULTED"}
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
                  <label for="huey" className="color-name">
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
                  <label for="huey" className="color-name">
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
                  <label for="huey" className="color-name">
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
                  <label for="huey" className="color-name">
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
                    placeholder="P500"
                    onChange={handleStakeChange}
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
          <div class="card text-black">
            <div class="card-body">
              <h5 class="card-title">Donation Box</h5>
              <p class="card-text">If you enjoy playing, you can tip me!</p>
              <div class="input-group mb-2">
                <input
                  type="number"
                  class="form-control"
                  placeholder="P500"
                  onChange={handleTipChange}
                />
                <button
                  class="btn btn-color text-light"
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

// <div className="col-sm-3 col-5 blue-box">Blue</div>
//                 <div className="col-sm-3 col-5 green-box">Green</div>
//                 <div className="col-sm-3 col-5 yellow-box">Yellow</div>
//                 <div className="col-sm-3 col-5 white-box">White</div>
//                 <div className="col-sm-3 col-5 purple-box">Purple</div>
