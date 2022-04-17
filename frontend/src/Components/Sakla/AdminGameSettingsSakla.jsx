import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../store/auth-context";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-toastify/dist/ReactToastify.min.css";
import YoutubeEmbed from "../Youtube";
import socket from "../Websocket/socket";
import AdminModalSakla from "./AdminModalSakla";
import { components } from "react-select";
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
  const [resultChoicesSelect, setResultChoicesSelect] = useState([])

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
  const [winMultiplier, setWinMultiplier] = useState();

  let { gameid } = useParams();

  const accountHeader = process.env.REACT_APP_HEADER_ACCOUNT;
  const gameHeader = process.env.REACT_APP_HEADER_GAME;
  const betHeader = process.env.REACT_APP_HEADER_BET;
  const saklaHeader = process.env.REACT_APP_HEADER_SAKLA;
  const settlementHeader = process.env.REACT_APP_HEADER_SETTLEMENT;

  useEffect(() => {
    const token = localStorage.getItem("token");
    socket.emit("join_room", "saklaGame")
    //get user auth
    axios({
      method: "get",
      url: `${accountHeader}/isUserAuth`,
      headers: {
        "x-access-token": token,
        "Authorization": process.env.REACT_APP_KEY_ACCOUNT,
      },
    }).then((res) => {

      // Fetch Game Details
      axios({
        method: "get",
        url: `${gameHeader}/getGameDetails/${gameid}`,
        headers: {
          "Authorization": process.env.REACT_APP_KEY_GAME,
        },
      }).then((res) => {
      
        const { data } = res.data;
        console.log(data)
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
        setWinMultiplier(data.win_multip1)
      });

      // Fetch Market Details
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

      // Fetch Choices
      axios({
        method: "get",
        url: `${saklaHeader}/getChoices/${gameid}`,
        headers: {
          "Authorization": process.env.REACT_APP_KEY_SAKLA,
        },
      }).then((res) => {
        console.log(res.data.data)
        setResultChoicesSelect(res.data.data['choices'])
      });
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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

    // Create Market
    if (name === "createMarket") {
      axios({
        method: "post",
        url: `${saklaHeader}/createMarket`,
        headers: {
          "Authorization": process.env.REACT_APP_KEY_SAKLA,
        },
        data: {
          gameId: gameid,
          gameName: gameDetails.name,
          editor: ctx.user.username,
        },
      })
        .then((res) => {
          const { data } = res.data;
          console.log(data);
          setMarketDetails((prev) => {
            return {
              ...prev,
              market_id: data.marketId,
              status: data.status,
            };
          });
          socket.emit("saklaGame_market_update", {
            marketId: data.marketId,
            status: data.status,
            gameId: gameid
          });
          toast.success("Success Create Market");
          DisableSettings();
        })
        .catch((err) => {
          toast.error(err.response.data.message)
        });
      

    // Open Market
    } else if (name === "openMarket") {
      axios({
        method: "post",
        url: `${saklaHeader}/openMarket`,
        headers: {
          "Authorization": process.env.REACT_APP_KEY_SAKLA,
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
          socket.emit("saklaGame_market_update", {
            marketId: data.marketId,
            status: data.status,
            gameId: gameid
          });
          toast.success("Successfully Open Market");
          DisableSettings();
        })
        .catch((err) => {
          toast.error(err.response.data.message)
        });

    // Close Market
    } else if (name === "closeMarket") {
      axios({
        method: "post",
        url: `${saklaHeader}/closeMarket`,
        headers: {
          "Authorization": process.env.REACT_APP_KEY_SAKLA,
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
          socket.emit("saklaGame_market_update", {
            marketId: data.marketId,
            status: data.status,
            gameId: gameid
          });
          toast.success("Successfully Closed Market");
          DisableSettings();
        })
        .catch((err) => {
          toast.error(err.response.data.message)
        });
    }
  }

  function handleResultMarket(e) {
    if (window.confirm("Are you sure to result this market?" || resultChoice !== "")) {
      console.log(resultChoice)
      axios({
        method: "post",
        url: `${saklaHeader}/resultMarket`,
        headers: {
          "Authorization": process.env.REACT_APP_KEY_SAKLA,
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

          axios({
            method: "post",
            url: `${settlementHeader}/settleSaklaBets`,
            headers: {
              "Authorization" : process.env.REACT_APP_KEY_SETTLEMENT
            }, 
            data: {
              gameId: gameid,
              marketId: marketDetails.market_id,
              result: resultChoice,
              gameName: gameDetails.name,
              winMultiplier: winMultiplier
            }
          }).then((res) => {
            console.log(res)
          })
          toast.success(res.data.message)
          
          //State Resets
          socket.emit("saklaGame_market_update", {
            marketId: res.data.data.marketId,
            status: 2,
            gameId: gameid
          });

        })
        .catch((err) => {
          toast.error(err.response.data.message)
        });
    } else {
      toast.info("Result Market Cancelled or no winning choice selected");
    }
    e.preventDefault();
  }

  function handleCancelMarket(e) {
    if (window.confirm("Are you sure to cancel this market?")) {
      axios({
        method: "post",
        url: `${saklaHeader}/resultMarket`,
        headers: {
          "Authorization": process.env.REACT_APP_KEY_SAKLA,
        },
        data: {
          gameId: gameid,
          marketId: marketDetails.market_id,
          editor: ctx.user.username,
          result: "CANCELLED/DRAW",
        },
      })
        .then((res) => {
          setMarketDetails((prev) => {
            return {
              ...prev,
              status: res.data.data.status,
            };
          });
          toast.success("Market Cancelled")
          
          //State Resets
          socket.emit("totalisator_market_update", {
            marketId: res.data.data.marketId,
            status: 4,
            gameId: gameid
          });
          axios({
            method: "post",
            url: `${settlementHeader}/settleSaklaBets`,
            headers: {
              "Authorization" : process.env.REACT_APP_KEY_SETTLEMENT
            }, 
            data: {
              gameId: gameid,
              marketId: marketDetails.market_id,
              result: "CANCELLED/DRAW",
              gameName: gameDetails.name,
              winMultiplier: winMultiplier
            }
          }).then((res) => {
            console.log(res)
          })

        })
        .catch((err) => {
          toast.error(err.response.data.message)
        });
    } else {
      toast.info("Cancel Market Cancelled");
    }
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

  function handleWinMultiplierChange(e){
    console.log(e.target.value)
    setWinMultiplier(e.target.value)
  }

  function handleManipulateValue(e){
    const choiceId = e.target.name
    const newManipValue = e.target.value
    const copyManipulateValue = resultChoicesSelect

    const objIndex = copyManipulateValue.findIndex(choice => parseFloat(choice.choice_id) === parseFloat(choiceId))
    copyManipulateValue[objIndex].manipulate_val = parseFloat(newManipValue)
    setResultChoicesSelect([...copyManipulateValue])
  }

  function saveManpulateBetValue(e){
    console.log(e.target.name)
    const choiceId = e.target.name
    const objIndex = resultChoicesSelect.findIndex(choice => parseFloat(choice.choice_id) === parseFloat(choiceId))
    const manipulateValue = resultChoicesSelect[objIndex]['manipulate_val']
    console.log(choiceId, manipulateValue)

    axios({
      method: "patch",
      url: `${saklaHeader}/updateChoiceDetails`,
      headers: {
        "Authorization": process.env.REACT_APP_KEY_SAKLA
      },
      data: {
        gameId: gameid,
        choiceId: choiceId,
        description: resultChoicesSelect[objIndex]['description'],
        manipulateValue: manipulateValue,
        editor: ctx.user.username
      }
    })
      .then((res)=> {
        toast.success(res.data.message)
      })

    e.preventDefault()
  }


  function saveWinMulitplier(e){
    if (parseFloat(winMultiplier) > 0){
      axios({
        method: "patch",
        url: `${saklaHeader}/updateSaklaWinMultiplier`,
        headers: {
          "Authorization": process.env.REACT_APP_KEY_SAKLA
        },
        data: {
          gameId: gameid,
          multiplier: winMultiplier,
          editor: ctx.user.username
        }
      }).then((res) => {
        console.log(res.data)
      })
    } else {
      toast.error("Win Multiplier must be greater than zero")
    }
    e.preventDefault()
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
      <div className="heading-text row" style={{display: "flex", alignItems: "center"}}>
        <div className="col-md-6 col-6">
          <h1 className="display-6 small-device bold-small">Manage Settings</h1>
        </div>
        <div className="col-md-6 col-6" style={{display: "inline-flex", justifyContent: "flex-end"}}>
          <AdminModalSakla />
        </div>
      </div>
      <div className="row" style={{marginBottom: "30px"}}>
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
                    <select class="form-select" style={{maxWidth: "300px", margin: "auto", marginTop: "5px"}} onChange={handleChange}>
                            <option selected>Select</option>
                        {resultChoicesSelect.map(choice => {
                            return(<option value={choice.description}>{choice.description}</option>)
                        })}
                    </select>

                    <div style={{width: "auto", margin: "auto"}}>
                    <button
                        className="btn btn-color text-light"
                        style={{ marginTop: "15px", marginRight: "5px" }}
                        onClick={handleResultMarket}
                    >
                        Result Market
                    </button>
                    <button
                        className="btn btn-color text-light"
                        style={{ marginTop: "15px" }}
                        onClick={handleCancelMarket}
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
                              onKeyPress={(event) => {
                              if (!/[0-9]/.test(event.key)) {
                                event.preventDefault();
                              }}}
                              onChange={handleWinMultiplierChange}
                              value={winMultiplier}
                            ></input>
                        </div>
                        </div>
                    </div>
                    <div className="text-center">
                    <button
                        className="btn btn-color text-light"
                        style={{ marginTop: "15px", minWidth: "100px" }}
                        onClick={saveWinMulitplier}
                    >
                        Save
                    </button>
                    </div>
                </form>
                </div>
            </div>
            </div>


            {/* Manipulate Bets */}
            <div className="col-md-5 card-margin-bottom" style={{minWidth: "410px", maxHeight: "436px", overflow: "auto"}}>
                <div className="card text-white bg-dark mb-3" style={{backgroundColor: "blue", display: "inline-block"}}>
                    <div className="card-body bg-dark">
                    <h5 className="card-title">Manipulate Bets</h5>
                    <form>
                    <div className="row">
                        {resultChoicesSelect.map(choice => {
                          return(
                            <div className="col-md-12 row label-margin" style={{marginBottom: "5px"}}>
                              <div className="col-md-4 label-margin" style={{whiteSpace: "nowrap"}}>{choice.description}</div>
                              <div className="col-md-6">
                                <input
                                  className="form-control"
                                  name={choice.choice_id}
                                  type="number"
                                  style={{maxWidth: "50px", marginLeft: "150px"}}
                                  placeholder="0"
                                  value={parseFloat(choice.manipulate_val)}
                                  onKeyPress={(event) => {
                                  if (!/[0-9]/.test(event.key)) {
                                    event.preventDefault();
                                  }}}
                                  onChange={handleManipulateValue}
                                ></input>
                              </div>
                              <div className="col-md-2">
                                <button
                                  className="btn btn-color text-light"
                                  name={choice.choice_id}
                                  style={{ minWidth: "70px" }}
                                  onClick={saveManpulateBetValue}
                                >
                                  Save
                                </button>
                              </div>
                            </div>                     
                            )
                        })}
                    </div>
                    {/* <div className="text-center">
                    <button
                        className="btn btn-color text-light"
                        style={{ marginTop: "15px", minWidth: "100px" }}
                    >
                        Save
                    </button>
                    </div> */}
                    </form>
                    </div>
                </div>
          </div>

        {/* Result table */}
        <div className="col-md-7 card-margin-bottom" style={{maxHeight: "500px", overflow: "auto"}}>
          <div className="card text-white bg-dark mb-3">
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

        {/* Youtube */}
        <div className="col-md-12">
          <YoutubeEmbed embedId={gameDetails.youtube_url} />
        </div>  

        
      </div>
    </div>
  );
}

export default AdminGameSettingsSakla;
