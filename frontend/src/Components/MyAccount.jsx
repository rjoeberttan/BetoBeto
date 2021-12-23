import React, { useState, useRef, useEffect, useContext } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-toastify/dist/ReactToastify.min.css";
import { AuthContext } from "../store/auth-context";
import styles from "./MyAccount.module.css";
import "./styles.css";
import axios from "axios";
import { AiOutlineEyeInvisible, AiOutlineEye } from "react-icons/ai";

function MyAccount() {
  const ctx = useContext(AuthContext);
  console.log(ctx.user.accountType);
  const style = {
    width: "18 rem",
  };
  const linkTxt = useRef(null);
  const referralLink = `${process.env.REACT_APP_DOMAIN}/register/${ctx.user.accountID}`;
  const [cellNum, setCellNum] = useState("");
  const [commission, setCommission] = useState(0);
  const [password, setPassword] = useState({
    password: "",
    confirmPassword: "",
  });

  const accountHeader = process.env.REACT_APP_HEADER_ACCOUNT;
  const accAuthorization = {
    "Authorization": process.env.REACT_APP_KEY_ACCOUNT,
  };

  useEffect(() => {
    getUserDetails(ctx.user.accountID);
  }, []);

  function getUserDetails(accountId) {
    axios({
      method: "get",
      url: `${accountHeader}/getUserDetails/${accountId}`,
      headers: accAuthorization,
    })
      .then((res) => {
        setCellNum(res.data.data.phone_num);
        setCommission(res.data.data.commission);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function handlePhoneChange(e) {
    const { value } = e.target;
    setCellNum(value.substring(0, 11));
  }

  function handlePhoneChange(e) {
    const { value } = e.target;
    setCellNum(value.substring(0, 11));
  }

  function submitPhone(e) {
    if (cellNum.substring(0, 2) !== "09" || cellNum.length !== 11) {
      toast.error("Please follow phone format ex: 09XXXXXXXXX");
    } else {
      axios({
        method: "post",
        url: `${accountHeader}/updatePhoneDetail`,
        headers: accAuthorization,
        data: {
          phone: cellNum,
          accountId: ctx.user.accountID,
          editorUsername: ctx.user.username,
        },
      })
        .then((res) => {
          toast.success("Phone number Updated");
        })
        .catch((err) => {
          console.log(err);
          toast.error("Unable to Update Phone Number");
        });
    }
    e.preventDefault();
  }

  function handleChangePassword(e) {
    const { value, name } = e.target;
    setPassword((prev) => {
      return {
        ...prev,
        [name]: value,
      };
    });
  }

  function submitPassword(e) {
    if (password.password !== password.confirmPassword) {
      console.log("password do not match");
      toast.error("Passwords do not match");
    } else if (password.password.length < 8 || password.password.length > 20) {
      console.log("password length error");
      toast.error("Password does not match required length (8-20 chars)");
    } else {
      axios({
        method: "post",
        url: `${accountHeader}/updatePassword`,
        headers: accAuthorization,
        data: {
          password: password.password,
          accountId: ctx.user.accountID,
          editorUsername: ctx.user.username,
        },
      })
        .then((res) => {
          toast.success("Password updated successfully");
          setPassword({ password: "", confirmPassword: "" });
          console.log(res);
        })
        .catch((err) => {
          toast.error("Unable to update Password");
          console.log(err);
        });
    }
    e.preventDefault();
  }

  const [state, setstate] = useState(false);
  const [stateConfirm, setstateConfirm] = useState(false);

  const toggleBtn = () => {
    setstate((prevState) => !prevState);
  };

  const toggleBtnConfirm = () => {
    setstateConfirm((prevState) => !prevState);
  };

  function generateCommission() {
    if (
      ctx.user.accountType === "agent" ||
      ctx.user.accountType === "masteragent"
    ) {
      return (
        <div className="col-md-12 spacing">
          <label className="form-label">Commission: {commission}%</label>
        </div>
      );
    }
  }

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
          {ctx.user.accountType !== "declarator" && (
            <>
              <div className="heading-text">
                <h1 className="display-6 small-device bold-small">
                  Referral Link
                </h1>
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
                        navigator.clipboard.writeText(
                          linkTxt.current.textContent
                        );
                        toast.info("Copied to clipboard");
                      }}
                    >
                      COPY
                    </button>
                  </div>
                </div>
              </div>
              <hr />
            </>
          )}

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
              {generateCommission()}
              <div className="col-md-12 spacing">
                <label className="form-label">Cellphone No.</label>
                <input
                  type="number"
                  className="form-control"
                  name="cellNum"
                  value={cellNum}
                  onChange={handlePhoneChange}
                  onWheel={(e) => e.target.blur()}
                />
              </div>
              <div className="col-md-12 text-center">
                <button
                  className="btn btn-color register-btn text-light"
                  onClick={submitPhone}
                >
                  Save
                </button>
              </div>
            </div>
            <hr />
            <div className="heading-text">
              <h1 className="display-6 small-device bold-small">
                Change password
              </h1>
              <div className="row password-confirmpassword-div">
                <div className="col-sm-6 spacing row div-password">
                  <label className="form-label password-text-myaccount">
                    Password
                  </label>
                  <input
                    className="form-control"
                    placeholder="Password"
                    name="password"
                    onChange={handleChangePassword}
                    type={state ? "text" : "password"}
                    value={password.password}
                  />
                  <button
                    type="button"
                    className="input-group-text col-2 button-show-password-myaccount"
                    onClick={toggleBtn}
                  >
                    {state ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}{" "}
                  </button>
                </div>
                <div className="col-sm-6 spacing row confirm-password">
                  <label className="form-label password-text-myaccount">
                    Confirm Password
                  </label>
                  <input
                    className="form-control"
                    placeholder="Confirm Password"
                    name="confirmPassword"
                    onChange={handleChangePassword}
                    type={stateConfirm ? "text" : "password"}
                    value={password.confirmPassword}
                  />
                  <button
                    type="button"
                    className="input-group-text button-show-password-myaccount"
                    onClick={toggleBtnConfirm}
                  >
                    {stateConfirm ? (
                      <AiOutlineEyeInvisible />
                    ) : (
                      <AiOutlineEye />
                    )}
                  </button>
                </div>
                <div className="col-md-12 text-center">
                  <button
                    className="btn btn-color register-btn text-light"
                    onClick={submitPassword}
                  >
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
