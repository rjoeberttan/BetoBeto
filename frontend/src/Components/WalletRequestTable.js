import axios from "axios";
import React, { useEffect, props, useState, createContext, useContext } from "react";
import { AuthContext } from "../store/auth-context";

function WalletRequestTable({
    transactionId,
    transactionType,
    requesterAccountId,
    requesterUsername,
    requesterType,
    placementDate,
    amount,
    phoneNum,
    accepterAccountId, 
    accepterUsername,
    accepterWallet,
}) {
    //============================================
    // Variable and useState Definitions
    //============================================
    const ctx = useContext(AuthContext);
    const bankHeader = "http://localhost:4006"
    const [confirmed, setConfirmed] = useState(false)
    const [requesterTypeStr, setRequesterTypeStr] = useState("")



    useEffect(() => {
        // console.log(requesterType)
        if (requesterType === 1){
            setRequesterTypeStr("M. Agent")
        } else if (requesterType === 2) {
            setRequesterTypeStr("Agent")
        } else if (requesterType === 3){
            setRequesterTypeStr("Player")
        } else{
            setRequesterTypeStr("Unknown")
        }
        
    }, [])


    function confirmTransaction(e){
        if (transactionType === '0'){
            acceptDeposit()
        } else {
            acceptWithdrawal()
        }

        e.preventDefault()
    }

    function acceptDeposit(){
        const data = {
            accountId: requesterAccountId,
            amount: amount,
            transactionId: transactionId,
            accepterAccountId: accepterAccountId,
            accepterUsername: accepterUsername
        }

        axios({
            method: "post",
            url: `${bankHeader}/acceptDeposit`,
            headers: {
              "Authorization": "[9@kw7L>F86_P](p",
            },
            data: data
          })
        .then((res) => {
            setConfirmed(true)
            console.log(res)

            const newAmount = ctx.walletBalance - amount
            ctx.walletHandler(newAmount)
        })
        .catch((err) => {
            console.log(err);
        });
       
    }

    function acceptWithdrawal(){
        const data = {
            accountId: requesterAccountId,
            amount: amount,
            transactionId: transactionId,
            accepterAccountId: accepterAccountId,
            accepterUsername: accepterUsername
        }

        axios({
            method: "post",
            url: `${bankHeader}/acceptWithdrawal`,
            headers: {
              "Authorization": "[9@kw7L>F86_P](p",
            },
            data: data
          })
        .then((res) => {
            setConfirmed(true)
            console.log(res)

            const newAmount = ctx.walletBalance + amount
            ctx.walletHandler(newAmount)
        })
        .catch((err) => {
            console.log(err);
        });

    }
   
    if (confirmed) {
        return null;
    } else {
        return (  
            <tr>
                <td>{requesterUsername}</td>
                <td>{phoneNum}</td>
                <td>{requesterTypeStr}</td>
                <td>P {parseFloat(amount).toFixed(2)}</td>
                <td>{placementDate}</td>
                <td>
                  <button className="btn btn-color text-light" onClick={confirmTransaction}>Confirm</button>
                </td>
            </tr>
            
        )
    }
}

export default WalletRequestTable;