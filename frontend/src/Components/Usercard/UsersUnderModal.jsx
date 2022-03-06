import React, { useEffect, useContext } from "react";
import { useState } from "react";
import {Button, Modal} from 'react-bootstrap';
import { AuthContext } from "../../store/auth-context";
import axios from "axios";
import UserCard from "../Usercard/UserCard";
import "./Modal.css"


export default function ShowUsersUnderModal(props){
  const [show, setShow] = useState(false);
  const accountId = props.accountId
  const accountType = props.accountType
  const ctx = useContext(AuthContext);
  const accountHeader = process.env.REACT_APP_HEADER_ACCOUNT;
  const [usersList, setUsersList] = useState([]);


  useEffect(() => {
    getUserList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getUserList() {
    axios({
      method: "get",
      url: `${accountHeader}/getAccountList/${accountId}/${accountType}`,
      headers: {
        "Authorization": process.env.REACT_APP_KEY_ACCOUNT,
      },
    })
      .then((res) => {
        const data = res.data.data;
        var filterType = accountType === "5" ? 1 : accountType === "1" ? 2 : 3  
        const filteredUsers = data.filter((x) => x.account_type === filterType);
        setUsersList(filteredUsers)
      })
      .catch((err) => {});
  }

    return (
        <div className="text-center" style={{marginTop: "2px"}}>
        {props.accountType !== "3" ? 
          <Button variant="primary" className="btn btn-color register-btn text-light" style={{border: "0px", borderRadius: "20px"}} onClick={() => setShow(true)}>
          {props.accountType === "5" ? "Show Master Agents" : props.accountType === "1" ? "Show Agents" : "Show Players"}
          </Button> : null 
        }

      <Modal
        show={show}
        onHide={() => setShow(false)}
        dialogClassName="modal-90w"
        aria-labelledby="example-custom-modal-styling-title"
      >
        <Modal.Header closeButton>
          <Modal.Title id="example-modal-sizes-title-lg">
           {props.username} - {props.accountType === "5" ? "Master Agents" : props.accountType === "1" ? "Agents" : "Players"} 
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <div className="row text-black second-box">
          {usersList.map((x) => (
            <UserCard
              key={x.account_id}
              accountId={x.account_id}
              username={x.username}
              noOfAgents="TBS"
              mobile={x.phone_num}
              noOfPlayers="TBS"
              commission={x.commission}
              status={x.account_status === 1 ? "ACTIVE" : "LOCKED"}
              lastEditChange={x.lastedit_date.substring(0, 10)}
              walletBalance={x.wallet}
              editor={ctx.user.username}
              editorId={ctx.user.accountID}
              accountType={accountType === "5"? "1" : accountType === "1" ? "2" : accountType === "2" ? "3" : null} 
            />
          ))}
      </div>
        </Modal.Body>
      </Modal>
    </div>
    )
}