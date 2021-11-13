import React, { useState } from "react";
import { toast, ToastContainer, Zoom } from "react-toastify";
const axios = require("axios").default;

export default function WithdrawalReq(props) {
  const [wdAmount, setWdAmount] = useState();

  function handleWithdrawAmt(e) {
    setWdAmount(e.target.value);
  }

  function submitWithdrawal(e) {
    console.log(wdAmount);
    if (parseFloat(wdAmount) > parseFloat(props.walletBalance).toFixed(2)) {
      console.log("Withdrawal amount is greater than current wallet");
    } else {
      axios({
        method: "post",
        url: `${props.header}/requestWithdrawal`,
        headers: {
          "Authorization": "[9@kw7L>F86_P](p",
        },
        data: {
          amount: wdAmount,
          accountId: props.accId,
        },
      })
        .then((res) => {
          toast.success(res.data.message)
          console.log(res);
          setWdAmount('')
        })
        .catch((err) => {
          console.log(err);
          setWdAmount('')
        });
    }
    e.preventDefault();
  }

  return (
    <div className={`col-sm-${props.col ? 3 : 4} wallet-card`}>
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
