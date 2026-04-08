import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCvAnalysisHistory } from "../services/studentAPI";
import "./CVFeedback.css";
import "./CvAnalysisHistory.css";

export default function CvAnalysisHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getCvAnalysisHistory(100);
      if (cancelled) return;
      if (data.error) setError(data.error);
      else setHistory(data.history || []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="cv-feedback-page">
      <div className="cv-feedback-topbar cv-history-topbar">
        <button type="button" className="cv-feedback-back" onClick={() => navigate("/cv-feedback")}>
          ← CV feedback
        </button>
        <button type="button" className="cv-feedback-back" onClick={() => navigate("/student")}>
          Dashboard
        </button>
      </div>

      <div className="cv-feedback-card cv-history-card-wide">
        <h1>Past CV analyses (Groq)</h1>
        <p className="cv-feedback-desc">
          Each run is saved after a successful analysis. Entries without a live API key show as setup / demo.
        </p>

        {loading && <p className="cv-feedback-desc">Loading…</p>}
        {error && <p className="cv-feedback-error">{error}</p>}

        {!loading && !error && history.length === 0 && (
          <p className="cv-feedback-desc">No analyses yet. Run one from CV feedback.</p>
        )}

        {!loading && history.length > 0 && (
          <ul className="cv-history-list">
            {history.map((row) => (
              <li key={row._id} className="cv-history-item">
                <div className="cv-history-item-head">
                  <span className="cv-history-date">{row.created_at || "—"}</span>
                </div>
                {!row.groq_live && (
                  <p className="cv-history-demo">Demo / API not configured for this run</p>
                )}
                {row.summary && <p className="cv-history-summary">{row.summary}</p>}
                {row.suggestions && row.suggestions.length > 0 && (
                  <ul className="cv-history-suggestions">
                    {row.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                )}
                <p className="cv-history-meta">
                  Model: {row.model || "—"} · {row.provider || "groq"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
