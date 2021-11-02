import React, { useState } from "react";
import YoutubeEmbed from "../Youtube";
import TextScroller from "../TextScroller";
import "./LiveRoom.css";

function LiveRoom() {
  const [color, setColor] = useState("red");

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
        <h1 className="display-5 small-device bold-small">Live Dice Game</h1>
      </div>
      <div className="row">
        <div className="col-md-12 banner-message">
          <TextScroller text="Welcome to Master Gambler!" />
        </div>
        <div className="col-md-8">
          <YoutubeEmbed embedId="rokGy0huYEA" />
        </div>
        <div className="col-md-4 live-room-colorbox">
          <div class="card txt-black">
            <div class="card-body">
              <h5 class="card-title">Current Market ID: AB12CD2</h5>
              <p class="card-text">Betting Status: OPEN</p>
              <div className="row text-center">
                <label className="col-sm-3 col-5 red-box radio-button">
                  <input
                    className="radio-button"
                    type="radio"
                    name="colors"
                    value="red"
                    onChange={handleChange}
                  />
                  <label for="huey">Red</label>
                </label>
                <label className="col-sm-3 col-5 blue-box radio-button">
                  <input
                    className="radio-button"
                    type="radio"
                    name="colors"
                    value="blue"
                    onChange={handleChange}
                  />
                  <label for="huey">Blue</label>
                </label>
                <label className="col-sm-3 col-5 green-box radio-button">
                  <input
                    className="radio-button"
                    type="radio"
                    name="colors"
                    value="green"
                    onChange={handleChange}
                  />
                  <label for="huey">Green</label>
                </label>
                <label className="col-sm-3 col-5 yellow-box radio-button">
                  <input
                    className="radio-button"
                    type="radio"
                    name="colors"
                    value="yellow"
                    onChange={handleChange}
                  />
                  <label for="huey">Yellow</label>
                </label>
                <label className="col-sm-3 col-5 white-box radio-button">
                  <input
                    className="radio-button"
                    type="radio"
                    name="colors"
                    value="white"
                    onChange={handleChange}
                  />
                  <label for="huey">White</label>
                </label>
                <label className="col-sm-3 col-5 purple-box radio-button">
                  <input
                    className="radio-button"
                    type="radio"
                    name="colors"
                    value="purple"
                    onChange={handleChange}
                  />
                  <label for="huey">Purple</label>
                </label>
              </div>
              <div className="row wallet-box">
                <div className="col-md-4 col-3">
                  <div className="stake-box text-center" style={style}>
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
