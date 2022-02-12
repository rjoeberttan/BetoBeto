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
import PlayerTotalisator from "../Totalisator/PlayerTotalisator";
import InputTotalisator from "../Totalisator/InputTotalisator";
import PotentialWin from "../Totalisator/PotentialWin";
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
  const [trends, setTrends] = useState([]);
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
  const [statusStyle, setStatusStyle] = useState({ color: "" });
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
  const [betslip, setBetslip] = useState([]);
  const { gameId } = useParams();
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
    socket.emit("join_room", "colorGame");
    getLatestGameDetails();
    getLatestMarketDetails();
    getMarketTrend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      getColorGameBetTotals();
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketDetails]);

  function getMarketTrend() {
    axios({
      method: "get",
      url: `${gameHeader}/getMarketTrend/${gameId}`,
      headers: gameAuthorization,
    }).then((res) => {
      setTrends(res.data.data.trends.reverse());
    });
  }

  function generateResultsArray() {
    var res1 = [];
    var res2 = [];
    var res3 = [];

    trends.map((x) => {
      var resultLong = x.result;
      var resSplit = resultLong.split(",");
      res1.push(resSplit[0]);
      res2.push(resSplit[1]);
      res3.push(resSplit[2]);
    });

    return [res1, res2, res3];
  }

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
      manageStatusStyle(market.status);
      handlePlaceBetButtonStatus(market.status);
      getBetSlips(market.market_id);
    });
  }

  function getColorGameBetTotals() {
    axios({
      method: "get",
      url: `${gameHeader}/getColorGameBetTotals/${gameId}/${marketDetails.market_id}`,
      headers: {
        "Authorization": process.env.REACT_APP_KEY_GAME,
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
      manageStatusStyle(data.status);
      handlePlaceBetButtonStatus(data.status);
      setTimeout(() => {
        getBetSlips();
      }, 1000);

      var newStatus = data.status;
      // Update wallet Balance if Market is Resulted
      if (newStatus === 2) {
        setTimeout(() => {
          getMarketTrend();
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
      maxBet: gameDetails.max_bet,
    };

    var stakeAmt = parseFloat(stake);
    var minBet = parseFloat(gameDetails.min_bet).toFixed(2);
    var maxBet = parseFloat(gameDetails.max_bet).toFixed(2);

    if (minBet > stakeAmt || stakeAmt > maxBet) {
      toast.error(`Acceptable stake amount: ₱${minBet}-₱${maxBet}`);
    } else {
      axios({
        method: "post",
        url: `${betHeader}/placeBet`,
        headers: betAuthorization,
        data: data,
      })
        .then((res) => {
          const newWallet = parseFloat(ctx.walletBalance) - parseFloat(stake);
          ctx.walletHandler(newWallet);
          getBetSlips(marketDetails.market_id);

          //Disable Button for 5 seconds
          setPlaceBetDisabled(true);
          setPlaceBetText("Please Wait");

          setTimeout(() => {
            setPlaceBetText("Place Bet");
            setPlaceBetDisabled(false);
            setStake("");
          }, 5000);
          toast.success(
            `Placed Bet successfully. BetId: ${res.data.data.betId}`,
            {
              autoClose: 2000,
            }
          );

          // Send GM Commission
          const gmData = {
            betId: res.data.data.betId,
            playerId: ctx.user.accountID,
            amount: stake,
          };
          axios({
            method: "post",
            url: `${betHeader}/sendGrandMasterCommission`,
            headers: betAuthorization,
            data: gmData,
          })
            .then((res) => {})
            .catch((err) => {
              console.log(err.response.data.message);
            });
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
    console.log(e.target.value);
    setBet(e.target.value);
    console.log(bet, "hehe");
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
          {/* <TextScroller text={gameDetails.banner} /> */}
          <TextScroller text="Sample text" />
        </div>
        <div className="col-md-8">
          {/* <YoutubeEmbed embedId={gameDetails.youtube_url} /> */}
          <YoutubeEmbed embedId="5qap5aO4i9A" />
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
                Min/Max Bet: ₱{parseFloat(gameDetails.min_bet).toFixed(2)} - ₱
                {parseFloat(gameDetails.max_bet).toFixed(2)}
              </p>
              <PlayerTotalisator handleChange={handleChange} bet={bet} />
              {/* <div className="row" style={{ marginTop: "30px" }}>
                <label>Place Bet:</label>

                <div className="row text-center place-bet-boxes">
                  <label
                    className="col-md-3 placebet-styles-low"
                    style={bet === "low" ? { border: "3px solid green" } : {}}
                  >
                    LOW
                    <p>1.99</p>
                    <input
                      class="checked"
                      type="radio"
                      name="bet"
                      value="low"
                      onChange={handleChange}
                    />
                  </label>
                  <label
                    className="col-md-3 placebet-styles-draw"
                    style={bet === "draw" ? { border: "3px solid green" } : {}}
                  >
                    DRAW
                    <p>1.92</p>
                    <input
                      class="checked"
                      type="radio"
                      name="bet"
                      value="draw"
                      onChange={handleChange}
                    />
                  </label>
                  <label
                    className="col-md-3 placebet-styles-high"
                    style={bet === "high" ? { border: "3px solid green" } : {}}
                  >
                    HIGH
                    <p>1.92</p>
                    <input
                      class="checked"
                      type="radio"
                      name="bet"
                      value="high"
                      onChange={handleChange}
                    />
                  </label>
                </div>
              </div> */}

              <InputTotalisator
                gameDetails={gameDetails.min_bet}
                gameDetailsMaxBet={gameDetails.max_bet}
                handleStakeChange={handleStakeChange}
                stake={stake}
                placeBetDisabled={placeBetDisabled}
                placeBet={placeBet}
                placeBetText={placeBetText}
              />
              {/* <div className="row wallet-box wage-box">
                <div className="col-md-6 col-8">
                  <input
                    type="number"
                    className="form-control wage-input"
                    onWheel={(e) => e.target.blur()}
                    placeholder={`₱${parseFloat(gameDetails.min_bet).toFixed(
                      2
                    )}-₱${parseFloat(gameDetails.max_bet).toFixed(2)} `}
                    onChange={handleStakeChange}
                    value={stake}
                  />
                </div>
                <div className="col-md-6 col-4">
                  <button
                    type="submit"
                    className="btn btn-color text-light wage-button"
                    disabled={placeBetDisabled}
                    onClick={placeBet}
                  >
                    {placeBetText}
                  </button>
                </div>
              </div> */}
              <PotentialWin money="9999" />
              {/* <div className="text potential-text">
                <label>Potential Win: P9000</label>
              </div> */}
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="label-margin col-md-4">
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
        <div className="label-margin col-md-4">
          <div className="text-center">
            <div className="card text-black">
              <div className="card-body table-responsive-sm">
                <h4 className="card-title">Result Box:</h4>
                {/* <table class="table table-bordered border-dark col-md-8">
                  <thead>
                    <tr>
                      {trends.map((x) => (
                        <th>{x.market_id}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {generateResultsArray().map((newArr) => (
                      <tr key={Math.random()}>
                        {newArr.map((x) => (
                          <td style={{ backgroundColor: x.toLowerCase() }}>
                            &nbsp;
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table> */}
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat.{" "}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="label-margin col-md-4">
          <div className="card text-black">
            <div className="card-body table-responsive-sm">
              <h4 className="card-title">Betslips</h4>
              {renderBetslips()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveRoom;
