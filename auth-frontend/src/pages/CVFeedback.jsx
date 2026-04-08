import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { rateCV, getCvPaymentStatus, initEsewaCvPayment } from "../services/studentAPI";
import "./CVFeedback.css";

function FeedbackResultBlock({ result }) {
  if (!result) return null;
  const hasSuggestions = result.suggestions && result.suggestions.length > 0;
  const fallbackText = (result.summary || result.message || "").trim();
  return (
    <div className="cv-feedback-result">
      {hasSuggestions && (
        <div className="cv-feedback-suggestions">
          <h3>Suggestions</h3>
          <ul>
            {result.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {!hasSuggestions && fallbackText && (
        <p className="cv-feedback-config">{fallbackText}</p>
      )}
    </div>
  );
}

export default function CVFeedback() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingPay, setCheckingPay] = useState(true);
  const [credits, setCredits] = useState(null);
  const [unlimited, setUnlimited] = useState(false);
  const [priceNpr, setPriceNpr] = useState(20);
  const [payLoading, setPayLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState("");

  const canAnalyze = unlimited || (typeof credits === "number" && credits > 0);

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (!payment) return;
    if (payment === "success") {
      setBanner("Payment successful! You have one CV analysis credit. Use it from this page.");
    } else if (payment === "cancelled" || payment === "failed") {
      setBanner("Payment was not completed. Try again when you're ready.");
    } else {
      setBanner("Could not confirm payment. Contact support if money was deducted.");
    }
    searchParams.delete("payment");
    setSearchParams(searchParams, { replace: true });
    (async () => {
      const s = await getCvPaymentStatus();
      if (!s.error) {
        if (s.price_npr != null) setPriceNpr(s.price_npr);
        setCredits(typeof s.credits === "number" ? s.credits : 0);
        setUnlimited(!!s.unlimited);
      }
    })();
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCheckingPay(true);
      const s = await getCvPaymentStatus();
      if (cancelled) return;
      if (s.error) {
        setError(s.error);
        setCredits(0);
        setUnlimited(false);
      } else {
        if (s.price_npr != null) setPriceNpr(s.price_npr);
        setCredits(typeof s.credits === "number" ? s.credits : 0);
        setUnlimited(!!s.unlimited);
      }
      setCheckingPay(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePayEsewa = async () => {
    setPayLoading(true);
    setError("");
    const res = await initEsewaCvPayment();
    setPayLoading(false);
    if (res.error) {
      setError(typeof res.error === "string" ? res.error : "Could not start payment.");
      return;
    }
    const form = document.createElement("form");
    form.method = "POST";
    form.action = res.action_url;
    Object.entries(res.fields || {}).forEach(([name, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = String(value);
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  };

  const refreshPaymentStatus = async () => {
    const s = await getCvPaymentStatus();
    if (!s.error) {
      if (s.price_npr != null) setPriceNpr(s.price_npr);
      setCredits(typeof s.credits === "number" ? s.credits : 0);
      setUnlimited(!!s.unlimited);
    }
  };

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

    if (!unlimited && (credits == null || credits < 1)) {
      setError(`Pay NPR ${priceNpr} with eSewa for one CV analysis credit, then try again.`);
      return;
    }

    setLoading(true);
    const res = await rateCV(formData);
    setLoading(false);

    if (res.payment_required) {
      setError(res.message || `Pay NPR ${res.price_npr ?? priceNpr} with eSewa for one CV analysis.`);
      setCredits(0);
      await refreshPaymentStatus();
      return;
    }
    if (res.error) {
      setError(res.error);
      return;
    }
    setResult(res);
    await refreshPaymentStatus();
  };

  const topBar = (
    <div className="cv-feedback-topbar cv-feedback-topbar-row">
      <button type="button" className="cv-feedback-back" onClick={() => navigate("/student")}>
        ← Student dashboard
      </button>
      <button type="button" className="cv-feedback-back" onClick={() => navigate("/cv-analysis-history")}>
        Past analyses (Groq)
      </button>
    </div>
  );

  if (checkingPay) {
    return (
      <div className="cv-feedback-page">
        {topBar}
        <div className="cv-feedback-card">
          <p className="cv-feedback-desc">Loading...</p>
        </div>
      </div>
    );
  }

  if (!canAnalyze) {
    return (
      <div className="cv-feedback-page">
        {topBar}
        {result && (
          <div className="cv-feedback-card cv-feedback-last-run">
            <h2 className="cv-feedback-last-run-title">Your last analysis</h2>
            <p className="cv-feedback-desc">Pay below for another run. Past runs are also in &quot;Past analyses&quot;.</p>
            <FeedbackResultBlock result={result} />
          </div>
        )}
        <div className="cv-feedback-card cv-feedback-paywall">
          <h1>CV analysis</h1>
          <p className="cv-feedback-desc">
            Each analysis uses <strong>one eSewa payment</strong> (NPR {priceNpr}). Pay to receive a credit, then submit
            your CV on the next screen.
          </p>
          <div className="cv-feedback-price">
            <span className="cv-feedback-price-amount">NPR {priceNpr}</span>
            <span className="cv-feedback-price-note">per analysis</span>
          </div>
          {banner && <p className="cv-feedback-banner">{banner}</p>}
          {error && <p className="cv-feedback-error">{error}</p>}
          <button type="button" className="cv-feedback-submit" onClick={handlePayEsewa} disabled={payLoading}>
            {payLoading ? "Redirecting..." : "Pay with eSewa"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cv-feedback-page">
      {topBar}
      <div className="cv-feedback-card">
        <h1>CV feedback</h1>
        {banner && <p className="cv-feedback-banner">{banner}</p>}
        {!unlimited && credits != null && credits > 0 && (
          <p className="cv-feedback-desc cv-feedback-credits">
            {credits === 1 ? "1 analysis credit — submit uses it." : `${credits} analysis credits — each submit uses one.`}
          </p>
        )}
        {unlimited && (
          <p className="cv-feedback-desc cv-feedback-credits">Unlimited CV analyses on your account.</p>
        )}
        <p className="cv-feedback-desc">
          Upload your CV (PDF) or paste the text below. Get improvement suggestions from the AI.
        </p>

        <form onSubmit={handleSubmit} className="cv-feedback-form">
          <div className="cv-feedback-field">
            <label>CV (PDF, optional)</label>
            <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0] || null)} />
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

        {result && <FeedbackResultBlock result={result} />}
      </div>
    </div>
  );
}
