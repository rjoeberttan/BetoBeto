import React, { useState } from "react";
import {  useParams } from "react-router-dom";
import "./AdminGameSettings.css";

function AdminGameSettings() {
  let { gameid } = useParams();
  console.log(gameid);

  const [boxColor, setBoxColor] = useState({
    boxOne: "red",
    boxTwo: "red",
    boxThree: "red"
  })

  function handleChange(e){
    const {name, value} = (e.target);
    setBoxColor((prev) => {
      return {
        ...prev,
        [name]: value
      }
    })
  }

  function handleResultMarket(e){
    console.log(boxColor);
    e.preventDefault();
  }

  return (
    <div className="container text-light container-game-room">
      <div className="heading-text">
        <h1 className="display-6 small-device bold-small">Manage Settings</h1>
      </div>
      <div className="row">
        {/* CARD ONE */}
        <div className="col-md-4 card-margin-bottom">
          <div class="card text-white bg-dark mb-3">
            <div class="card-body">
              <h5 class="card-title">Game Settings</h5>
              <form>
                <h6 class="card-subtitle mb-2 label-margin">Game title:</h6>
                <input
                  className="form-control"
                  type="text"
                  placeholder="Dice Game"
                ></input>
                <h6 class="card-subtitle mb-2 label-margin">
                  Youtube Embed URL:
                </h6>
                <input
                  className="form-control"
                  type="text"
                  placeholder="https://www.youtube.com/embed/BSS8Y-0hOlY"
                ></input>
                <h6 class="card-subtitle mb-2 label-margin">Message:</h6>
                <input
                  className="form-control"
                  type="text"
                  placeholder="Welcome to Master Gamblr"
                ></input>
                 <div className="row label-margin">
                 <h6 class="card-subtitle mb-2 label-margin">
                  Manipulate Total Color Bets:
                </h6>
                  <div className="col-md-6 row label-margin">
                    <div className="col-md-5 label-margin">
                      Red
                    </div>
                    <div className="col-md-6">
                      <input className="form-control" type="number"></input>
                    </div>
                  </div>
                  <div className="col-md-6 row label-margin">
                    <div className="col-md-5 label-margin">
                      Blue
                    </div>
                    <div className="col-md-6">
                      <input className="form-control" type="number"></input>
                    </div>
                  </div>
                  <div className="col-md-6 row label-margin">
                    <div className="col-md-5 label-margin">
                      Green
                    </div>
                    <div className="col-md-6">
                      <input className="form-control" type="number"></input>
                    </div>
                  </div>
                  <div className="col-md-6 row label-margin">
                    <div className="col-md-5 label-margin">
                      Yellow
                    </div>
                    <div className="col-md-6">
                      <input className="form-control" type="number"></input>
                    </div>
                  </div>
                  <div className="col-md-6 row label-margin">
                    <div className="col-md-5 label-margin">
                      White
                    </div>
                    <div className="col-md-6">
                      <input className="form-control" type="number"></input>
                    </div>
                  </div>
                  <div className="col-md-6 row label-margin">
                    <div className="col-md-5 label-margin">
                      Purple
                    </div>
                    <div className="col-md-6">
                      <input className="form-control" type="number"></input>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <button
                    className="btn btn-color text-light"
                    style={{ marginTop: "15px" }}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* CARD TWO */}
        <div className="col-md-4 card-margin-bottom">
          <div class="card text-white bg-dark mb-3">
            <div class="card-body">
              <h5 class="card-title">Bet and Settings</h5>
              <form>
                <h6 class="card-subtitle mb-2 label-margin">
                  Minimum Bet Amount:
                </h6>
                <input
                  className="form-control"
                  type="text"
                  placeholder="10.00"
                ></input>
                <h6 class="card-subtitle mb-2 label-margin">
                  Maximum Bet Amount:
                </h6>
                <input
                  className="form-control"
                  type="text"
                  placeholder="5000.00"
                ></input>
                <h6 class="card-subtitle mb-2 label-margin">Win settings</h6>
                <div className="row">
                  <div className="col-md-12 row">
                    <div className="col-md-5 label-margin">
                      1-Hit Multiplier
                    </div>
                    <div className="col-md-6">
                      <input className="form-control"></input>
                    </div>
                  </div>
                  <div className="col-md-12 row label-margin">
                    <div className="col-md-5 label-margin">
                      2-Hit Multiplier
                    </div>
                    <div className="col-md-6">
                      <input className="form-control"></input>
                    </div>
                  </div>
                  <div className="col-md-12 row label-margin">
                    <div className="col-md-5 label-margin">
                      3-Hit Multiplier
                    </div>
                    <div className="col-md-6">
                      <input className="form-control"></input>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <button
                    className="btn btn-color text-light"
                    style={{ marginTop: "15px" }}
                  >
                    Result Market
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* CARD THREE */}
        <div className="col-md-4 card-margin-bottom">
          <div class="card text-white bg-dark mb-3">
            <div class="card-body">
              <h5 class="card-title">Market Settings</h5>
              <div className="row">
                <div className="col-md-4 text-center">
                  <button className="btn btn-color text-light">
                    CREATE MARKET
                  </button>
                </div>
                <div className="col-md-4 text-center">
                  <button className="btn btn-color text-light">
                    OPEN MARKET
                  </button>
                </div>
                <div className="col-md-4 text-center">
                  <button className="btn btn-color text-light">
                    CLOSE MARKET
                  </button>
                </div>
              </div>
              <hr />
              <h5 class="card-title">Current Market ID: AB12CD2</h5>
              <h6 class="card-subtitle mb-2 text-muted">
                <b>Result Market</b>
              </h6>
              <div className="row" style={{ marginTop: "15px" }}>
                <select className={`col-sm-3 col-5 ${boxColor.boxOne}-boxx radio-button`} name="boxOne" onChange={handleChange} style={{marginLeft: "25px"}}>
                    <option value="red">Red</option>
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="yellow">Yellow</option>
                    <option value="white">White</option>
                    <option value="purple">Purple</option>
                </select>
                <select className={`col-sm-3 col-5 ${boxColor.boxTwo}-boxx radio-button`}  name="boxTwo" onChange={handleChange}>
                    <option value="red">Red</option>
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="yellow">Yellow</option>
                    <option value="white">White</option>
                    <option value="purple">Purple</option>
                </select>
                <select className={`col-sm-3 col-5 ${boxColor.boxThree}-boxx radio-button`}  name="boxThree" onChange={handleChange}>
                    <option value="red">Red</option>
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="yellow">Yellow</option>
                    <option value="white">White</option>
                    <option value="purple">Purple</option>
                </select>
                <div
                  className="col-md-12 text-center"
                  style={{ marginTop: "15px" }}
                >
                  <button className="btn btn-color text-light" onClick={handleResultMarket}>
                    Result Market
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD FOUR */}
        <div className="col-md-12 card-margin-bottom">
          <div class="card text-white bg-dark mb-3" style={{}}>
            <div class="card-body">
              <h5 class="card-title">Received Bets</h5>
              <h6 class="card-subtitle mb-2 text-muted">
                <b>Current Market ID: AB12CD2 </b>
              </h6>
              <table class="table table-success table-striped">
                <thead>
                  <tr>
                    <th scope="col">Bet ID</th>
                    <th scope="col">Username</th>
                    <th scope="col">Description</th>
                    <th scope="col">Stake</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">1</th>
                    <td>Player01</td>
                    <td>DICE-BLUE</td>
                    <td>10.00</td>
                    <td>WIN</td>
                  </tr>
                  <tr>
                    <th scope="row">2</th>
                    <td>Player02</td>
                    <td>DICE-BLUE</td>
                    <td>200.00</td>
                    <td>LOSE</td>
                  </tr>
                  <tr>
                    <th scope="row">3</th>
                    <td>Player03</td>
                    <td>DICE-BLUE</td>
                    <td>200.00</td>
                    <td>PENDING</td>
                  </tr>
                </tbody>
              </table>
              <div className="col-md-12 text-center">
                <button className="btn btn-color text-light">Refresh</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminGameSettings;
