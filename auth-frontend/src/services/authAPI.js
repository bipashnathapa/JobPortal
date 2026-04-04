// src/services/authAPI.js

import { API_BASE } from "./apiClient.js";

const BASE_URL = API_BASE;

export const registerUser = async (data) => {
  try {
    const res = await fetch(`${BASE_URL}/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    // Check for non-JSON response (optional but helpful)
    const text = await res.text();
    try {
      return JSON.parse(text); // parse JSON
    } catch (err) {
      console.error("Failed to parse JSON:", text);
      return { error: "Invalid JSON response from server" };
    }
  } catch (err) {
    console.error(err);
    return { error: "Network error" };
  }
};

export const loginUser = async (data) => {
  try {
    const res = await fetch(`${BASE_URL}/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (err) {
      console.error("Failed to parse JSON:", text);
      return { error: "Invalid JSON response from server" };
    }
  } catch (err) {
    console.error(err);
    return { error: "Network error" };
  }
};

export const logout = async () => {
  try {
    await fetch(`${BASE_URL}/logout/`, {
      method: "POST",
      credentials: "include",
    });
  } catch (_) {
    /* ignore */
  }
  localStorage.removeItem("access");
  localStorage.removeItem("username");
  window.location.href = "/login";
};
