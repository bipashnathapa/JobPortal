// src/services/studentAPI.js
const BASE_URL = "http://127.0.0.1:8000/api";

// Get the student's profile using JWT token (no need to pass username)
export const getStudentProfile = async () => {
  try {
    const token = localStorage.getItem("access"); // get JWT from login
    if (!token) return { error: "No access token found" };

    const res = await fetch(`${BASE_URL}/student-profile/`, {
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

// Update the student's profile using JWT token
export const updateStudentProfile = async (formData) => {
  try {
    const token = localStorage.getItem("access");
    if (!token) return { error: "No access token found" };

    const res = await fetch(`${BASE_URL}/student-profile/update/`, {
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

// CV rating / feedback (chatbot-style)
export const rateCV = async (formData) => {
  try {
    const token = localStorage.getItem("access");
    if (!token) return { error: "No access token found" };

    const res = await fetch(`${BASE_URL}/rate-cv/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.error || "Request failed" };
    return data;
  } catch (err) {
    console.error(err);
    return { error: "Network error" };
  }
};