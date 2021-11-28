import React, { useState, useContext, useEffect } from "react";
import "./PlayerAccount.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-toastify/dist/ReactToastify.min.css"; 
import { AuthContext } from "../../store/auth-context";
import axios from "axios";

function Account() {
  const ctx = useContext(AuthContext);
  const [password, setPassword] = useState({
    password: "",
    confirmPassword: "",
  });
  const [userDetails, setUserDetails] = useState({
    email: "",
    username: "",
    phone: "",
  });

  const accountHeader = process.env.REACT_APP_HEADER_ACCOUNT;
  const accAuthorization = {
    "Authorization": process.env.REACT_APP_KEY_ACCOUNT,
  };
  //===========================================
  // UseEffect
  //===========================================
  useEffect(() => {
    getUserDetails(ctx.user.accountID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getUserDetails(accountId) {
    axios({
      method: "get",
      url: `${accountHeader}/getUserDetails/${accountId}`,
      headers: accAuthorization,
    })
      .then((res) => {
        console.log(res);
        setUserDetails((prev) => {
          return {
            ...prev,
            username: res.data.data.username,
            email: res.data.data.email,
            phone: res.data.data.phone_num,
          };
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function handleChange(e) {
    const { value } = e.target;
    setUserDetails((prev) => {
      return {
        ...prev,
        phone: value.substring(0, 11),
      };
    });
  }

  function submitPhone(e) {
    if (
      userDetails.phone.substring(0, 2) !== "09" ||
      userDetails.phone.length !== 11
    ) {
      console.log("wrong 09");
      //toaster failed changed phone num
    } else {
      axios({
        method: "post",
        url: `${accountHeader}/updatePhoneDetail`,
        headers: accAuthorization,
        data: {
          phone: userDetails.phone,
          accountId: ctx.user.accountID,
          editorUsername: ctx.user.username,
        },
      })
        .then((res) => {
          toast.success("Phone number Updated")
        })
        .catch((err) => {
          console.log(err);
          toast.error("Unable to Update Phone Number")
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
      //toaster passwords do not match
    } else if (password.password.length < 8 || password.password.length > 20) {
      console.log("password length error");
      //toaster pssword length error
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
          toast.success("Password updated successfully")
          setPassword({password: "", confirmPassword: ""})
          console.log(res);
        })
        .catch((err) => {
          toast.error("Unable to update Password")
          console.log(err);
        });
    }
    e.preventDefault();
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
        <div className="card-body">
          <form>
            <div className="row">
              <div className="col-sm-12 spacing">
                <label className="form-label">Email: {userDetails.email}</label>
              </div>
              <div className="col-md-12 spacing">
                <label className="form-label">
                  Username: {userDetails.username}{" "}
                </label>
              </div>
              <div className="col-md-12 spacing">
                <label className="form-label">Cellphone No.</label>
                <input
                  type="number"
                  placeholder="0927XXXXXXX"
                  className="form-control"
                  name="cellNum"
                  value={userDetails.phone}
                  onChange={handleChange}
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
              <div className="row">
                <div className="col-sm-6 spacing">
                  <label className="form-label">Password</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Password"
                    name="password"
                    onChange={handleChangePassword}
                    value={password.password}
                  />
                </div>
                <div className="col-md-6 spacing">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Confirm Password"
                    name="confirmPassword"
                    onChange={handleChangePassword}
                    value={password.confirmPassword}
                  />
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

export default Account;

// style="max-width: 18rem;"
