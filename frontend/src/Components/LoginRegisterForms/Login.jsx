import React, { useContext, useState } from "react";
import logo from "./loginimg.jpg";
import { AuthContext } from "../../store/auth-context";

function Login() {
  const ctx = useContext(AuthContext);
  const [user, setUser] = useState({
    username: "",
    password: "",
  });

  function handleClick(event) {
    ctx.loginHandler(user);
    event.preventDefault();
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setUser((prev) => {
      return {
        ...prev,
        [name]: value,
      };
    });
  }

  const style = {
    width: "18 rem",
  };

  return (
    <div className="container center txt-black">
      <div className="card" style={{ style }}>
        <img src={logo} className="card-img-top" alt="..." />
        <div className="card-body">
          <div className="heading-text">
            <h1 className="display-2 small-device bold-small">Welcome back!</h1>
            <h4 className="lead smaller-device">Login below to continue</h4>
          </div>

          <form onSubmit={handleClick}>
            <div className="row">
              <div className="col-sm-12 spacing">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-control"
                  name="username"
                  onChange={handleChange}
                  value={user.username}
                />
              </div>
              <div className="col-md-12 spacing">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  name="password"
                  onChange={handleChange}
                  value={user.password}
                />
              </div>
              <div className="col-md-12 text-center">
                <button className="btn btn-color register-btn text-light">
                  Login
                </button>
              </div>
              {ctx.errorMessage ? (
                <span className="danger text-center">{ctx.errorMessage}</span>
              ) : (
                ""
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
