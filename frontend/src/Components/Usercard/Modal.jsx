import React from "react";
import { useState } from "react";
import {Button, Modal} from 'react-bootstrap';
import TransactionForm from "./TransactionForm";
import "./Modal.css"


export default function ShowTransactionsModal(props){
  const [show, setShow] = useState(false);

    return (
        <div className="text-center" style={{marginTop: "2px"}}>
        <Button variant="primary" className="btn btn-color register-btn text-light" style={{border: "0px", borderRadius: "20px"}} onClick={() => setShow(true)}>
        TRANSACTIONS
      </Button>

      <Modal
        show={show}
        onHide={() => setShow(false)}
        dialogClassName="modal-90w"
        aria-labelledby="example-custom-modal-styling-title"
      >
        <Modal.Header closeButton>
          <Modal.Title id="example-modal-sizes-title-lg">
            Transactions - {props.username}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <TransactionForm username={props.username} accountId={props.accountId}/>
        </Modal.Body>
      </Modal>
    </div>
    )
}