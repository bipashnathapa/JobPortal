import React from "react";
import { Navigate, useLocation } from "react-router-dom";

function decodeJwtPayload(token) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function RequireLoggedOut({ children }) {
  const location = useLocation();
  const access = localStorage.getItem("access");

  if (!access) return children;

  const payload = decodeJwtPayload(access);
  const role = payload?.role;

  if (role === "student") return <Navigate to="/home" replace state={{ from: location }} />;
  if (role === "employer") return <Navigate to="/employer" replace state={{ from: location }} />;
  if (role === "admin") return <Navigate to="/admin" replace state={{ from: location }} />;

  // Fallback if token doesn't contain role
  return <Navigate to="/home" replace state={{ from: location }} />;
}

