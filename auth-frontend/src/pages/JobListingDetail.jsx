import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./JobListingDetail.css";

export default function JobListingDetail() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    fetchListing();
    checkSavedStatus();
  }, [listingId]);

  const fetchListing = async () => {
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(`http://127.0.0.1:8000/api/listing/${listingId}/`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.listing) {
        setListing(data.listing);
      } else {
        setError(data.error || "Listing not found");
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to load listing");
      setLoading(false);
    }
  };

  const checkSavedStatus = async () => {
    try {
      const token = localStorage.getItem("access");
      const res = await fetch("http://127.0.0.1:8000/api/saved-jobs/", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const savedJobs = data.saved_jobs || [];
      setIsSaved(savedJobs.some((job) => job._id === listingId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleApply = () => {
    navigate(`/apply/${listingId}`);
  };

  const handleSaveToggle = async () => {
    try {
      setSaveLoading(true);
      const token = localStorage.getItem("access");
      const endpoint = isSaved
        ? `http://127.0.0.1:8000/api/unsave-job/${listingId}/`
        : `http://127.0.0.1:8000/api/save-job/${listingId}/`;

      await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsSaved(!isSaved);
    } catch (err) {
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="job-detail-container">
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="job-detail-container">
        <p className="error-text">{error}</p>
        <button className="back-btn" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="job-detail-container">
      {/* Navigation */}
      <nav className="job-detail-navbar">
        <button className="nav-btn" onClick={() => navigate("/home")}>Home</button>
        <button className="nav-btn" onClick={() => navigate("/student")}>Dashboard</button>
        <button className="nav-btn" onClick={() => navigate("/listings")}>Listings</button>
      </nav>

      {/* Job Header */}
      <div className="job-header">
        <h1 className="job-title">{listing.job_title}</h1>
        <p className="company-name">{listing.company_name || "Unknown Company"}</p>
      </div>

      {/* Job Details Grid */}
      <div className="job-info-grid">
        <div className="info-box">
          <span className="info-label">Posted:</span>
          <span className="info-value">
            {listing.posted_at ? new Date(listing.posted_at).toLocaleDateString() : "N/A"}
          </span>
        </div>
        <div className="info-box">
          <span className="info-label">Deadline:</span>
          <span className="info-value">
            {listing.deadline ? new Date(listing.deadline).toLocaleDateString() : "N/A"}
          </span>
        </div>
      </div>

      {/* Stats Section */}
      <div className="job-stats-section">
        <div className="stat-box">
          <span className="stat-label">Location</span>
          <span className="stat-value">{listing.location || "Not specified"}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Job Type:</span>
          <span className="stat-value">{listing.job_type || "Not specified"}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Salary:</span>
          <span className="stat-value">{listing.salary || "Not specified"}</span>
        </div>
      </div>

      <div className="job-stats-section">
        <div className="stat-box">
          <span className="stat-label">Work Mode:</span>
          <span className="stat-value">{listing.work_mode || "Not specified"}</span>
        </div>
      </div>

      {/* Job Description */}
      <div className="description-section">
        <h2 className="section-title">Job Description</h2>
        <p className="description-text">{listing.description}</p>
      </div>

      {/* Required Skills */}
      {listing.required_skills && (
        <div className="skills-section">
          <h2 className="section-title">Required Skills:</h2>
          <div className="skills-list">
            {listing.required_skills.split(',').map((skill, index) => (
              <span key={index} className="skill-tag">
                {skill.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-section">
        <h2 className="action-title">APPLY NOW</h2>
        <div className="action-buttons">
          <button className="apply-btn" onClick={handleApply}>
            Apply
          </button>
          <button className="save-btn" onClick={handleSaveToggle} disabled={saveLoading}>
            {saveLoading ? "Saving..." : isSaved ? "Saved" : "Save for later"}
          </button>
        </div>
      </div>

      {/* Back Button */}
      <button className="back-to-dashboard" onClick={() => navigate(-1)}>
        Back
      </button>
    </div>
  );
}
