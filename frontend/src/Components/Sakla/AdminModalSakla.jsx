import React from "react";
import { useState } from "react";
import {Button, Modal} from 'react-bootstrap';


export default function AdminModalSakla(props){
  const [show, setShow] = useState(false);

    return (
        <div style={{marginTop: "2px"}}>
        <Button variant="primary" className="btn btn-color register-btn text-light" 
        style={{border: "0px", borderRadius: "20px", minWidth: "300px"}} onClick={() => setShow(true)}>
         Create New Sakla Dehado
        </Button>

      <Modal
        show={show}
        onHide={() => setShow(false)}
        dialogClassName="modal-70w"
      >
        <Modal.Header closeButton>
          <Modal.Title id="example-modal-sizes-title-lg">
            Creating New Dehado:
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center" style={{marginTop: "10px"}}>
                          <label className="cardModalLabel">Set Game Title</label>
                          <input className="form-control cardModalInput" placeholder="Sakla New Game"></input>
                          <button
                              type="submit"
                              className="btn btn-color game-btn text-light"
                              style={{marginTop: "10px"}}
                          >
                              Save
                          </button>
                      </div>
        </Modal.Body>
      </Modal>
    </div>
    )
}