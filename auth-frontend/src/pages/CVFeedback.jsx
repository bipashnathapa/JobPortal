import React, { useState } from "react";
import { rateCV } from "../services/studentAPI";
import "./CVFeedback.css";

export default function CVFeedback() {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const formData = new FormData();
    if (text.trim()) formData.append("text", text.trim());
    if (file) formData.append("cv", file);

    if (!text.trim() && !file) {
      setError("Upload a PDF and/or paste your CV text.");
      return;
    }

    setLoading(true);
    const res = await rateCV(formData);
    setLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }
    setResult(res);
  };

  return (
    <div className="cv-feedback-page">
      <div className="cv-feedback-card">
        <h1>CV feedback</h1>
        <p className="cv-feedback-desc">
          Upload your CV (PDF) or paste the text below. Get a rating and improvement suggestions.
        </p>

        <form onSubmit={handleSubmit} className="cv-feedback-form">
          <div className="cv-feedback-field">
            <label>CV (PDF, optional)</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files[0] || null)}
            />
          </div>
          <div className="cv-feedback-field">
            <label>Or paste your CV text</label>
            <textarea
              placeholder="Paste your CV / resume text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
            />
          </div>

          {error && <p className="cv-feedback-error">{error}</p>}

          <button type="submit" disabled={loading} className="cv-feedback-submit">
            {loading ? "Analyzing…" : "Get feedback"}
          </button>
        </form>

        {result && (
          <div className="cv-feedback-result">
            <div className="cv-feedback-rating">
              <span className="cv-feedback-score">{result.rating}</span>
              <span className="cv-feedback-out-of">/ 10</span>
            </div>
            {result.summary && (
              <p className="cv-feedback-summary">{result.summary}</p>
            )}
            {result.suggestions && result.suggestions.length > 0 && (
              <div className="cv-feedback-suggestions">
                <h3>Suggestions</h3>
                <ul>
                  {result.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.message && result.rating === 0 && (
              <p className="cv-feedback-config">{result.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
