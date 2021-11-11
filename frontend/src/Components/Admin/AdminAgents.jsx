import {React, useContext, useEffect, useState} from "react";
import { AuthContext } from "../../store/auth-context";
import axios from "axios";
import UserCard from "../Usercard/UserCard";

function AdminAgents() {
  const ctx = useContext(AuthContext);
  const accountHeader = "http://localhost:4003";
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    getUserList();
  }, []);

  function getUserList() {
    axios({
      method: "get",
      url: `${accountHeader}/getAccountList/${ctx.user.accountID}/0`,
      headers: {
        "Authorization": "uKRd;$SuXd8b$MFX",
      },
    })
      .then((res) => {
        const data = res.data.data;
        const Agents = data.filter((x) => x.account_type === 2);
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
        <div className="col-sm-2 col-12">
          <input type="text" className="form-control" placeholder="Agent" />
        </div>
        <div className="col-sm-2">
          <label className="label-txt">Filter By Master Agent</label>
        </div>
        <div className="col-sm-2 col-12">
          <input
            type="text"
            className="form-control"
            placeholder="Master Agent"
          />
        </div>
        <div className="col-sm-1 text-center">
          <button className="btn btn-color transaction-btn btnbtn spacing-btn-m text-light">
            Search
          </button>
        </div>
      </div>
      <div className="row text-black second-box">
        {agents.map((x) => (
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
        }
      </div>
    </div>
  );
}

export default AdminAgents;
