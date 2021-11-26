import React, { useState, useRef, useEffect, useContext } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-toastify/dist/ReactToastify.min.css";
import { AuthContext } from "../store/auth-context";
import styles from "./MyAccount.module.css";

function MyAccount() {
  const ctx = useContext(AuthContext);
  const style = {
    width: "18 rem",
  };

  const [cellNum, setCellNum] = useState(ctx.user.phoneNum);

  function handleChange(e) {
    const { value } = e.target;
    setCellNum(value);
  }

  useEffect(() => {
    console.log(ctx.user);
    //     accountID: 16
    // accountType: "admin"
    // email: "admin1@gmail.com"
    // phoneNum: "09150000000"
    // username: "admin1"
  }, []);

  const linkTxt = useRef(null);

  const referralLink = `http://localhost:3000/register/${ctx.user.accountID}`;

  return (
    <div className={`container text-light ${styles.containerAccount}`}>
      <ToastContainer />
      <div className="heading-text">
        <h1 className="display-5 small-device bold-small">My Account</h1>
      </div>
      <div
        className={`card text-black ${styles.cardAccount}`}
        style={{ style }}
      >
        <div className="card-body">
          <div className="heading-text">
            <h1 className="display-6 small-device bold-small">Referral Link</h1>
            <div className="row">
              <div className="col-sm-9 spacing">
                <label className={styles.referralLink} ref={linkTxt}>
                  {referralLink}
                </label>
              </div>
              <div className="col-sm-3 spacing text-center">
                <button
                  className="btn btn-color register-btn text-light "
                  onClick={() => {
                    navigator.clipboard.writeText(linkTxt.current.textContent);
                    toast.info("Copied to clipboard");
                  }}
                >
                  COPY
                </button>
              </div>
            </div>
          </div>
          <hr />
          <div className="heading-text">
            <h1 className="display-6 small-device bold-small">
              Account Details
            </h1>
          </div>
          <form>
            <div className="row">
              <div className="col-sm-12 spacing">
                <label className="form-label">Email: {ctx.user.email}</label>
              </div>
              <div className="col-md-12 spacing">
                <label className="form-label">
                  Username: {ctx.user.username}{" "}
                </label>
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

export default MyAccount;
