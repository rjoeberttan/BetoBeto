import { React, useContext, useEffect, useState } from "react";
import UserCard from "../Usercard/UserCard";
import EmptyUsersUnder from "../EmptyUsersUnder";
import { AuthContext } from "../../store/auth-context";
import axios from "axios";

function MasterAgents() {
  const ctx = useContext(AuthContext);
  const accountHeader = process.env.REACT_APP_HEADER_ACCOUNT;
  const accAuthorization = {
    "Authorization": process.env.REACT_APP_KEY_ACCOUNT,
  };
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    getUserList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getUserList() {
    axios({
      method: "get",
      url: `${accountHeader}/getAccountList/${ctx.user.accountID}/1`,
      headers: accAuthorization,
    })
      .then((res) => {
        const data = res.data.data;
        const Agents = data.filter((x) => x.account_type === 2);
        console.log(Agents);
        setAgents(Agents);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  return (
    <div className="container text-light container-wallet">
      <div className="heading-text">
        <h1 className="display-5 small-device bold-small">Manage Agents</h1>
      </div>
      <div className="row">
        <div className="col-sm-1">
          <label className="label-txt">Filter Agent</label>
        </div>
        <div className="col-sm-2 col-10">
          <input type="text" className="form-control" placeholder="Agent" />
        </div>
        <div className="col-md-2">
          <button className="btn btn-color transaction-btn text-light col-xs-12">
            Search
          </button>
        </div>
      </div>
      <div className="row text-black second-box">
        {agents.length === 0 ? (
          <EmptyUsersUnder />
        ) : (
          agents.map((x) => (
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
              accountType="2"
            />
          ))
        )}
      </div>
    </div>
  );
}

export default MasterAgents;
