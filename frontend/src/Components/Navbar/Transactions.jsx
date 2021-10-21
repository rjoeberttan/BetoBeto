import React from "react";
import "./Transactions.css";

function Transactions() {
  return (
    <div className="container text-light container-transactions">
      <div className="heading-text">
        <h1 className="display-5 small-device bold-small">Transactions</h1>
      </div>
      <form>
        <div className="row">
          <h4 className="lead smaller-device">Date Filter</h4>
          <div className="col-md-2">
            <input
              className="date-style form-label"
              type="date"
              name="startDate"
            />
          </div>
          -
          <div className="col-md-2">
            <input
              className="date-style form-label"
              type="date"
              name="endDate"
            />
          </div>
          <div className="col-md-2">
            <button className="btn btn-color transaction-btn text-light col-xs-12">
              Search
            </button>
          </div>
        </div>
      </form>
      <table class="table table-success table-striped">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Transaction ID</th>
            <th scope="col">Transaction Type</th>
            <th scope="col">Description</th>
            <th scope="col">Amount</th>
            <th scope="col">Cummulative</th>
            <th scope="col">Settled by</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">July 10</th>
            <td>Mark</td>
            <td>Otto</td>
            <td>@mdo</td>
            <td>123123</td>
            <td>123123</td>
            <td>noobmaster</td>
          </tr>
          <tr>
            <th scope="row">July 11</th>
            <td>Jacob</td>
            <td>Thornton</td>
            <td>@fat</td>
            <td>123123</td>
            <td>123123</td>
            <td>noobmaster</td>
          </tr>
          <tr>
            <th scope="row">July 12</th>
            <td>Larry the Bird</td>
            <td>@twitter</td>
            <td>123123</td>
            <td>123123</td>
            <td>123123</td>
            <td>noobmaster</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default Transactions;
