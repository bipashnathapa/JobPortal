// src/services/employerAPI.js
import { API_BASE, fetchWithAuth } from "./apiClient.js";

// Get the employer's profile using JWT token
export const getEmployerProfile = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/employer-profile/`, {
      method: "GET",
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
    const res = await fetchWithAuth(`${API_BASE}/employer-profile/update/`, {
      method: "POST",
      headers: {},
      body: formData,
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
