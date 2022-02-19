import React from "react";

export default function PotentialWin(props) {
  return (
    <div className="text potential-text">
      <label>Potential Win: P{props.money}</label>
    </div>
  );
}
