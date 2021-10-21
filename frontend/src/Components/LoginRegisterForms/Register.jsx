import React from "react";
import "./Register.css";
import { Link } from "react-router-dom";
import logo from "./loginimg.jpg";

function Register() {
  return (
    <div className="container center txt-black">
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

          <form>
            <div className="row">
              <div className="col-sm-6 spacing">
                <label className="form-label">Email address</label>
                <input type="email" className="form-control" />
                <div className="form-text">
                  We'll never share your email with anyone else.
                </div>
              </div>
              <div className="col-md-6 spacing">
                <label className="form-label">Cellphone No.</label>
                <input type="text" className="form-control" />
              </div>
              <div className="col-sm-12 spacing">
                <label className="form-label">Username</label>
                <input type="text" className="form-control" />
              </div>
              <div className="col-md-12 spacing">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" />
                <div className="form-text">Must be 8-20 characters long.</div>
              </div>
              <div className="col-md-12 spacing">
                <label className="form-label">Confirm Password</label>
                <input type="password" className="form-control" />
              </div>
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
