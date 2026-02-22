import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentListings.css";

export default function StudentListings() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const token = localStorage.getItem("access");
      const res = await fetch("http://127.0.0.1:8000/api/all-listings/", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.listings) {
        setListings(data.listings);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // Helper to check if deadline has passed
  const isExpired = (deadline) => {
    if (!deadline) return false;
    const today = new Date();
    const expiry = new Date(deadline);
    expiry.setHours(23, 59, 59);
    return today > expiry;
  };

  const handleViewDetails = (e, listingId, expired) => {
    e.stopPropagation(); 
    if (expired) return; // Block navigation if expired
    navigate(`/listing/${listingId}`);
  };

  return (
    <div className="student-listings-container">
      <nav className="listings-navbar">
        <button className="nav-btn" onClick={() => navigate("/student")}>
          Home
        </button>
        <button className="nav-btn" onClick={() => navigate("/student")}>
          Dashboard
        </button>
        <button className="nav-btn active">Listings</button>
      </nav>

      <div className="listings-hero">
        <h1 className="listings-title">Browse Job Listings</h1>
        <p className="listings-subtitle">
          Find your next opportunity and apply to jobs that match your skills
        </p>
      </div>

      <div className="listings-content">
        {loading ? (
          <p className="loading-text">Loading listings...</p>
        ) : listings.length === 0 ? (
          <p className="no-listings-text">No job listings available at the moment.</p>
        ) : (
          <div className="job-cards-grid">
            {listings.map((listing) => {
              const expired = isExpired(listing.deadline);
              
              return (
                <div
                  key={listing._id}
                  className={`job-card ${expired ? "expired-card-student" : ""}`}
                >
                  <div className="job-card-header">
                    <h3 className="job-card-title">{listing.job_title}</h3>
                    {expired ? (
                      <span className="status-tag expired">Expired</span>
                    ) : (
                      <span className="job-card-type">{listing.job_type}</span>
                    )}
                  </div>

                  <p className="job-card-company">{listing.company_name}</p>

                  <div className="job-card-details">
                    <div className="job-detail-item">
                      <span className="detail-icon">📍</span>
                      <span>{listing.location || "Remote"}</span>
                    </div>
                    <div className="job-detail-item">
                      <span className="detail-icon">💼</span>
                      <span>{listing.work_mode || "Not specified"}</span>
                    </div>
                    <div className="job-detail-item">
                      <span className="detail-icon">💰</span>
                      <span>{listing.salary || "Not specified"}</span>
                    </div>
                    <div className="job-detail-item">
                      <span className="detail-icon">📅</span>
                      <span className={expired ? "expired-text" : ""}>
                        Deadline: {listing.deadline || "N/A"}
                      </span>
                    </div>
                  </div>

                  <p className="job-card-description">
                    {listing.description.substring(0, 120)}...
                  </p>

                  <div className="job-card-footer">
                    <span className="job-posted-date">
                      Posted: {listing.posted_at ? new Date(listing.posted_at).toLocaleDateString() : "N/A"}
                    </span>
                    <button 
                      className={`view-job-btn ${expired ? "disabled-btn" : ""}`}
                      onClick={(e) => handleViewDetails(e, listing._id, expired)}
                      disabled={expired}
                    >
                      {expired ? "Applications Closed" : "View Details →"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button className="back-to-dashboard-btn" onClick={() => navigate("/student")}>
        ← Back to Dashboard
      </button>
    </div>
  );
}