import React from "react";
import { useNavigate } from "react-router-dom";
import "./FooterPages.css";

export default function ContactPage() {
  const navigate = useNavigate();

  return (
    <div className="footer-page">
      <div className="footer-page-card">
        <h1>Contact Us</h1>
        <p>If you need help, feedback, or support, use the details below.</p>
        <ul>
          <li>Email: support@stepup.com</li>
          <li>Phone: +977-9800000000</li>
          <li>Office Hours: Sunday - Friday, 10:00 AM - 5:00 PM</li>
          <li>Location: Kathmandu, Nepal</li>
        </ul>
        <button className="back-btn" onClick={() => navigate("/home")}>
          Back to Home
        </button>
      </div>
    </div>
  );
}
