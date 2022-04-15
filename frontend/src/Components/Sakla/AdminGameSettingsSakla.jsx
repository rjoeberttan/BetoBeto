import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../store/auth-context";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-toastify/dist/ReactToastify.min.css";
import YoutubeEmbed from "../Youtube";
import socket from "../Websocket/socket";
const axios = require("axios").default;

function AdminGameSettingsSakla() {
  const ctx = useContext(AuthContext);
  const num120 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  const choicesSelect = ["1 ESPADA",
    "2 OROS",
    "3 ESPADA",
    "4 OROS",
    "5 ESPADA",
    "6 OROS",
    "7 ESPADA",
    "SOTANG OROS",
    "KABAYONG ESPADA",
    "1 OROS",
    "3 OROS",
    "5 OROS",
    "7 OROS",
    "KABAYONG OROS",
    "1 KOPAS",
    "3 KOPAS",
    "5 KOPAS",
    "7 KOPAS",
    "KABAYONG KOPAS",
    "1 BASTOS",
    "3 BASTOS",
    "5 BASTOS",
    "7 BASTOS",
    "KABAYONG BASTOS",
    "HARING OROS",
    "2 ESPADA",
    "4 ESPADA",
    "6 ESPADA",
    "SOTANG ESPADA",
    "HARING ESPADA",
    "2 BASTOS",
    "4 BASTOS",
    "6 BASTOS",
    "SOTANG BASTOS",
    "HARING BASTOS",
    "2 KOPAS",
    "4 KOPAS",
    "6 KOPAS",
    "SOTANG KOPAS",
    "HARING KOPAS"]
  const resultChoicesSelect = ["1 ESPADA - 2 OROS",
    "3 ESPADA - 4 OROS",
    "5 ESPADA - 6 OROS",
    "7 ESPADA - SOTANG OROS",
    "KABAYONG ESPADA - HARING OROS",
    "1 OROS - 2 ESPADA",
    "3 OROS - 4 ESPADA",
    "5 OROS - 6 ESPADA",
    "7 OROS - SOTANG ESPADA",
    "KABAYONG OROS - HARING ESPADA",
    "1 KOPAS - 2 BASTOS",
    "3 KOPAS - 4 BASTOS",
    "5 KOPAS - 6 BASTOS",
    "7 KOPAS - SOTANG BASTOS",
    "KABAYONG KOPAS - HARING BASTOS",
    "1 BASTOS - 2 KOPAS",
    "3 BASTOS - 4 KOPAS",
    "5 BASTOS - 6 KOPAS",
    "7 BASTOS - SOTANG KOPAS",
    "KABAYONG BASTOS - HARING KOPAS"]

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
        }
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
            commission: gameDetails.commission
          },
        }).then((res) => {
        });
      }
    }, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketDetails, betList]);

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
            status: 0
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
              commission: gameDetails.commission
            },
          }).then((res) => {;
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
              commission: gameDetails.commission
            },
          }).then((res) => {
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

  function displayChoices() {
      for(let x= 1; x < 21; x++) {
          <div style={{display: "inline-flex", alignItems: "center"}}>
            <label style={{marginRight: "8px"}}>Choice {x}:</label>
            <select class="form-select" style={{maxWidth: "125px", margin: "auto", marginTop: "5px"}}>
                <option selected>Select</option>
            {choicesSelect.map(choice => {
                return(<option value={choice}>{choice}</option>)
            })}
            </select>
            <select class="form-select" style={{maxWidth: "125px", margin: "auto", marginTop: "5px", marginLeft:"5px"}}>
                    <option selected>Select</option>
                {choicesSelect.map(choice => {
                    return(<option value={choice}>{choice}</option>)
                })}
            </select>
            <button
                className="btn btn-color text-light"
                style={{marginLeft:"5px", marginTop: "2px", whiteSpace: "nowrap"}}
            >
                Save
            </button>
        </div>
      }
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
        <div className="row" style={{maxWidth: "880px"}}> 
        {/* Game settings */}
            <div className="col-md-4 card-margin-bottom" style={{minWidth: "440px"}}>
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
                </form>
                </div>
            </div>
            </div>

            {/* Market Settings */}
            <div className="col-md-4 card-margin-bottom" style={{minWidth: "410px"}}>
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
                    <select class="form-select" style={{maxWidth: "300px", margin: "auto", marginTop: "5px"}}>
                            <option selected>Select</option>
                        {resultChoicesSelect.map(choice => {
                            return(<option value={choice}>{choice}</option>)
                        })}
                    </select>

                    <div style={{width: "auto", margin: "auto"}}>
                    <button
                        className="btn btn-color text-light"
                        style={{ marginTop: "15px", marginRight: "5px" }}
                    >
                        Result Market
                    </button>
                    <button
                        className="btn btn-color text-light"
                        style={{ marginTop: "15px" }}
                    >
                        Cancel Market
                    </button>
                    </div>
                </div>
                </div>
            </div>
            </div>

            {/* Bet settings */}
            <div className="col-md-4 card-margin-bottom" style={{minWidth: "440px"}}>
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
                    <div className="row">
                        <div className="col-md-12 row">
                        <h5 className="card-title">Win Settings</h5>
                        <div className="col-md-5 label-margin">Win Multiplier</div>
                        <div className="col-md-6">
                            <input
                            className="form-control"
                            name="win_multip"
                            type="number"
                            ></input>
                        </div>
                        </div>
                        <div className="col-md-12 row label-margin">
                        <div className="col-md-5 label-margin">Cancel Deal</div>
                        <div className="col-md-6">
                            <input
                            className="form-control"
                            name="cancel_deal"
                            type="number"
                            ></input>
                        </div>
                        </div>
                    </div>
                    <div className="text-center">
                    <button
                        className="btn btn-color text-light"
                        style={{ marginTop: "15px", minWidth: "100px" }}
                    >
                        Save
                    </button>
                    </div>
                </form>
                </div>
            </div>
            </div>


            {/* Manipulate Bets */}
            <div className="col-md-4 card-margin-bottom" style={{minWidth: "410px", maxHeight: "436px", overflow: "auto"}}>
                <div className="card text-white bg-dark mb-3" style={{backgroundColor: "blue", display: "inline-block"}}>
                    <div className="card-body bg-dark">
                    <h5 className="card-title">Manipulate Bets</h5>
                    <form>
                    <div className="row">
                        {resultChoicesSelect.map(choice => {
                            return(
                                <div className="col-md-12 row label-margin">
                                    <div className="col-md-5 label-margin" style={{whiteSpace: "nowrap"}}>{choice}</div>
                                        <div className="col-md-6">
                                            <input
                                            className="form-control"
                                            name={choice}
                                            type="number"
                                            style={{maxWidth: "50px", marginLeft: "150px"}}
                                            placeholder="0"
                                            ></input>
                                        </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className="text-center">
                    <button
                        className="btn btn-color text-light"
                        style={{ marginTop: "15px", minWidth: "100px" }}
                    >
                        Save
                    </button>
                    </div>
                    </form>
                    </div>
                </div>
            </div>
        </div>

        {/* Edit choices */}
        <div className="col-md-4 card-margin-bottom" style={{minWidth: "463px", maxHeight: "785px", overflow: "auto"}}>
                <div className="card text-white bg-dark mb-3">
                    <div className="card-body bg-dark">
                    <h5 className="card-title">Edit Choices</h5>
                    {num120.map(num => {
                            return (
                                <div style={{display: "inline-flex", alignItems: "center"}}>
                                    <label style={{minWidth: "74px", marginRight: "20px", whiteSpace: "nowrap"}}>Choice {num}:</label>
                                    <select class="form-select" name="option1" style={{maxWidth: "130px", margin: "auto", marginTop: "5px"}}>
                                        <option selected>Select</option>
                                    {choicesSelect.map((choice) => {
                                        return(<option value={choice}>{choice}</option>)
                                    })}
                                    </select>
                                    <select class="form-select" name="option2" style={{maxWidth: "130px", margin: "auto", marginTop: "5px", marginLeft:"5px"}}>
                                            <option selected>Select</option>
                                        {choicesSelect.map((choice) => {
                                            return(<option value={choice}>{choice}</option>)
                                        })}
                                    </select>
                                    <button
                                        className="btn btn-color text-light"
                                        style={{marginLeft:"5px", marginTop: "2px", whiteSpace: "nowrap"}}
                                    >
                                        Save
                                    </button>
                                </div>
                            )
                            {/* choiceNum, option1, option2 */}
                        })}
                    </div>
                </div>
            </div>

        {/* Youtube */}
        <div className="col-md-5">
          <YoutubeEmbed embedId={gameDetails.youtube_url} />
        </div>  

        {/* Result table */}
        <div className="col-md-7 card-margin-bottom" style={{maxHeight: "300px", overflow: "auto"}}>
          <div className="card text-white bg-dark mb-3" style={{}}>
            <div className="card-body bg-dark">
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

export default AdminGameSettingsSakla;
