import React from "react";

export default function PlayerTotalisator(props) {
  return (
    <div className="row" style={{ marginTop: "30px" }}>
      <label>Place Bet:</label>

      <div className="row text-center place-bet-boxes">
        <label
          className="col-md-3 col-4 placebet-styles-low"
          style={props.bet === "low" ? { border: "3px solid green" } : {}}
        >
          LOW
          <p>1.99</p>
          <input
            class="checked"
            type="radio"
            name="bet"
            value="low"
            onChange={props.handleChange}
          />
        </label>
        <label
          className="col-md-3 col-4 placebet-styles-draw"
          style={props.bet === "draw" ? { border: "3px solid green" } : {}}
        >
          DRAW
          <p>1.92</p>
          <input
            class="checked"
            type="radio"
            name="bet"
            value="draw"
            onChange={props.handleChange}
          />
        </label>
        <label
          className="col-md-3 col-4 placebet-styles-high"
          style={props.bet === "high" ? { border: "3px solid green" } : {}}
        >
          HIGH
          <p>1.92</p>
          <input
            class="checked"
            type="radio"
            name="bet"
            value="high"
            onChange={props.handleChange}
          />
        </label>
      </div>
    </div>
  );
}
