// src/services/studentAPI.js
import { API_BASE, fetchWithAuth } from "./apiClient.js";

// Get the student's profile using JWT token (no need to pass username)
export const getStudentProfile = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/student-profile/`, {
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

// Update the student's profile using JWT token
export const updateStudentProfile = async (formData) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/student-profile/update/`, {
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

// CV rating / feedback (chatbot-style)
export const rateCV = async (formData) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/rate-cv/`, {
      method: "POST",
      headers: {},
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (res.status === 402) {
      return {
        payment_required: true,
        price_npr: data.price_npr,
        message: data.message || "Payment required.",
      };
    }
    if (!res.ok) return { error: data.error || "Request failed" };
    return data;
  } catch (err) {
    console.error(err);
    return { error: "Network error" };
  }
};

export const getCvPaymentStatus = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/cv-payment/status/`, {
      method: "GET",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.error || "Failed to fetch payment status" };
    return data;
  } catch (err) {
    console.error(err);
    return { error: "Network error" };
  }
};

export const initEsewaCvPayment = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/cv-payment/esewa/init/`, {
      method: "POST",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.error || "Failed to initialize eSewa payment" };
    return data;
  } catch (err) {
    console.error(err);
    return { error: "Network error" };
  }
};
