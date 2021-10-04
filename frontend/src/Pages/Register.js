//jshint esversion:6
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

function Register() {
  let { referralID } = useParams();
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  axios.defaults.withCredentials = true;


  const submitRegister = () => {
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
    } else if (phone.length !== 11 || phone.substring(0, 2) !== "09") {
      toast.error(
        "Phone number format is incorrect. Please follow 09*********"
      );
    } else {
      axios
        .post("http://localhost:4003/register/", {
          username: username,
          email: email,
          phone: phone,
          password: password,
          referralID: referralID,
        })
        .then((response) => {
          toast.success(response.data);
        })
        .catch((error) => {
          console.log(error);
          toast.error(error.response.data);
        });
    }
  };


  return (
    <div>
      <h1> Register Page </h1>
      <form>
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
          Email:
          <input
            type="email"
            name="email"
            onChange={(event) => {
              setEmail(event.target.value);
            }}
          />
        </label>

        <label>
          Phone No:
          <input
            type="text"
            name="phone"
            placeholder="09*********"
            onChange={(event) => {
              setPhone(event.target.value);
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

        <label>
          Confirm Password:
          <input
            type="password"
            name="confirmPassword"
            onChange={(event) => {
              setConfirmPassword(event.target.value);
            }}
          />
        </label>
      </form>

      <button onClick={submitRegister}>Register</button>

      <ToastContainer
        position="top-right"
        autoClose={5000}
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

export default Register;
