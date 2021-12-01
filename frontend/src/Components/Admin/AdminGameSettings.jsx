import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../store/auth-context";
import "./AdminGameSettings.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-toastify/dist/ReactToastify.min.css";
import socket from "../Websocket/socket";
const axios = require("axios").default;

function AdminGameSettings() {
  const ctx = useContext(AuthContext);
  //set state for game variables
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
  //set state for market variables
  const [marketDetails, setMarketDetails] = useState({
    description: "",
    market_id: "",
    status: "",
    result: "",
  });
  //set state for manipulate colors
  const [manipulateColors, setManipualteColors] = useState({
    bb_manip_blue: 0,
    bb_manip_yellow: 0,
    bb_manip_red: 0,
    bb_manip_white: 0,
    bb_manip_green: 0,
    bb_manip_purple: 0,
  });
  const [settingsText, setSettingsText] = useState({
    create: "CREATE MARKET",
    open: "OPEN MARKET",
    close: "CLOSE MARKET",
    result: "RESULT MARKET",
  });
  const [betList, setBetList] = useState([]);
  const [statusChangeDisabled, setStatusChangeDisabled] = useState(false);

  let { gameid } = useParams();

  const accountHeader = process.env.REACT_APP_HEADER_ACCOUNT;
  const gameHeader = process.env.REACT_APP_HEADER_GAME;
  const betHeader = process.env.REACT_APP_HEADER_BET;
  console.log(process.env.REACT_APP_HEADER_WEBSOCKET);

  useEffect(() => {
    socket.emit("join_room", "colorGame");

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
          win_multip1: data.win_multip1,
          win_multip2: data.win_multip2,
          win_multip3: data.win_multip3,
          youtube_url: data.youtube_url,
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
          setBoxColor({
            boxOne: colors[0],
            boxTwo: colors[1],
            boxThree: colors[2],
          });
        }
        //get manipulate values
        axios({
          method: "get",
          url: `${gameHeader}/getManipulateValues/${gameid}/${market.market_id}`,
          headers: {
            "Authorization": process.env.REACT_APP_KEY_GAME,
          },
        }).then((res2) => {
          const manip_values = res2.data.data.market;
          setManipualteColors(manip_values);
        });
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleGameChange(e) {
    const { name, value } = e.target;

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

  const isSelected = (color, boxNum) => {
    if (boxNum === 1) {
      if (color === boxColor.boxOne) {
        return { "selected": "selected" };
      }
    } else if (boxNum === 2) {
      if (color === boxColor.boxTwo) {
        return { "selected": "selected" };
      }
    } else if (boxNum === 3) {
      if (color === boxColor.boxThree) {
        return { "selected": "selected" };
      }
    }
  };

  function handleColorChange(e) {
    const { name, value } = e.target;
    setBoxColor((prev) => {
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
          toast.error(err)
        });
    }
    e.preventDefault();
  }

  function handleWinSettingsClick(e) {
    axios({
      method: "post",
      url: `${gameHeader}/updateColorGameWinMultiplier`,
      headers: {
        "Authorization": process.env.REACT_APP_KEY_GAME,
      },
      data: {
        gameId: gameid,
        editor: ctx.user.username,
        winMultiplier: [
          gameDetails.win_multip1,
          gameDetails.win_multip2,
          gameDetails.win_multip3,
        ],
      },
    })
      .then((res) => {
        toast.success("Win settings saved");
      })
      .catch((err) => {
        toast.error(
          <p>
            Incomplete Multipliers <br></br> Please try again
          </p>
        );
      });
    e.preventDefault();
  }

  function handleBetThresholdsClick(e) {
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
        toast.success("Bet tresholds saved");
      })
      .catch((err) => {
        toast.error(
          <p>
            Incomplete bet tresholds <br></br> Please try again
          </p>
        );
      });
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
        url: `${gameHeader}/createColorGameMarket`,
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
          setManipualteColors({
            bb_manip_blue: 0,
            bb_manip_yellow: 0,
            bb_manip_red: 0,
            bb_manip_white: 0,
            bb_manip_green: 0,
            bb_manip_purple: 0,
          });
          const { data } = res.data;
          setMarketDetails((prev) => {
            return {
              ...prev,
              market_id: data.marketID,
              status: data.status,
            };
          });
          socket.emit("color_game_market_update", {
            marketId: data.marketID,
            status: data.status,
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
        url: `${gameHeader}/openMarket`,
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
          socket.emit("color_game_market_update", {
            marketId: data.marketId,
            status: data.status,
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
        url: `${gameHeader}/closeMarket`,
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
          socket.emit("color_game_market_update", {
            marketId: data.marketId,
            status: data.status,
          });
          toast.success("Success Closed Market");
          DisableSettings();
        })
        .catch((err) => {
          if (marketDetails.status === 1) {
            toast.error("Market is already closed");
          } else {
            toast.error("Market is still in result state");
          }
        });
    }
  }

  function handleResultMarket(e) {
    axios({
      method: "post",
      url: `${gameHeader}/resultMarket`,
      headers: {
        "Authorization": process.env.REACT_APP_KEY_GAME,
      },
      data: {
        gameId: gameid,
        marketId: marketDetails.market_id,
        editor: ctx.user.username,
        result: [boxColor.boxOne, boxColor.boxTwo, boxColor.boxThree],
      },
    })
      .then((res) => {
        setMarketDetails((prev) => {
          return {
            ...prev,
            status: res.data.data.status,
          };
        });
        socket.emit("color_game_market_update", {
          marketId: res.data.data.marketId,
          status: res.data.data.status,
        });
        toast.success("Success Result Market");
        DisableSettings();

        // Settle Bets
        axios({
          method: "post",
          url: `${betHeader}/settleColorGameBets`,
          headers: {
            "Authorization": process.env.REACT_APP_KEY_BET,
          },
          data: {
            gameId: gameid,
            marketId: marketDetails.market_id,
            result: [boxColor.boxOne, boxColor.boxTwo, boxColor.boxThree],
          },
        })
          .then((res) => {
            // console.log(res);
          })
          .catch((err) => {
            // console.log(err);
          });
      })
      .catch((err) => {
        if (marketDetails.status === 2) {
          toast.error("Market is already in Result state");
        } else {
          toast.error("Market is still open");
        }
      });
    e.preventDefault();
  }

  function handleManipulateValues(e) {
    const { name, value } = e.target;
    setManipualteColors((prev) => {
      return {
        ...prev,
        [name]: value,
      };
    });
  }

  function handleManipulateBetClick(e) {
    e.preventDefault();
    axios({
      method: "post",
      url: `${gameHeader}/manipulateBetTotals`,
      headers: {
        "Authorization": process.env.REACT_APP_KEY_GAME,
      },
      data: {
        marketId: marketDetails.market_id,
        editor: ctx.user.username,
        bb_manip: Object.values(manipulateColors),
      },
    })
      .then((res) => {
        toast.success("Bets Manipulated Success");
      })
      .catch((err) => {
        toast.error("Incomplete Bet Manipulation");
      });
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
                  placeholder="Welcome to Master Gamblr"
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
                <div className="row label-margin">
                  <h6 className="card-subtitle mb-2 label-margin">
                    Manipulate Total Color Bets:
                  </h6>
                  <div className="col-md-6 row label-margin">
                    <div className="col-md-5 label-margin">Red</div>
                    <div className="col-md-6">
                      <input
                        className="form-control"
                        type="number"
                        name="bb_manip_red"
                        value={manipulateColors.bb_manip_red}
                        onChange={handleManipulateValues}
                      ></input>
                    </div>
                  </div>
                  <div className="col-md-6 row label-margin">
                    <div className="col-md-5 label-margin">Blue</div>
                    <div className="col-md-6">
                      <input
                        className="form-control"
                        type="number"
                        name="bb_manip_blue"
                        value={manipulateColors.bb_manip_blue}
                        onChange={handleManipulateValues}
                      ></input>
                    </div>
                  </div>
                  <div className="col-md-6 row label-margin">
                    <div className="col-md-5 label-margin">Green</div>
                    <div className="col-md-6">
                      <input
                        className="form-control"
                        type="number"
                        name="bb_manip_green"
                        value={manipulateColors.bb_manip_green}
                        onChange={handleManipulateValues}
                      ></input>
                    </div>
                  </div>
                  <div className="col-md-6 row label-margin">
                    <div className="col-md-5 label-margin">Yellow</div>
                    <div className="col-md-6">
                      <input
                        className="form-control"
                        type="number"
                        name="bb_manip_yellow"
                        value={manipulateColors.bb_manip_yellow}
                        onChange={handleManipulateValues}
                      ></input>
                    </div>
                  </div>
                  <div className="col-md-6 row label-margin">
                    <div className="col-md-5 label-margin">White</div>
                    <div className="col-md-6">
                      <input
                        className="form-control"
                        type="number"
                        name="bb_manip_white"
                        value={manipulateColors.bb_manip_white}
                        onChange={handleManipulateValues}
                      ></input>
                    </div>
                  </div>
                  <div className="col-md-6 row label-margin">
                    <div className="col-md-5 label-margin">Purple</div>
                    <div className="col-md-6">
                      <input
                        className="form-control"
                        type="number"
                        name="bb_manip_purple"
                        value={manipulateColors.bb_manip_purple}
                        onChange={handleManipulateValues}
                      ></input>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <button
                    className="btn btn-color text-light"
                    style={{ marginTop: "15px" }}
                    onClick={handleManipulateBetClick}
                  >
                    Save Manipulate Bets
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
                  type="text"
                  name="min_bet"
                  value={gameDetails.min_bet}
                  onChange={handleGameChange}
                ></input>
                <h6 className="card-subtitle mb-2 label-margin">
                  Maximum Bet Amount:
                </h6>
                <input
                  className="form-control"
                  type="text"
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
                <h6 className="card-subtitle mb-2 label-margin">
                  Win settings
                </h6>
                <div className="row">
                  <div className="col-md-12 row">
                    <div className="col-md-5 label-margin">
                      1-Hit Multiplier
                    </div>
                    <div className="col-md-6">
                      <input
                        className="form-control"
                        name="win_multip1"
                        value={gameDetails.win_multip1}
                        onChange={handleGameChange}
                      ></input>
                    </div>
                  </div>
                  <div className="col-md-12 row label-margin">
                    <div className="col-md-5 label-margin">
                      2-Hit Multiplier
                    </div>
                    <div className="col-md-6">
                      <input
                        className="form-control"
                        name="win_multip2"
                        value={gameDetails.win_multip2}
                        onChange={handleGameChange}
                      ></input>
                    </div>
                  </div>
                  <div className="col-md-12 row label-margin">
                    <div className="col-md-5 label-margin">
                      3-Hit Multiplier
                    </div>
                    <div className="col-md-6">
                      <input
                        className="form-control"
                        name="win_multip3"
                        value={gameDetails.win_multip3}
                        onChange={handleGameChange}
                      ></input>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <button
                    className="btn btn-color text-light"
                    style={{ marginTop: "15px" }}
                    onClick={handleWinSettingsClick}
                  >
                    Save Win Settings
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
              <div className="row" style={{ marginTop: "15px" }}>
                <select
                  className={`col-sm-3 col-5 ${boxColor.boxOne}-boxx radio-button`}
                  name="boxOne"
                  onChange={handleColorChange}
                  style={{ marginLeft: "25px" }}
                >
                  <option {...isSelected("RED", 1)} value="RED">
                    Red
                  </option>
                  <option {...isSelected("BLUE", 1)} value="BLUE">
                    Blue
                  </option>
                  <option {...isSelected("GREEN", 1)} value="GREEN">
                    Green
                  </option>
                  <option {...isSelected("YELLOW", 1)} value="YELLOW">
                    Yellow
                  </option>
                  <option {...isSelected("WHITE", 1)} value="WHITE">
                    White
                  </option>
                  <option {...isSelected("PURPLE", 1)} value="PURPLE">
                    Purple
                  </option>
                </select>
                <select
                  className={`col-sm-3 col-5 ${boxColor.boxTwo}-boxx radio-button`}
                  name="boxTwo"
                  onChange={handleColorChange}
                >
                  <option {...isSelected("RED", 2)} value="RED">
                    Red
                  </option>
                  <option {...isSelected("BLUE", 2)} value="BLUE">
                    Blue
                  </option>
                  <option {...isSelected("GREEN", 2)} value="GREEN">
                    Green
                  </option>
                  <option {...isSelected("YELLOW", 2)} value="YELLOW">
                    Yellow
                  </option>
                  <option {...isSelected("WHITE", 2)} value="WHITE">
                    White
                  </option>
                  <option {...isSelected("PURPLE", 2)} value="PURPLE">
                    Purple
                  </option>
                </select>
                <select
                  className={`col-sm-3 col-5 ${boxColor.boxThree}-boxx radio-button`}
                  name="boxThree"
                  onChange={handleColorChange}
                >
                  <option {...isSelected("RED", 3)} value="RED">
                    Red
                  </option>
                  <option {...isSelected("BLUE", 3)} value="BLUE">
                    Blue
                  </option>
                  <option {...isSelected("GREEN", 3)} value="GREEN">
                    Green
                  </option>
                  <option {...isSelected("YELLOW", 3)} value="YELLOW">
                    Yellow
                  </option>
                  <option {...isSelected("WHITE", 3)} value="WHITE">
                    White
                  </option>
                  <option {...isSelected("PURPLE", 3)} value="PURPLE">
                    Purple
                  </option>
                </select>
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

export default AdminGameSettings;
