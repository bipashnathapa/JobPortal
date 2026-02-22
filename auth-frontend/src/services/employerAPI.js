// src/services/employerAPI.js
const BASE_URL = "http://127.0.0.1:8000/api";

// Get the employer's profile using JWT token
export const getEmployerProfile = async () => {
  try {
    const token = localStorage.getItem("access");
    if (!token) return { error: "No access token found" };

    const res = await fetch(`${BASE_URL}/employer-profile/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { error: "Invalid JSON response" };
    }
  } catch (err) {
    console.error(err);
    return { error: "Network error" };
  }
};

// Update the employer's profile using JWT token
export const updateEmployerProfile = async (formData) => {
  try {
    const token = localStorage.getItem("access");
    if (!token) return { error: "No access token found" };

    const res = await fetch(`${BASE_URL}/employer-profile/update/`, {
      method: "POST",
      headers: {
        // DON'T set Content-Type for FormData - browser sets it automatically with boundary
        Authorization: `Bearer ${token}`,
      },
      body: formData, // FormData object passed directly
    });

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { error: "Invalid JSON response" };
    }
  } catch (err) {
    console.error(err);
    return { error: "Network error" };
  }
};