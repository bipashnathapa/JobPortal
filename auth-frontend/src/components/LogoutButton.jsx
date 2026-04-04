import React from "react";
import { logout } from "../services/authAPI";
import "./LogoutButton.css";

export default function LogoutButton({ className = "nav-btn logout-btn" }) {
  return (
    <button type="button" className={className} onClick={logout}>
      Logout
    </button>
  );
}
