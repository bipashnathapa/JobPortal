import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";
import { scoreResumeNlp } from "../services/studentAPI";
import "./ResumeScorer.css";

export default function ResumeScorer() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    if (!file) {
      setError("Choose a PDF resume.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }
    setLoading(true);
    try {
      const data = await scoreResumeNlp(file);
      if (data.error) {
        setError(data.error);
        return;
      }
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resume-scorer-page">
      <nav className="dash-navbar">
        <button type="button" className="nav-btn" onClick={() => navigate("/home")}>
          Home
        </button>
        <button type="button" className="nav-btn" onClick={() => navigate("/student")}>
          Dashboard
        </button>
        <button type="button" className="nav-btn" onClick={() => navigate("/cv-feedback")}>
          CV feedback (AI)
        </button>
        <LogoutButton />
      </nav>

      <div className="resume-scorer-card">
        <h1>Resume scorer (NLP)</h1>
        <p className="resume-scorer-hint">
          Upload a PDF. 
        </p>

        <form onSubmit={handleSubmit} className="resume-scorer-form">
          <label className="resume-scorer-file-label">
            <span>PDF resume</span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(ev) => setFile(ev.target.files?.[0] || null)}
            />
          </label>
          <button type="submit" className="resume-scorer-submit" disabled={loading}>
            {loading ? "Scoring…" : "Score resume"}
          </button>
        </form>

        {error && <p className="resume-scorer-error">{error}</p>}

        {result && result.score != null && (
          <div className="resume-scorer-result">
            <h2>Score: {result.score}</h2>
          </div>
        )}
      </div>
    </div>
  );
}
