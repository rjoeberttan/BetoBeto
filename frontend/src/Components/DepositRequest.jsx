import React, { useState } from "react";
import { toast, ToastContainer, Zoom } from "react-toastify";

const axios = require("axios").default;

export default function DepositRequest(props) {
  const [dpAmount, setDpAmount] = useState();

  function handleDepositAmt(e) {
    setDpAmount(e.target.value);
  }

  function submitDeposit(e) {
    console.log(dpAmount, props.accId)
    axios({
      method: "post",
      url: `${props.header}/requestDeposit`,
      headers: {
        "Authorization": "[9@kw7L>F86_P](p",
      },
      data: {
        amount: dpAmount,
        accountId: props.accId,
      },
    })
      .then((res) => {
        console.log(res);
        toast.success(res.data.message)
        setDpAmount('');
      })
      .catch((err) => {
        console.log(err);
        toast.error("Error requesting deposit",{
          autoClose : 1500
        })
        setDpAmount('');
      });
   
    e.preventDefault();
  }

  return (
    
    <div className={`col-sm-${props.col ? 3 : 4} wallet-card`}>
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Deposit Request</h5>
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
                value={dpAmount}
                onChange={handleDepositAmt}
              />
            </div>
          </div>
          <div className="col-md-12 text-center">
            <button
              className="btn btn-color register-btn text-light"
              onClick={submitDeposit}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
