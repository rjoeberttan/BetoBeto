import React, { useState } from "react";
import "./PlayerAccount.css";

function Account() {
  const style = {
    width: "18 rem",
  };

  const [cellNum, setCellNum] = useState("09273141930");

  function handleChange(e) {
    const { value } = e.target;
    setCellNum(value);
  }

  return (
    <div className="container text-light container-account">
      <div className="heading-text">
        <h1 className="display-5 small-device bold-small">My Account</h1>
      </div>
      <div className="card text-black card-account" style={{ style }}>
        <div className="card-body">
          <div className="heading-text">
            <h1 className="display-6 small-device bold-small">
              Account Details
            </h1>
          </div>
          <form>
            <div className="row">
              <div className="col-sm-12 spacing">
                <label className="form-label">Email: testing@player.com</label>
              </div>
              <div className="col-md-12 spacing">
                <label className="form-label">Username: pogiako69 </label>
              </div>
              <div className="col-md-12 spacing">
                <label className="form-label">Cellphone No.</label>
                <input
                  type="number"
                  className="form-control"
                  name="cellNum"
                  value={cellNum}
                  onChange={handleChange}
                  onWheel={(e) => e.target.blur()}
                />
              </div>
              <div className="col-md-12 text-center">
                <button className="btn btn-color register-btn text-light">
                  Save
                </button>
              </div>
            </div>
            <hr />
            <div className="heading-text">
              <h1 className="display-6 small-device bold-small">
                Change password
              </h1>
              <div className="row">
                <div className="col-sm-6 spacing">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Password"
                  />
                </div>
                <div className="col-md-6 spacing">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Confirm Password"
                  />
                </div>
                <div className="col-md-12 text-center">
                  <button className="btn btn-color register-btn text-light">
                    Save
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Account;

// style="max-width: 18rem;"
