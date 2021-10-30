import React, { useState, useEffect } from "react";

export const AuthContext = React.createContext({});

export default function AuthContextProvider(props) {
  const user = {
    email: "testing",
    password: "123",
    type: "player",
  };

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loggedIn = localStorage.getItem("token");
    if (loggedIn) {
      setIsLoggedIn(true);
    }
  }, []);

  function loginHandler(person) {
    if (person.username === user.email && person.password === user.password) {
      localStorage.setItem("token", "1");
      setIsLoggedIn(true);
    } else {
      setErrorMessage("Invalid credentials");
    }
  }

  function handleLogOut() {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  }

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: isLoggedIn,
        errorMessage: errorMessage,
        loginHandler: loginHandler,
        handleLogOut: handleLogOut,
        user: user,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}
