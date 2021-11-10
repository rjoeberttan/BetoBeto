import React, { useState, useContext, useEffect } from "react";
import "./PlayerAccount.css";
import { AuthContext } from "../../store/auth-context";
import axios from "axios";

function Account() {
  const ctx = useContext(AuthContext);
  const [cellNum, setCellNum] = useState("");
  const [userDetails, setUserDetails] = useState({
    email: "",
    username: "",
    phone: ""
  })
  



  const accountHeader = "http://localhost:4003";
  const gameHeader = "http://localhost:4004";
  //===========================================
  // UseEffect
  //===========================================
  useEffect(() => {
    getUserDetails(ctx.user.accountID)

  }, [])

  function getUserDetails(accountId){
    axios({
      method: "get",
      url: `${accountHeader}/getUserDetails/${accountId}`,
      headers: {
        "Authorization": "uKRd;$SuXd8b$MFX",
      },
    })
    .then((res) => { 
      console.log(res)
      setUserDetails((prev) => {
        return {
          ...prev,
          username: res.data.data.username,
          email: res.data.data.email,
          phone: res.data.data.phone_num
        }
      })
    })
    .catch((err) => {console.log(err)})
  }






  function handleChange(e) {
    const { value } = e.target;
    setUserDetails((prev) => {
      return {
        ...prev,
        phone: e.target.value
      }
    })
  }


  const style = {
    width: "18 rem",
  };

  return (
    <div className="container text-light container-account">
      <div className="heading-text">
        <h1 className="display-5 small-device bold-small">My Account</h1>
      </div>
      <div className="card text-black card-account" style={{ style }}>
        <div className="card-body">value
          <form>
            <div className="row">
              <div className="col-sm-12 spacing">
                <label className="form-label">Email: {userDetails.email}</label>
              </div>
              <div className="col-md-12 spacing">
                <label className="form-label">Username: {userDetails.username} </label>
              </div>
              <div className="col-md-12 spacing">
                <label className="form-label">Cellphone No.</label>
                <input
                  type="number"
                  placeholder = "0927XXXXXXX"
                  className="form-control"
                  name="cellNum"
                  value={userDetails.phone}
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
