import React from "react";
import { useState } from "react";
import {Modal} from 'react-bootstrap';
import CARD from "./1 BASTOS.PNG";
import CARD2 from "./1_ESPADA.PNG";

export default function CardModal(props){
  const [show, setShow] = useState(false);

    return (
        <div className={`col-md-1 col-3 ${props.offset} text-center cards`} style={{paddingLeft: "0px", paddingRight: "0px"}}>
            {/* <Button variant="primary" className="btn btn-color register-btn text-light" style={{border: "0px", borderRadius: "20px"}} onClick={() => setShow(true)}>
            Show Transactions
            </Button> */}

            <div onClick={() => setShow(true)}>
                    <div className="cardOne">
                        <img className="cardImg" src={CARD} alt=""></img>
                    </div>
                    <div className="cardTwo">
                        <img className="cardImg" src={CARD2} alt=""></img>
                    </div>
            </div>

            <Modal
                show={show}
                onHide={() => setShow(false)}
                dialogClassName="modal-40w cardModalPopup"
            >
                <Modal.Header closeButton style={{border: "none", paddingBottom: "0px"}}>
                <Modal.Title id="example-modal-sizes-title-lg">
                    Place Bet
                </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="row cardsModal">
                        <div className="cardOneModal">
                            <img className="cardModalImg" src={CARD} alt=""></img>
                        </div>
                        <div className="cardTwoModal">
                            <img className="cardModalImg" src={CARD2} alt=""></img>
                        </div>
                    </div>
                    <div className="text-center" style={{marginTop: "10px"}}>
                        <label className="cardModalLabel">Stake</label>
                        <input className="form-control cardModalInput"></input>
                        <button
                            type="submit"
                            className="btn btn-color game-btn text-light"
                            style={{marginTop: "10px"}}
                        >
                            Place Bet
                        </button>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    )
}