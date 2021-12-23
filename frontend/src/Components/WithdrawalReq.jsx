import { to } from "@react-spring/core";
import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-toastify/dist/ReactToastify.min.css";
const axios = require("axios").default;

export default function WithdrawalReq(props) {
  const [wdAmount, setWdAmount] = useState();
  const bankHeader = process.env.REACT_APP_HEADER_BANK;
  const bankAuthorization = { "Authorization": process.env.REACT_APP_KEY_BANK };

  function handleWithdrawAmt(e) {
    setWdAmount(parseFloat(e.target.value).toFixed(0));
  }

  function submitWithdrawal(e) {
    if (wdAmount <= 0){
      toast.error("Invalid Amount")
    }
    else if (parseFloat(wdAmount) > parseFloat(props.walletBalance).toFixed(2)) {
      toast.error("Withdrawal amount is greater than current wallet balance", {
        autoClose: 1500,
      });
      console.log("haha");
    } else {
      axios({
        method: "post",
        url: `${bankHeader}/requestWithdrawal`,
        headers: bankAuthorization,
        data: {
          amount: wdAmount,
          accountId: props.accId,
        },
      })
        .then((res) => {
          toast.success(res.data.message);
          console.log(res);
          setWdAmount("");
        })
        .catch((err) => {
          // console.log(err);
          toast.error("Error requesting withdrawal", {
            autoClose: 1500,
          });
          setWdAmount("");
        });
    }
    e.preventDefault();
  }

  return (
    <div className={`col-sm-${props.col} wallet-card`}>
      <ToastContainer />
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Withdrawal Request</h5>
          <div className="row wallet-box">
            <div className="col-md-4">
              <label className="col-form-label">Amount</label>
            </div>
            <div className="col-md-12">
              <input
                type="number"
                className="form-control"
                onWheel={(e) => e.target.blur()}
                placeholder="0.00"
                value={wdAmount}
                onChange={handleWithdrawAmt}
              />
            </div>
          </div>
          <div className="col-md-12 text-center">
            <button
              className="btn btn-color register-btn text-light"
              onClick={submitWithdrawal}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
