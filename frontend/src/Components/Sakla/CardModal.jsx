import React, { useEffect, useContext} from "react";
import { useState } from "react";
import { AuthContext } from "../../store/auth-context";
import {Modal} from 'react-bootstrap';
import axios from "axios";
import { toast } from "react-toastify";

export default function CardModal(props){
    const ctx = useContext(AuthContext);
    const [show, setShow] = useState(false);
    const [imgPath1, setImgPath1] = useState('1 BASTOS');
    const [imgPath2, setImgPath2] = useState('1 ESPADA');
    const [desc, setDesc] = useState('');
    const [stake, setStake] = useState()
    const [placeBetDisabled, setPlaceBetDisabled] = useState(false)
    const [placeBetText, setPlaceBetText] = useState("Place Bet")
    const betHeader = process.env.REACT_APP_HEADER_BET;
    const accountHeader = process.env.REACT_APP_HEADER_ACCOUNT;
    
    useEffect(() => {
        const desc = props.choice.description

        const card1 = desc.split(" - ")[0]
        const card2 = desc.split(" - ")[1]

        setImgPath1(card1)
        setImgPath2(card2)
        setDesc(desc)

    }, [])

    function handleStakeChange(e){
        const currentStake = parseFloat(e.target.value).toFixed(0);
        const walletBalance = parseFloat(ctx.walletBalance);
    
        if (currentStake > walletBalance || props.marketDetails.status !== 0 || currentStake > props.gameDetails.max_bet) {
          setStake(parseFloat(e.target.value).toFixed(0));
          setPlaceBetDisabled(true);
        } else {
          setPlaceBetDisabled(false);
          setStake(parseFloat(e.target.value).toFixed(0));
        }
    }

    function placeBet(e){
        setPlaceBetDisabled(true);
        setPlaceBetText("Please Wait")

        // Check if account is locked
        axios({
            method: "get",
            url: `${accountHeader}/isAccountLocked/${ctx.user.accountID}`,
            headers: {"Authorization":  process.env.REACT_APP_KEY_ACCOUNT}
        })
        .then((res) => {
            var isLocked = !res.data.status

            if (isLocked) {
                toast.error("Account is locked. Please contact your agent")
                setTimeout(() => {
                    setPlaceBetText("Place Bet");
                    setPlaceBetDisabled(false);
                    setStake("");
                }, 5000);
            } else {
                const wallet = parseFloat(ctx.walletBalance)
                const data = {
                    marketId: props.marketDetails.market_id,
                    gameId: props.gameId,
                    accountId: ctx.user.accountID,
                    gameName: props.gameDetails.name,
                    choiceId: props.choice.choice_id,
                    choice: desc,
                    stake: stake,
                    maxBet: props.gameDetails.max_bet
                }

                axios({
                    method: "post",
                    url: `${betHeader}/placeSaklaBet`,
                    headers: {"Authorization" : process.env.REACT_APP_KEY_BET},
                    data: data
                }).then((res) => {
                    toast.success(res.data.message)
                    setShow(false)
                    setStake(0)

                    setTimeout(() => {
                        setPlaceBetText("Place Bet");
                        setPlaceBetDisabled(false);
                        setStake("");
                    }, 5000);
                }).catch((err) => {
                    toast.error(err.response.data.message)
                })
            }

        })
    }

       return (
        <div className={`col-md-1 col-3 ${props.offset} text-center cards`} style={{paddingLeft: "0px", paddingRight: "0px"}}>
          
            <div onClick={() => setShow(true)}>
                <div className="cardOne">
                    <img className="cardImg" src={`/assets/images/${imgPath1}.PNG`} alt=""></img>
                </div>
                <div className="cardTwo">
                    <img className="cardImg" src={`/assets/images/${imgPath2}.PNG`} alt=""></img>
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
                            <img className="cardModalImg" src={`/assets/images/${imgPath1}.PNG`} alt=""></img>
                        </div>
                        <div className="cardTwoModal">
                            <img className="cardModalImg" src={`/assets/images/${imgPath2}.PNG`} alt=""></img>
                        </div>         
                    </div>
                    <div className="text-center">
                        <h5>{desc}</h5>
                    </div>
                    <div className="text-center" style={{marginTop: "10px"}}>
                        <label className="cardModalLabel">Stake</label>
                        <input 
                            className="form-control cardModalInput"
                            placeholder={parseFloat(0).toFixed(2)}
                            name="stake"
                            type="number"
                            onKeyPress={(event) => {
                              if (!/[0-9]/.test(event.key)) {
                                event.preventDefault();
                              }}}
                            onChange={handleStakeChange}
                            value={stake}
                        ></input>
                        <button
                            type="submit"
                            className="btn btn-color game-btn text-light"
                            style={{marginTop: "10px"}}
                            onClick={placeBet}
                            disabled={placeBetDisabled}

                
                        >
                            {placeBetText}
                        </button>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    )
}