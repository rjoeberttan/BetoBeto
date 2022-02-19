import React from "react";

export default function InputTotalisator(props) {
  return (
    <div className="row wallet-box wage-box">
      <div className="col-md-6 col-8">
        <input
          type="number"
          className="form-control wage-input"
          onWheel={(e) => e.target.blur()}
          placeholder={`₱${parseFloat(props.gameDetails).toFixed(
            2
          )}-₱${parseFloat(props.gameDetailsMaxBet).toFixed(2)} `}
          onChange={props.handleStakeChange}
          value={props.stake}
        />
      </div>
      <div className="col-md-6 col-4">
        <button
          type="submit"
          className="btn btn-color text-light wage-button"
          disabled={props.placeBetDisabled}
          onClick={props.placeBet}
        >
          {props.placeBetText}
        </button>
      </div>
    </div>
  );
}
