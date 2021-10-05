import axios from 'axios';
import React, {useState, useEffect} from 'react';
import { useParams, useHistory} from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";



function Home() {

    const [username, setUsername] = useState("")
    const [accountType, setAccountType] = useState("")
    const [userId, setUserID] = useState("")

    const history = useHistory();
    
    function checkAuth() {
        axios.get("http://localhost:4003/isUserAuth", {
            headers: {
                "x-access-token": localStorage.getItem("token")
            }
        }).then((response) => {
            console.log(response.data)
            setUsername(response.data.username)
            setAccountType(response.data.accountType)
            setUserID(response.data.userID)

        }).catch((err) => {
               history.push("/")
            }
        )
    }

    useEffect(() => {
        checkAuth()
    }, []); //Only on initial render []


    return <div><h1>Home</h1>
    <p>Username: {username}</p>
    <p>accountType: {accountType}</p>
    <p>userID: {userId}</p>
    <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
}

export default Home;