import React from 'react';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom'
import Register from './Pages/Register';

function App() {
    return (
        
        <Router>
            <Switch>
                <Route path="/register/:referralID" exact component={Register} />
            </Switch>
        </Router>
    )
}

export default App;