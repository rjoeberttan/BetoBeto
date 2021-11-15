import React, { useState } from "react";
import { ToastContainer, toast, Zoom, Bounce} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'react-toastify/dist/ReactToastify.min.css';
const axios = require("axios").default;

export default function WithdrawalReq(props) {
  const [wdAmount, setWdAmount] = useState();

  function handleWithdrawAmt(e) {
    setWdAmount(e.target.value);
  }

  function submitWithdrawal(e) {
    if (parseFloat(wdAmount) > parseFloat(props.walletBalance).toFixed(2)) {
      toast.error('Withdrawal amount is greater than current wallet balance', {
        autoClose : 1500
      });
      console.log('haha');
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
          // console.log(err);
          toast.error('Error requesting withdrawal', {
            autoClose : 1500
          })
          setWdAmount('')
        });
    }
    e.preventDefault();
  }

  return (
    <div className={`col-sm-${props.col ? 3 : 4} wallet-card`}>
        <ToastContainer/>
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
