import React from "react";
import { Redirect } from "react-router-dom";

function Player({ authorize, details }) {
  if (!authorize) {
    return <Redirect to="/" />;
  }
  return <div>Hello {details.email}</div>;
}

export default Player;
