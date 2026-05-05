import React from "react";
import { useNavigate } from "react-router-dom";
import "./FooterPages.css";

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="footer-page">
      <div className="footer-page-card">
        <h1>About Us</h1>
        <p>
          StepUp is a final year project focused on bridging the gap between students looking for
          internships/jobs and employers looking for entry-level talent.
        </p>
        <p>
          The platform is designed to keep the process simple: create profile, browse opportunities, apply with CV,
          and track updates from one dashboard.
        </p>
        <button className="back-btn" onClick={() => navigate("/home")}>
          Back to Home
        </button>
      </div>
    </div>
  );
}
