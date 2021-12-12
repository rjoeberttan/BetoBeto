import React from "react";

export default function ErrorPage() {
  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ color: "white", height: "100vh" }}
    >
      <h1 className="mr-3 pr-3 align-top border-right inline-block align-content-center">
        ☠️ 404
      </h1>
      <div className="inline-block align-middle">
        <h2 className="font-weight-normal lead" id="desc">
          &nbsp; The page you requested was not found.
        </h2>
      </div>
    </div>
  );
}
