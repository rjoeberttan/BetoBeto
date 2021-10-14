//jshint esversion:6
import React, { useState, useEffect } from "react";
import { useParams, useHistory} from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const history = useHistory();

  function checkAuth() {
    axios.get("http://localhost:4003/isUserAuth", {
        headers: {
            "x-access-token": localStorage.getItem("token")
        }
    }).then((response) => {
        console.log(response.data)
    }).catch((err) => {
        if (err.response.data.message === "TokenExpiredError"){
            localStorage.removeItem("token")
            toast.error("Session Expired. Please Login")
        }
    })
}

useEffect(() => {
    checkAuth()
}, []);


  function submitLogin(){
    axios.post("http://localhost:4003/login", {
        username: username,
        password: password,
        apiKey: "uKRd;$SuXd8b$MFX"
    }).then((response) => {
        console.log(response)
    }).catch((error) => {
        console.log(error.response);
        toast.error(error.response.data);
      });
  }

  return (
    <div>
      <h1>Login Page</h1>    
        <label>
          Username:
          <input
            type="text"
            name="username"
            onChange={(event) => {
              setUsername(event.target.value);
            }}
          />
        </label>

        <label>
          Password:
          <input
            type="password"
            name="password"
            onChange={(event) => {
              setPassword(event.target.value);
            }}
          />
        </label>

        <button onClick={submitLogin}>Login</button>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
    </div>
  );
}

export default Login;
