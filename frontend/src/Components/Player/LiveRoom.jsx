import React, { useEffect, useState } from "react";
import {useParams} from "react-router-dom";
import YoutubeEmbed from "../Youtube";
import TextScroller from "../TextScroller";
import "./LiveRoom.css";
import {socketIOClient, io} from 'socket.io-client';
import socket from '../Websocket/socket'
const axios = require("axios");


function LiveRoom() {
  const [color, setColor] = useState("red");
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
  const { gameId } = useParams()
  const accountHeader = "http://localhost:4003";
  const gameHeader = "http://localhost:4004";
  socket.emit("join_room", "colorGame");
  
  //===========================================
  // UseEffect
  //===========================================
  useEffect(() => {
    getLatestGameDetails()
    getLatestMarketDetails() 

  }, [])

  function getLatestGameDetails(){
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

  function getLatestMarketDetails(){
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
      console.log(market)
      setMarketDetails({
        description: market.description,
        market_id: market.market_id,
        status: market.status,
        result: market.result,
      });      
    });
  }


  //===========================================
  // Websocket Functions
  //===========================================
  useEffect(() => {
    socket.on("received_market_update", (data) => {
      console.log(data)
      setMarketDetails((prev) => {
        return {
          ...prev,
          market_id: data.marketId,
          status: data.status
        }
      })
    })
  }, [socket]) 
















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
      <div className="heading-text">
        <h1 className="display-5 small-device bold-small">Live {gameDetails.name}</h1>
      </div>
      <div className="row">
        <div className="col-md-12 banner-message">
          <TextScroller text={gameDetails.banner} />
        </div>
        <div className="col-md-8">
          <YoutubeEmbed embedId="rokGy0huYEA" />
        </div>
        <div className="col-md-4 live-room-colorbox">
          <div class="card txt-black">
            <div class="card-body">
              <h5 class="card-title">Current Market ID: {marketDetails.market_id}</h5>
              <p class="card-text">Betting Status: {marketDetails.status === 0
                  ? " OPEN"
                  : marketDetails.status === 1
                  ? " CLOSED"
                  : " RESULTED"}</p>
              <div className="row text-center">
                <label className="col-sm-3 col-5 red-box radio-button fix-padding-left">
                  <input
                    className="radio-card"
                    type="radio"
                    name="colors"
                    value="red"
                    onChange={handleChange}
                  />
                  <label className="color-name">Total: ₱ 120</label>
                </label>
                <label className="col-sm-3 col-5 blue-box radio-button fix-padding-left">
                  <input
                    className="radio-card"
                    type="radio"
                    name="colors"
                    value="blue"
                    onChange={handleChange}
                  />
                  <label className="color-name">Total: ₱ 123</label>
                </label>
                <label className="col-sm-3 col-5 green-box radio-button fix-padding-left">
                  <input
                    className="radio-card"
                    type="radio"
                    name="colors"
                    value="green"
                    onChange={handleChange}
                  />
                  <label for="huey" className="color-name">Total: ₱ 69696</label>
                </label>
                <label className="col-sm-3 col-5 yellow-box radio-button fix-padding-left">
                  <input
                    className="radio-card"
                    type="radio"
                    name="colors"
                    value="yellow"
                    onChange={handleChange}
                  />
                  <label for="huey" className="color-name">Total: ₱ 1234</label>
                </label>
                <label className="col-sm-3 col-5 white-box radio-button fix-padding-left">
                  <input
                    className="radio-card"
                    type="radio"
                    name="colors"
                    value="white"
                    onChange={handleChange}
                  />
                  <label for="huey" className="color-name">Total: ₱ 142124</label>
                </label>
                <label className="col-sm-3 col-5 purple-box radio-button fix-padding-left">
                  <input
                    className="radio-card"
                    type="radio"
                    name="colors"
                    value="purple"
                    onChange={handleChange}
                  />
                  <label for="huey" className="color-name">Total: ₱ 124124</label>
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
                  />
                </div>
              </div>
              <div className="col-md-12 text-center">
                <button
                  type="submit"
                  className="btn btn-color game-btn text-light"
                >
                  Place Bet
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
                <input type="text" class="form-control" placeholder="$500" />
                <button class="btn btn-color text-light" type="button">
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
