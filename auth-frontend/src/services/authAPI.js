// src/services/authAPI.js

const BASE_URL = "http://127.0.0.1:8000/api"; // include /api prefix

export const registerUser = async (data) => {
  try {
    const res = await fetch(`${BASE_URL}/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
