import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import YoutubeEmbed from "../Youtube";
import TextScroller from "../TextScroller";
import { AuthContext } from "../../store/auth-context";
import socket from "../Websocket/socket";
import { ToastContainer, toast } from "react-toastify";
import {Modal} from 'react-bootstrap';
import "react-toastify/dist/ReactToastify.css";
import "react-toastify/dist/ReactToastify.min.css";
import "./PlayerSakla.css";
import CardModal from "./CardModal";
const axios = require("axios");

function PlayerSakla() {
  //===========================================
  // Global Variables and useState init
  //===========================================
  const ctx = useContext(AuthContext);
  //modal 
  const [show, setShow] = useState(false);
  const [placeBetDisabled, setPlaceBetDisabled] = useState(false);
  const [placeTipDisabled, setPlaceTipDisabled] = useState(false);
  const [placeBetText, setPlaceBetText] = useState("Place Bet");
  const [results, setResults] = useState([]);
  const [totalWinnings, setTotalWinnigs] = useState();
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
  const [resultChoicesSelect, setResultChoicesSelect] = useState([])
  const [renderChoice, setRenderChoice] = useState(false)


  const { gameid } = useParams();
  const gameHeader = process.env.REACT_APP_HEADER_GAME;
  const accountHeader = process.env.REACT_APP_HEADER_ACCOUNT;
  const betHeader = process.env.REACT_APP_HEADER_BET;
  const saklaHeader = process.env.REACT_APP_HEADER_SAKLA;
  const settlementHeader = process.env.REACT_APP_HEADER_SETTLEMENT;
  const gameAuthorization = { "Authorization": process.env.REACT_APP_KEY_GAME };
  const accAuthorization = {
    "Authorization": process.env.REACT_APP_KEY_ACCOUNT,
  };
  const [resultDesc, setResultDesc] = useState("1 BASTOS - 2 BASTOS")
  const betAuthorization = { "Authorization": process.env.REACT_APP_KEY_BET };
  const [bet, setBet] = useState();
 
  //===========================================
  // UseEffect
  //===========================================
  useEffect(() => {
    socket.emit("join_room", "saklaGame")
    getLatestGameDetails();
    getLatestMarketDetails();
    getMarketTrend(false);

    // Fetch Choices
    axios({
      method: "get",
      url: `${saklaHeader}/getChoices/${gameid}`,
      headers: {
        "Authorization": process.env.REACT_APP_KEY_SAKLA,
      },
    }).then((res) => {
      console.log(res.data.data)
      setResultChoicesSelect(res.data.data.choices)
      setRenderChoice(true)
    });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getMarketTrend(showResult) {
    axios({
      method: "get",
      url: `${gameHeader}/getMarketTrend/${gameid}`,
      headers: gameAuthorization,
    }).then((res) => {
      console.log(res.data.data.trends);
      if (showResult){
        const latestResult = res.data.data.trends[0]
        setResultDesc(latestResult.result)
        getBetSlips(marketDetails.market_id, true)
        setShow(true)
      }
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

  function getBetSlips(marketid, calculateWinnings) {
    console.log("here")
    axios({
      method: "get",
      url: `${betHeader}/getAccountBetslips/${ctx.user.accountID}/${marketid}`,
      headers: betAuthorization,
    })
      .then((res) => {
        setBetslip(res.data.data);
        if (calculateWinnings){
          const betSlips = res.data.data  
          var totalWinnings = 0
          betslip.map((bet) => {
            totalWinnings += parseFloat(bet.winnings)
            console.log(bet.winnings)
          })
          console.log(bet.winnings)
          setTotalWinnigs(totalWinnings)

        }

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
      getBetSlips(market.market_id ,true);

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

  const [blink, setBlink] = useState();
  //===========================================
  // Websocket Functions
  //===========================================
  useEffect(() => {
    socket.on("received_saklaMarket_update", (data) => {
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
        getBetSlips(data.marketId, true)
        setTotalWinnigs(0)
        // setTimeout(() => {
        //   getBetSlips(data.market_id);
        // }, 1000);
  
        var newStatus = data.status;
        // Update wallet Balance if Market is Resulted
        if (newStatus === 2) {
          setTimeout(() => {
            getMarketTrend(true);
            
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
          }, 3000);
          newStatus = 5
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
              getBetSlips(marketDetails.market_id, true)
              const newWallet = parseFloat(ctx.walletBalance) - parseFloat(stake);
              ctx.walletHandler(newWallet);
    
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
  }

  function renderBetslips() {
    if (betslip.length === 0) {
      return <h4>No Open Betslips</h4>;
    } else {
      const card1 = betslip[0].description.replace(gameDetails.name + " : ", '').split(' - ')[0]
      const card2 = betslip[0].description.replace(gameDetails.name + " : ", '').split(' - ')[1]

      return (
        <div>
          {betslip.map((x) => (
            <div
              class="card text-white bg-secondary mb-3"
              style={{ padding: "5px" }}
            >
              <h5>  
                Bet #{x.bet_id} {x.description} <br></br> Market #{x.market_id}
              </h5>
              <div className="text-center"> 
              <img src={`/assets/images/${x.description.replace(gameDetails.name + " : ", '').split(' - ')[0]}.PNG`} alt="" style={{width: "auto", height: "100px", marginRight: "5px"}}></img>
              <img src={`/assets/images/${x.description.replace(gameDetails.name + " : ", '').split(' - ')[1]}.PNG`} alt="" style={{width: "auto", height: "100px"}}></img>
              </div>

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

  return (
    <div className="container text-light container-game-room">
      <ToastContainer />
      {/* modal show when resulted */}
            <Modal
                show={show}
                onHide={() => setShow(false)}
                dialogClassName="modal-40w cardModalPopup"
            >
                <Modal.Header closeButton style={{border: "none", paddingBottom: "0px"}}>
                <Modal.Title id="example-modal-sizes-title-lg">
                    Market {marketDetails.market_id} Result
                </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="row cardsModal">
                        <div className="cardOneModal">
                            <img className="cardModalImg" src={`/assets/images/${resultDesc.split(' - ')[0]}.PNG`} alt=""></img>      
                        </div>
                        <div className="cardTwoModal">
                          <img className="cardModalImg" src={`/assets/images/${resultDesc.split(' - ')[1]}.PNG`} alt=""></img>
                        </div>
                    </div>
                    <div className="text-center" style={{marginTop: "10px"}}>
                        <h5>{resultDesc}</h5>
                    </div>
                    <div className="text-center" style={{marginTop: "10px"}}>
                        <h5>Total Winnings: P {parseFloat(totalWinnings).toFixed(2)}</h5>
                    </div>
                    
                </Modal.Body>
            </Modal>
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
            {renderChoice ? 
              <div className="row text-center" style={{marginTop: "20px"}}>
                <CardModal choice={resultChoicesSelect[0]} gameDetails={gameDetails} marketDetails={marketDetails} gameId={gameid} offset="offset-md-1"/>
                <CardModal choice={resultChoicesSelect[1]} gameDetails={gameDetails} marketDetails={marketDetails} gameId={gameid}/>
                <CardModal choice={resultChoicesSelect[2]} gameDetails={gameDetails} marketDetails={marketDetails} gameId={gameid}/>
                <CardModal choice={resultChoicesSelect[3]} gameDetails={gameDetails} marketDetails={marketDetails} gameId={gameid}/>
                <CardModal choice={resultChoicesSelect[4]} gameDetails={gameDetails} marketDetails={marketDetails} gameId={gameid}/>
                <CardModal choice={resultChoicesSelect[5]} gameDetails={gameDetails} marketDetails={marketDetails} gameId={gameid}/>
                <CardModal choice={resultChoicesSelect[6]} gameDetails={gameDetails} marketDetails={marketDetails} gameId={gameid}/>
                <CardModal choice={resultChoicesSelect[7]} gameDetails={gameDetails} marketDetails={marketDetails} gameId={gameid}/>
                <CardModal choice={resultChoicesSelect[8]} gameDetails={gameDetails} marketDetails={marketDetails} gameId={gameid}/>
                <CardModal choice={resultChoicesSelect[9]} gameDetails={gameDetails} marketDetails={marketDetails} gameId={gameid}/>
                <CardModal choice={resultChoicesSelect[10]} gameDetails={gameDetails} marketDetails={marketDetails} gameId={gameid} offset="offset-md-1"/>
                <CardModal choice={resultChoicesSelect[11]} gameDetails={gameDetails} marketDetails={marketDetails} gameId={gameid}/>
                <CardModal choice={resultChoicesSelect[12]} gameDetails={gameDetails} marketDetails={marketDetails} gameId={gameid}/>
                <CardModal choice={resultChoicesSelect[13]} gameDetails={gameDetails} marketDetails={marketDetails} gameId={gameid}/>
                <CardModal choice={resultChoicesSelect[14]} gameDetails={gameDetails} marketDetails={marketDetails} gameId={gameid}/>
                <CardModal choice={resultChoicesSelect[15]} gameDetails={gameDetails} marketDetails={marketDetails} gameId={gameid}/>
                <CardModal choice={resultChoicesSelect[16]} gameDetails={gameDetails} marketDetails={marketDetails} gameId={gameid}/>
                <CardModal choice={resultChoicesSelect[17]} gameDetails={gameDetails} marketDetails={marketDetails} gameId={gameid}/>
                <CardModal choice={resultChoicesSelect[18]} gameDetails={gameDetails} marketDetails={marketDetails} gameId={gameid}/>
                <CardModal choice={resultChoicesSelect[19]} gameDetails={gameDetails} marketDetails={marketDetails} gameId={gameid}/>
              </div> : null
            }
        </div>
      </div>

      
      <div className="row" style={{marginBottom: "30px"}}>
          <div className="col-md-8" >
          {/* Market ID AND Bet Status */}
            <div className="col-md-12" style={{maxHeight: "75px", padding: "10px", marginBottom: "10px", backgroundColor: "#FFF"}}>
              <div className="row">
                <h5 className="col-md-6 col-6" style={{color: "black"}}>
                  Current Market ID: {marketDetails.market_id}
                </h5>
                <h5 className="col-md-6 col-6 alignRight" style={statusStyle} >
                  <b>Betting Status:</b> &nbsp;
                  {marketDetails.status === 0
                    ? " OPEN"
                    : marketDetails.status === 1
                    ? " CLOSED"
                    : " RESULTED"}
                </h5>
                <p style={{color: "black"}}>
                Min/Max Bet: ₱{parseFloat(gameDetails.min_bet).toFixed(2)} - ₱
                {parseFloat(gameDetails.max_bet).toFixed(2)}
              </p>
              </div>
            </div>

            {/* Youtube */}
            <div className="col-md-12" style={{marginBottom: "10px"}}>
              <YoutubeEmbed embedId={gameDetails.youtube_url} />
            </div>

            {/* MARKET RESULTS */}
            <div className="col-md-12" style={{marginBottom: "10px", maxHeight: "280px", background: "#FFF", overflow: "auto"}}>
              <div className="text-center" style={{background: "#FFF"}}>
                <div className="card text-black" style={{background: "#FFF"}}>
                  <div className="card-body table-responsive-sm">
                    <h4 className="card-title">Market Results:</h4>
                    <div class="row results-padding results-padding-sakla">
                      {results.map((x) => {
                        return (
                          <div class="col-md-4 col-6 results-box-padding results-box-margin-sakla" style={(x.result === "PUTI" || x.result === "HIGH") ? {backgroundColor: "rgb(119, 196, 226)", border: "1px solid black"} : (x.result === "PULA" || x.result === "LOW") ? {backgroundColor: "#dd3d3d", border: "1px solid black"} : {backgroundColor: "#a333c8", border: "1px solid black"}}>
                            {x.market_id}
                            <div className="text-center" style={{marginBottom: "5px"}}> 
                              <img src={`/assets/images/${x.result.split(' - ')[0]}.PNG`} alt="" style={{width: "auto", height: "100px", marginRight: "5px"}}></img>
                              <img src={`/assets/images/${x.result.split(' - ')[1]}.PNG`} alt="" style={{width: "auto", height: "100px"}}></img>
                            </div>
                            <div>
                              <label style={{fontSize: "14px", whiteSpace: "pre-line"}}>{x.result.split(' - ')[1] ? `${x.result.split(' - ')[0]} - ` : `${x.result.split(' - ')[0]}`}</label> &nbsp;
                              <label style={{fontSize: "14px",  whiteSpace: "pre-line"}}>{x.result.split(' - ')[1] ? `${x.result.split(' - ')[1]}` : ""}</label>
                            </div>
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
            <div className="col-md-12" style={{maxHeight: "568px", marginBottom: "10px", overflow: "auto"}}>
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
    </div>
  );
}

export default PlayerSakla;
