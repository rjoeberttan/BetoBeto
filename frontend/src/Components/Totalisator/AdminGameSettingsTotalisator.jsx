import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../store/auth-context";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-toastify/dist/ReactToastify.min.css";
import socket from "../Websocket/socket";
const axios = require("axios").default;

function AdminGameSettingsTotalisator() {
  const ctx = useContext(AuthContext);
  //set state for game variables
  const [gameDetails, setGameDetails] = useState({
    banner: "",
    description: "",
    is_live: "",
    max_bet: "",
    min_bet: "",
    name: "",
    draw_multiplier: "",
    youtube_url: "",
    commission: "",
    type: "",
  });
  //set state for market variables
  const [marketDetails, setMarketDetails] = useState({
    description: "",
    market_id: "",
    status: "",
    result: "",
  });
  const [settingsText, setSettingsText] = useState({
    create: "CREATE MARKET",
    open: "OPEN MARKET",
    close: "CLOSE MARKET",
    result: "RESULT MARKET",
  });
  const [choices, setChoices] = useState({
    choice1: "",
    choice2: "",
    choiceDraw: "DRAW",
  });
  const [totalisatorOdds, setTotalisatorOdds] = useState({
    odd1: parseFloat(0).toFixed(2),
    odd2: parseFloat(0).toFixed(2),
    oddDraw: parseFloat(0).toFixed(2),
  });
  const [oddManip, setOddManip] = useState({
    odd1: 0,
    odd2: 0,
  });
  const [betList, setBetList] = useState([]);
  const [statusChangeDisabled, setStatusChangeDisabled] = useState(false);
  const [resultChoice, setResultchoice] = useState("");

  let { gameid } = useParams();

  const accountHeader = process.env.REACT_APP_HEADER_ACCOUNT;
  const gameHeader = process.env.REACT_APP_HEADER_GAME;
  const betHeader = process.env.REACT_APP_HEADER_BET;
  console.log(process.env.REACT_APP_HEADER_WEBSOCKET);

  useEffect(() => {
    const token = localStorage.getItem("token");
    //get user auth
    axios({
      method: "get",
      url: `${accountHeader}/isUserAuth`,
      headers: {
        "x-access-token": token,
        "Authorization": process.env.REACT_APP_KEY_ACCOUNT,
      },
    }).then((res) => {
      axios({
        method: "get",
        url: `${gameHeader}/getGameDetails/${gameid}`,
        headers: {
          "Authorization": process.env.REACT_APP_KEY_GAME,
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
          youtube_url: data.youtube_url,
          draw_multiplier: data.win_multip1,
          commission: data.commission,
          type: data.type,
        });

        setTotalisatorOdds((prev) => {
          return {
            ...prev,
            oddDraw: data.win_multip1,
          };
        });

        setOddManip({
          odd1: Math.floor(Math.random() * data.max_bet),
          odd2: Math.floor(Math.random() * data.max_bet),
        });

        var gameType = data.type;
        if (gameType === 1) {
          setChoices({ choice1: "PULA", choice2: "PUTI", choiceDraw: "DRAW" });
        } else if (gameType === 2) {
          setChoices({ choice1: "LOW", choice2: "HIGH", choiceDraw: "DRAW" });
        }
      });

      //get market details
      axios({
        method: "get",
        url: `${gameHeader}/getLatestMarketDetails/${gameid}`,
        headers: {
          "Authorization": process.env.REACT_APP_KEY_GAME,
        },
      }).then((res) => {
        //get game details
        const { market } = res.data.data;
        getBetList(market.market_id);
        setMarketDetails({
          description: market.description,
          market_id: market.market_id,
          status: market.status,
          result: market.result,
        });
        if (market.status === 2) {
          const colors = market.result.split(",");
          setBoxColor({
            boxOne: colors[0],
            boxTwo: colors[1],
            boxThree: colors[2],
          });
        }

        // Get Latest Totalisator Odds
        axios({
          method: "get",
          url: `${gameHeader}/getTotalisatorOdds/${gameid}/${market.market_id}`,
          headers: {
            "Authorization": process.env.REACT_APP_KEY_GAME,
          },
        }).then((res) => {
          var odds = res.data.data.odds[0] === null ? {odd1: 0, odd2: 0}: res.data.data.odds[0];
          console.log(odds)
          setTotalisatorOdds((prev) => {
            return {
              ...prev,
              odd1: res.data.data.odds[0].odd1 === undefined ? 0.0 : parseFloat(odds.odd1),
              odd2: res.data.data.odds[0].odd2 === undefined ? 0.0 : parseFloat(odds.odd1),
              // odd1: 0,
              // odd2: odds.odd2 === null ? 0 : parseFloat(odds.odd2),
            };
          });

        });
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      // console.log(totalisatorOdds);
      if (marketDetails.status === 0) {
        // Get Generate Totalisator Odds
        axios({
          method: "post",
          url: `${gameHeader}/updateTotalisatorOdds`,
          headers: {
            "Authorization": process.env.REACT_APP_KEY_GAME,
          },
          data: {
            gameId: gameid,
            marketId: marketDetails.market_id,
            gameName: gameDetails.name,
            commission: gameDetails.commission,
            manipOdd1: oddManip.odd1,
            manipOdd2: oddManip.odd2,
            choice1: choices.choice1,
            choice2: choices.choice2,
          },
        }).then((res) => {
          var odd1Change = parseFloat(totalisatorOdds.odd1).toFixed(2) - parseFloat(res.data.odd1).toFixed(2)
          var odd2Change = parseFloat(totalisatorOdds.odd2).toFixed(2) - parseFloat(res.data.odd2).toFixed(2)

          var odd1Status = odd1Change > 0 ? "DOWN" : (odd1Change < 0) ? "UP" : "EQUAL"
          var odd2Status = odd2Change > 0 ? "DOWN" : (odd2Change < 0) ? "UP" : "EQUAL"

          socket.emit("totalisator_odds_update", {
            marketId: marketDetails.market_id,
            gameId: gameid,
            status: 0,
            odd1: res.data.odd1,
            odd2: res.data.odd2,
            oddDraw: gameDetails.draw_multiplier,
            odd1Change: odd1Status,
            odd2Change: odd2Status
          });

          setTotalisatorOdds((prev) => {
            return {
              ...prev,
              odd1: parseFloat(res.data.odd1).toFixed(2),
              odd2: parseFloat(res.data.odd2).toFixed(2),
            };
          });
        });
      }
    }, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketDetails, betList, totalisatorOdds]);

  function handleGameChange(e) {
    const { name, value } = e.target;
    console.log(name, value);

    setGameDetails((prev) => {
      return {
        ...prev,
        [name]: value,
      };
    });
  }

  const [boxColor, setBoxColor] = useState({
    boxOne: "RED",
    boxTwo: "RED",
    boxThree: "RED",
  });

  function handleGameSettingsClick(e) {
    if (gameDetails.name.length === 0) {
      toast.error("Game title should not be empty");
    } else if (gameDetails.youtube_url.length === 0) {
      toast.error("YouTube URL should not be empty");
    } else {
      axios({
        method: "post",
        url: `${gameHeader}/updateGameSettings`,
        headers: {
          "Authorization": process.env.REACT_APP_KEY_GAME,
        },
        data: {
          gameId: gameid,
          url: gameDetails.youtube_url,
          title: gameDetails.name,
          description: "",
          bannerMessage: gameDetails.banner,
          editor: ctx.user.username,
        },
      })
        .then((res) => {
          toast.success("Game settings saved");
        })
        .catch((err) => {
          toast.error(err);
        });
    }
    e.preventDefault();
  }

  function handleBetThresholdsClick(e) {
    console.log(gameDetails.max_bet, gameDetails.min_bet);
    if (
      parseFloat(gameDetails.min_bet) <= 0 ||
      parseFloat(gameDetails.max_bet) <= 0 ||
      parseFloat(gameDetails.max_bet) <= parseFloat(gameDetails.min_bet)
    ) {
      console.log(gameDetails.max_bet, gameDetails.min_bet);
      toast.error("Invalid Bet Threshold values");
    } else {
      axios({
        method: "post",
        url: `${gameHeader}/updateBetThreshold`,
        headers: {
          "Authorization": process.env.REACT_APP_KEY_GAME,
        },
        data: {
          gameId: gameid,
          editor: ctx.user.username,
          min_bet: gameDetails.min_bet,
          max_bet: gameDetails.max_bet,
        },
      })
        .then((res) => {
          toast.success("Bet thresholds saved");
        })
        .catch((err) => {
          toast.error(
            <p>
              Incomplete bet tresholds <br></br> Please try again
            </p>
          );
        });
    }

    e.preventDefault();
  }

  function handleDrawCommissionClick(e) {
    console.log(gameDetails.draw_multiplier);
    if (parseFloat(gameDetails.draw_multiplier) <= 1) {
      toast.error("Draw errpr");
    } else {
      axios({
        method: "post",
        url: `${gameHeader}/updateTotalisatorDrawMultiplier`,
        headers: {
          "Authorization": process.env.REACT_APP_KEY_GAME,
        },
        data: {
          gameId: gameid,
          editor: ctx.user.username,
          multiplier: gameDetails.draw_multiplier,
        },
      })
        .then((res) => {
          toast.success("Draw Multiplier Changed");
          socket.emit("totalisator_odds_update", {
            marketId: marketDetails.market_id,
            gameId: gameid,
            status: 0,
            odd1: totalisatorOdds.odd1,
            odd2: totalisatorOdds.odd2,
            oddDraw: gameDetails.draw_multiplier
          });
        })
        .catch((err) => {
          toast.error("Server Error");
        });
    }

    e.preventDefault();
  }

  function DisableSettings() {
    setSettingsText({
      create: "PLEASE WAIT",
      close: "PLEASE WAIT",
      open: "PLEASE WAIT",
      result: "PLEASE WAIT",
    });
    setStatusChangeDisabled(true);

    setTimeout(() => {
      setSettingsText({
        create: "CREATE MARKET",
        close: "CLOSE MARKET",
        open: "OPEN MARKET",
        result: "RESULT MARKET",
      });
      setStatusChangeDisabled(false);
    }, 3000);
  }

  function handleMarketDetailsClick(e) {
    const { name } = e.target;
    if (name === "createMarket") {
      axios({
        method: "post",
        url: `${gameHeader}/createTotalisatorMarket`,
        headers: {
          "Authorization": process.env.REACT_APP_KEY_GAME,
        },
        data: {
          gameId: gameid,
          description: marketDetails.description,
          editor: ctx.user.username,
        },
      })
        .then((res) => {
          const { data } = res.data;
          console.log(data);
          setMarketDetails((prev) => {
            return {
              ...prev,
              market_id: data.marketID,
              status: data.status,
            };
          });

          axios({
            method: "post",
            url: `${gameHeader}/updateTotalisatorOdds`,
            headers: {
              "Authorization": process.env.REACT_APP_KEY_GAME,
            },
            data: {
              gameId: gameid,
              marketId: data.marketID,
              gameName: gameDetails.name,
              commission: gameDetails.commission,
              manipOdd1: oddManip.odd1,
              manipOdd2: oddManip.odd2,
              choice1: choices.choice1,
              choice2: choices.choice2,
            },
          }).then((res) => {
            var odd1Change = parseFloat(totalisatorOdds.odd1).toFixed(2) - parseFloat(res.data.odd1).toFixed(2)
            var odd2Change = parseFloat(totalisatorOdds.odd2).toFixed(2) - parseFloat(res.data.odd2).toFixed(2)
  
            var odd1Status = odd1Change > 0 ? "DOWN" : (odd1Change < 0) ? "UP" : "EQUAL"
            var odd2Status = odd2Change > 0 ? "DOWN" : (odd2Change < 0) ? "UP" : "EQUAL"
  
            socket.emit("totalisator_odds_update", {
              marketId: data.marketID,
              gameId: gameid,
              status: 0,
              odd1: res.data.odd1,
              odd2: res.data.odd2,
              oddDraw: gameDetails.draw_multiplier,
              odd1Change: odd1Status,
              odd2Change: odd2Status
            });
  
            setTotalisatorOdds((prev) => {
              return {
                ...prev,
                odd1: parseFloat(res.data.odd1).toFixed(2),
                odd2: parseFloat(res.data.odd2).toFixed(2),
              };
            });
          });
          socket.emit("totalisator_market_update", {
            marketId: data.marketID,
            status: 0,
            gameId: gameid
          });
          toast.success("Success Create Market");
          DisableSettings();
        })
        .catch((err) => {
          if (marketDetails.status === 0) {
            toast.error("Market is still open");
          } else {
            toast.error("Market is still closed");
          }
        });
    } else if (name === "openMarket") {
      axios({
        method: "post",
        url: `${gameHeader}/openTotalisatorMarket`,
        headers: {
          "Authorization": process.env.REACT_APP_KEY_GAME,
        },
        data: {
          gameId: gameid,
          description: marketDetails.description,
          marketId: marketDetails.market_id,
          editor: ctx.user.username,
        },
      })
        .then((res) => {
          const { data } = res.data;
          setMarketDetails((prev) => {
            return {
              ...prev,
              market_id: data.marketId,
              status: data.status,
            };
          });
          socket.emit("totalisator_market_update", {
            marketId: data.marketId,
            status: data.status,
            gameId: gameid
          });
          toast.success("Success Open Market");
          DisableSettings();
        })
        .catch((err) => {
          if (marketDetails.status === 0) {
            toast.error("Market is already open");
          } else {
            toast.error("Market is in result state");
          }
        });
    } else if (name === "closeMarket") {
      axios({
        method: "post",
        url: `${gameHeader}/closeTotalisatorMarket`,
        headers: {
          "Authorization": process.env.REACT_APP_KEY_GAME,
        },
        data: {
          gameId: gameid,
          description: marketDetails.description,
          marketId: marketDetails.market_id,
          editor: ctx.user.username,
        },
      })
        .then((res) => {
          const { data } = res.data;
          setMarketDetails((prev) => {
            return {
              ...prev,
              market_id: data.marketId,
              status: data.status,
            };
          });
          socket.emit("totalisator_market_update", {
            marketId: data.marketId,
            status: data.status,
            gameId: gameid
          });
          toast.success("Success Closed Market");
          DisableSettings();
        })
        .catch((err) => {
          console.log(marketDetails.status);
          if (marketDetails.status === 1) {
            toast.error("Market is already closed");
          } else {
            toast.error("Market is still in result state");
          }
        });
    }
  }

  function handleResultMarket(e) {
    if (
      window.confirm(
        "Are you sure to result this market?" || resultChoice !== ""
      )
    ) {
      axios({
        method: "post",
        url: `${gameHeader}/resultTotalisatorMarket`,
        headers: {
          "Authorization": process.env.REACT_APP_KEY_GAME,
        },
        data: {
          gameId: gameid,
          marketId: marketDetails.market_id,
          editor: ctx.user.username,
          result: resultChoice,
        },
      })
        .then((res) => {
          setMarketDetails((prev) => {
            return {
              ...prev,
              status: res.data.data.status,
            };
          });

          // Get Latest Odds first before resulting market
          axios({
            method: "post",
            url: `${gameHeader}/updateTotalisatorOdds`,
            headers: {
              "Authorization": process.env.REACT_APP_KEY_GAME,
            },
            data: {
              gameId: gameid,
              marketId: marketDetails.market_id,
              gameName: gameDetails.name,
              commission: gameDetails.commission,
              manipOdd1: oddManip.odd1,
              manipOdd2: oddManip.odd2,
              choice1: choices.choice1,
              choice2: choices.choice2,
            },
          }).then((res) => {
            console.log(res)
  
            setTotalisatorOdds((prev) => {
              return {
                ...prev,
                odd1: parseFloat(res.data.odd1).toFixed(2),
                odd2: parseFloat(res.data.odd2).toFixed(2),
              };
            });
  
            socket.emit("totalisator_odds_update", {
              marketId: marketDetails.market_id,
              gameId: gameid,
              status: 0,
              odd1: res.data.odd1,
              odd2: res.data.odd2,
              oddDraw: gameDetails.draw_multiplier
            });


            // Settle Totalisator Bets
            axios({
              method: "post",
              url: `${betHeader}/settleTotalisatorBets`,
              headers: {
                "Authorization": process.env.REACT_APP_KEY_BET,
              },
              data: {
                gameId: gameid,
                marketId: marketDetails.market_id,
                gameName: gameDetails.name,
                choice1: choices.choice1,
                choice2: choices.choice2,
                oddChoice1: res.data.odd1,
                oddChoice2: res.data.odd2,
                oddDraw: gameDetails.draw_multiplier,
                marketResult: resultChoice,
                settler: ctx.user.username
              },
            })
              .then((res) => {
                if (resultChoice === "DRAW"){
                  toast.info("No commission to be sent since result is 'DRAW'")
                } else{
                  console.log(res)
                  var settledBets = res.data.data.bets

                  settledBets.forEach((bet) => {
                      // Send GM Commission
                    const gmData = {
                      betId: bet.bet_id,
                      playerId: bet.account_id,
                      amount: bet.stake,
                      gameId: gameid
                    };
                    axios({
                      method: "post",
                      url: `${betHeader}/sendGrandMasterCommission`,
                      headers: {
                        "Authorization": process.env.REACT_APP_KEY_BET,
                      },
                      data: gmData,
                    }).then((res) => {console.log("gm sent")}).catch((err) => {console.log("gm", err)});
  
  
                    // Send Agent Commission
                    const agentData = {
                      betId: bet.bet_id,
                      playerId: bet.account_id,
                      stake: bet.stake,
                      gameId: gameid
                    };
                    axios({
                      method: "post",
                      url: `${betHeader}/sendAgentCommission`,
                      headers: {
                        "Authorization": process.env.REACT_APP_KEY_BET,
                      },
                      data: agentData,
                    }).then((res) => {
                      console.log("agent sent")
                      var agentId = res.data.data.agentId
                      var commission = res.data.data.commission
                      // Send Master Agent Commission
                      const maData = {
                        betId: bet.bet_id,
                        stake: bet.stake,
                        agentId: agentId,
                        agentCommission: commission,
                        gameId: gameid
                      };
                      console.log(maData)
                      axios({
                        method: "post",
                        url: `${betHeader}/sendMasterAgentCommission`,
                        headers: {
                          "Authorization": process.env.REACT_APP_KEY_BET,
                        },
                        data: maData,
                      }).then((res) => {console.log("ma sent")}).catch((err) => {console.log("ma", err)});

                    }).catch((err) => {console.log("agent", err)});

                  })
                  toast.info("All Commissions has been given")
                }
              })
              .catch((err) => {
                // console.log(err);
              });




          });





          //State Resets
          
          setTotalisatorOdds((prev) => {
            return {
              ...prev,
              odd1: parseFloat(0).toFixed(2),
              odd2: parseFloat(0).toFixed(2),
            };
          });
          setOddManip({
            odd1: Math.floor(Math.random() * gameDetails.max_bet),
            odd2: Math.floor(Math.random() * gameDetails.max_bet),
          });
          socket.emit("totalisator_market_update", {
            marketId: res.data.data.marketId,
            status: res.data.data.status,
            gameId: gameid
          });



        })
        .catch((err) => {
          if (marketDetails.status === 2) {
            toast.error("Market is already in Result state");
          } else {
            toast.error("Market is still open");
          }
        });
    } else {
      toast.info("Result Market Cancelled or no winning choice selected");
    }
    setResultchoice("");
    console.log(resultChoice, "hello result");
    e.preventDefault();
  }

  function getBetList(marketId) {
    console.log("hehe");
    axios({
      method: "get",
      url: `${betHeader}/getBetMarketList/${marketId}`,
      headers: {
        "Authorization": process.env.REACT_APP_KEY_BET,
      },
    })
      .then((res) => {
        setBetList(res.data.data);
        console.log(res);
      })
      .catch((err) => {});
  }

  function handleRefresh(e) {
    e.preventDefault();
    getBetList(marketDetails.market_id);
  }

  function handleChange(e) {
    
    console.log(e.target.value);
    setResultchoice(e.target.value);
  }

  return (
    <div className="container text-light container-game-room">
      <>
        <ToastContainer />
      </>
      <div className="heading-text">
        <h1 className="display-6 small-device bold-small">Manage Settings</h1>
      </div>
      <div className="row">
        {/* CARD ONE */}
        <div className="col-md-4 card-margin-bottom">
          <div className="card text-white bg-dark mb-3">
            <div className="card-body">
              <h5 className="card-title">Game Settings</h5>
              <form>
                <h6 className="card-subtitle mb-2 label-margin">Game title:</h6>
                <input
                  className="form-control"
                  type="text"
                  name="name"
                  value={gameDetails.name}
                  onChange={handleGameChange}
                ></input>
                <h6 className="card-subtitle mb-2 label-margin">
                  Youtube Embed URL:
                </h6>
                <input
                  className="form-control"
                  type="text"
                  name="youtube_url"
                  value={gameDetails.youtube_url}
                  onChange={handleGameChange}
                ></input>
                <h6 className="card-subtitle mb-2 label-margin">Banner:</h6>
                <input
                  className="form-control"
                  type="text"
                  name="banner"
                  value={gameDetails.banner}
                  onChange={handleGameChange}
                ></input>
                <div className="text-center">
                  <button
                    className="btn btn-color text-light"
                    style={{ marginTop: "15px" }}
                    onClick={handleGameSettingsClick}
                  >
                    Save Game Settings
                  </button>
                </div>
                <h5 className="card-title">Pot Commssion</h5>
                <h6 className="card-subtitle mb-2 label-margin">Commission:</h6>
                <input
                  className="form-control"
                  type="number"
                  name="commission"
                  onChange={handleGameChange}
                  value={gameDetails.commission}
                ></input>
                <div className="text-center">
                  <button
                    className="btn btn-color text-light"
                    style={{ marginTop: "15px" }}
                    onClick={handleDrawCommissionClick}
                  >
                    Save Draw Commission
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* CARD TWO */}
        <div className="col-md-4 card-margin-bottom">
          <div className="card text-white bg-dark mb-3">
            <div className="card-body">
              <h5 className="card-title">Bet and Settings</h5>
              <form>
                <h6 className="card-subtitle mb-2 label-margin">
                  Minimum Bet Amount:
                </h6>
                <input
                  className="form-control"
                  type="number"
                  name="min_bet"
                  value={gameDetails.min_bet}
                  onChange={handleGameChange}
                ></input>
                <h6 className="card-subtitle mb-2 label-margin">
                  Maximum Bet Amount:
                </h6>
                <input
                  className="form-control"
                  type="number"
                  name="max_bet"
                  value={gameDetails.max_bet}
                  onChange={handleGameChange}
                ></input>
                <div className="text-center">
                  <button
                    className="btn btn-color text-light"
                    style={{ marginTop: "15px" }}
                    onClick={handleBetThresholdsClick}
                  >
                    Save Bet Thresholds
                  </button>
                </div>
                <h5 className="card-title">Win Settings</h5>
                <h6 className="card-subtitle mb-2 label-margin">
                  Draw Win Multiplier:
                </h6>
                <input
                  className="form-control"
                  type="number"
                  name="draw_multiplier"
                  onChange={handleGameChange}
                  value={gameDetails.draw_multiplier}
                ></input>
                <div className="text-center">
                  <button
                    className="btn btn-color text-light"
                    style={{ marginTop: "15px" }}
                    onClick={handleDrawCommissionClick}
                  >
                    Save Draw Commission
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* CARD THREE */}
        <div className="col-md-4 card-margin-bottom">
          <div className="card text-white bg-dark mb-3">
            <div className="card-body">
              <h5 className="card-title">
                Market Settings:
                {marketDetails.status === 0
                  ? " OPEN"
                  : marketDetails.status === 1
                  ? " CLOSED"
                  : " RESULTED"}
              </h5>
              <div className="row">
                <div className="col-md-4 text-center">
                  <button
                    className="btn btn-color text-light"
                    name="createMarket"
                    onClick={handleMarketDetailsClick}
                    disabled={statusChangeDisabled}
                  >
                    {settingsText.create}
                  </button>
                </div>
                <div className="col-md-4 text-center">
                  <button
                    className="btn btn-color text-light"
                    name="openMarket"
                    onClick={handleMarketDetailsClick}
                    disabled={statusChangeDisabled}
                  >
                    {settingsText.open}
                  </button>
                </div>
                <div className="col-md-4 text-center">
                  <button
                    className="btn btn-color text-light"
                    name="closeMarket"
                    onClick={handleMarketDetailsClick}
                    disabled={statusChangeDisabled}
                  >
                    {settingsText.close}
                  </button>
                </div>
              </div>
              <hr />
              <h5 className="card-title">
                Current Market ID: {marketDetails.market_id}
              </h5>
              <h6 className="card-subtitle mb-2 text-muted">
                <b>Result Market</b>
              </h6>
              <div className="row">
                <label>Place Bet:</label>

                <div className="row text-center place-bet-boxes">
                  <label
                    className="col-md-3 col-4 placebet-styles-low"
                    style={
                      resultChoice === choices.choice1
                        ? { border: "3px solid green" }
                        : {}
                    }
                  >
                    {choices.choice1}
                    <p>{parseFloat(totalisatorOdds.odd1).toFixed(2)}</p>
                    <input
                      class="checked"
                      type="radio"
                      name="bet"
                      value={choices.choice1}
                      onChange={handleChange}
                      checked={resultChoice === choices.choice1}
                    />
                  </label>
                  <label
                    className="col-md-3 col-4 placebet-styles-draw"
                    style={
                      resultChoice === choices.choiceDraw
                        ? { border: "3px solid green" }
                        : {}
                    }
                  >
                    {choices.choiceDraw}
                    <p>{parseFloat(totalisatorOdds.oddDraw).toFixed(2)}</p>
                    <input
                      class="checked"
                      type="radio"
                      name="bet"
                      value={choices.choiceDraw}
                      onChange={handleChange}
                      checked={resultChoice === choices.choiceDraw}
                    />
                  </label>
                  <label
                    className="col-md-3 col-4 placebet-styles-high"
                    style={
                      resultChoice === choices.choice2
                        ? { border: "3px solid green" }
                        : {}
                    }
                  >
                    {choices.choice2}
                    <p>{parseFloat(totalisatorOdds.odd2).toFixed(2)}</p>
                    <input
                      class="checked"
                      type="radio"
                      name="bet"
                      value={choices.choice2}
                      onChange={handleChange}
                      checked={resultChoice === choices.choice2}
                    />
                  </label>
                </div>

                <div
                  className="col-md-12 text-center"
                  style={{ marginTop: "15px" }}
                >
                  <button
                    className="btn btn-color text-light"
                    onClick={handleResultMarket}
                    disabled={statusChangeDisabled}
                  >
                    {settingsText.result}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD FOUR */}
        <div className="col-md-12 card-margin-bottom">
          <div className="card text-white bg-dark mb-3" style={{}}>
            <div className="card-body">
              <h5 className="card-title">Received Bets</h5>
              <h6 className="card-subtitle mb-2 text-muted">
                <b>Current Market ID: {marketDetails.market_id} </b>
              </h6>
              <table className="table table-success table-striped">
                <thead>
                  <tr>
                    <th scope="col">Bet ID</th>
                    <th scope="col">Account ID</th>
                    <th scope="col">Description</th>
                    <th scope="col">Stake</th>
                    <th scope="col">Winnings</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {betList.map((bet) => (
                    <tr>
                      <th scope="row">{bet.bet_id}</th>
                      <td>{bet.account_id}</td>
                      <td>{bet.description}</td>
                      <td>{bet.stake}</td>
                      <td>{bet.winnings === null ? "0.00" : bet.winnings}</td>
                      <td>
                        {bet.status === 0
                          ? "Pending"
                          : bet.status === 1
                          ? "Lose"
                          : "Win"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="col-md-12 text-center">
                <button
                  className="btn btn-color text-light"
                  onClick={handleRefresh}
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminGameSettingsTotalisator;
