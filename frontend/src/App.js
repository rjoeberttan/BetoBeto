import React from 'react';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom'
import Register from './Pages/Register';
import Login from './Pages/Login';
import PageNotFound from './Pages/PageNotFound';
import Home from './Pages/Home';


function App() {
    return (
        
        <Router>
            <Switch>
                <Route path="/register/agent=:agent" exact component={Register} />
                <Route path="/" exact component={Login} />
                <Route path="/home" exact component={Home} />
                <Route path="*" exact component={PageNotFound} />
                
            </Switch>
        </Router>
    )
}

export default App;