import React from "react";
import { useNavigate } from "react-router-dom";
import "./FooterPages.css";

export default function FeaturesPage() {
  const navigate = useNavigate();

  return (
    <div className="footer-page">
      <div className="footer-page-card">
        <h1>Features</h1>
        <p>
          StepUp helps students and employers connect through a simple and practical workflow.
        </p>
        <ul>
          <li>Role-based login for student, employer, and admin</li>
          <li>Student and employer profile management with image upload</li>
          <li>Job posting and listing browse/search</li>
          <li>Job application with CV upload</li>
          <li>Application status tracking and notifications</li>
          <li>Interview scheduling and response flow</li>
          <li>Saved jobs and dashboard summaries</li>
        </ul>
        <button className="back-btn" onClick={() => navigate("/home")}>
          Back to Home
        </button>
      </div>
    </div>
  );
}
