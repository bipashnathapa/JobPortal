import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
/* After App so this wins over route CSS with the same selectors; #root … rules also beat .dash-navbar alone */
import "./styles/dashboardNav.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
