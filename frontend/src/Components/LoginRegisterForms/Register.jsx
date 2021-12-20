import React, { useState } from "react";
import "./Register.css";
import { Link, useParams } from "react-router-dom";
import logo from "./loginimg.jpg";
import { toast, ToastContainer } from "react-toastify";
import  { AiOutlineEyeInvisible, AiOutlineEye} from 'react-icons/ai';
const axios = require("axios").default;

function Register() {
  const accountHeader = process.env.REACT_APP_HEADER_ACCOUNT;
  const accAuthorization = {
    "Authorization": process.env.REACT_APP_KEY_ACCOUNT,
  };
  const [user, setUser] = useState({
    email: "",
    phone: "",
    username: "",
    password: "",
    confirmPass: ""
  });
  const [conPassMsg, setConPassMsg] = useState("")

  let { agentid } = useParams();
  agentid = agentid.replace("agentid=", "");

  function handleChange(e) {
    const { name, value } = e.target;
    setUser((prev) => {
      return {
        ...prev,
        [name]: value,
      };
    });

    if (e.target.name === "confirmPass") {
      if (user.password !== e.target.value) {
        setConPassMsg("Passwords do not Match")
      } else {
        setConPassMsg("")
      }
    }
  }

  function handleSubmit(e) {
    const phone = user.phone;
    if (conPassMsg !== ""){
      toast.error("Passwords do not match")
    }
    else if (phone.substring(0, 2) !== "09" || phone.length !== 11) {
      toast.error("Invalid phone number (ex. 09xxxxxxxxx)");
    } else if (
      user.password.length === 0 ||
      user.password.length < 8 ||
      user.password.length > 20
    ) {
      toast.error("Password must be 8-20 characters long.");
    } else if (user.username.length === 0) {
      toast.error("Username can't be empty.");
    } else {
      axios({
        method: "post",
        url: `${accountHeader}/register`,
        headers: accAuthorization,
        data: {
          username: user.username,
          password: user.password,
          email: user.email,
          phone: user.phone,
          agentId: agentid,
        },
      })
        .then((res) => {
          console.log(res);
          toast.success(res.data.message);
        })
        .catch((err) => {
          console.log(err);
          toast.error(
            <div>
              {" "}
              Sorry your registration is invalid <br /> Please try again{" "}
            </div>,
            {
              autoClose: 1500,
            }
          );
        });
    }
    e.preventDefault();
  }

  const [state, setstate] = useState(false);
  const [stateConfirm, setstateConfirm] = useState(false);

  const toggleBtn = () => {

    setstate(prevState => !prevState);

  }

  const toggleBtnConfirm = () => {

    setstateConfirm(prevState => !prevState);

  }

  return (
    <div className="container center txt-black">
      <ToastContainer />
      <div className="card">
        <img src={logo} className="card-img-top" alt="..." />
        <div className="card-body">
          <div className="heading-text">
            <h1 className="display-2 small-device bold-small">
              Create an account
            </h1>
            <h4 className="lead smaller-device">
              Register below to create an account
            </h4>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-sm-6 spacing">
                <label className="form-label">Email address</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  onChange={handleChange}
                />
                <div className="form-text">
                  We'll never share your email with anyone else.
                </div>
              </div>
              <div className="col-md-6 spacing">
                <label className="form-label">Cellphone No.</label>
                <input
                  type="text"
                  className="form-control"
                  name="phone"
                  onChange={handleChange}
                />
              </div>
              <div className="col-sm-12 spacing">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-control"
                  name="username"
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-12 spacing row div-show-password-register">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  name="password"
                  onChange={handleChange}
                  type={state ? 'text' : 'password'}
                  className="col"
                />
                <button 
                    type='button'
                    className="input-group-text col-2 button-show-password-register"
                    onClick={toggleBtn}
                  >
                  {state ? <AiOutlineEyeInvisible/> : <AiOutlineEye /> } </button>
                <div className="form-text">Must be 8-20 characters long.</div>
              </div>
              <div className="col-md-12 spacing row div-show-password-register">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-control"
                  name="confirmPass"
                  onChange={handleChange}
                  type={stateConfirm ? 'text' : 'password'}
                  className="col-10"
                />
                <button 
                    type='button'
                    className="input-group-text col button-show-password-register"
                    onClick={toggleBtnConfirm}
                >
                  {stateConfirm ? <AiOutlineEyeInvisible/> : <AiOutlineEye /> } </button>
                <div className="form-text">{conPassMsg}</div>
              </div>
              {/* <div className="col-md-12 spacing">
                <label className="form-label">Confirm Password</label>
                <input type="password" className="form-control" onChange={handleChange}/> 
              </div> */}
              <div className="col-md-12 text-center">
                <button
                  type="submit"
                  className="btn btn-color register-btn text-light"
                >
                  Register
                </button>
              </div>
              <span className="text-center">
                Already have an account? <Link to="/"> Sign In </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
