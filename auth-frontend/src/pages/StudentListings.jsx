import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../services/apiClient.js";
import "./StudentListings.css";

export default function StudentListings() {
  const navigate = useNavigate();
  const locationRouter = useLocation();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, [locationRouter.search]);

  const fetchListings = async () => {
    try {
      const res = await fetchWithAuth("/all-listings/", {
        method: "GET",
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

  const params = new URLSearchParams(locationRouter.search);
  const searchValue = (params.get("search") || "").trim().toLowerCase();
  const locationValue = (params.get("location") || "").trim().toLowerCase();
  const typeValue = (params.get("type") || "").trim().toLowerCase();
  const categoryValue = (params.get("category") || "").trim().toLowerCase();

  const filteredListings = listings.filter((listing) => {
    const jobTitle = (listing.job_title || "").toLowerCase();
    const description = (listing.description || "").toLowerCase();
    const company = (listing.company_name || "").toLowerCase();
    const skills = (listing.required_skills || "").toLowerCase();
    const listingLocation = (listing.location || "").toLowerCase();
    const listingType = (listing.job_type || "").toLowerCase();

    const matchesSearch =
      !searchValue ||
      jobTitle.includes(searchValue) ||
      description.includes(searchValue) ||
      company.includes(searchValue) ||
      skills.includes(searchValue);

    const matchesLocation = !locationValue || listingLocation.includes(locationValue);
    const matchesType = !typeValue || listingType === typeValue;
    const matchesCategory = !categoryValue || skills.includes(categoryValue) || description.includes(categoryValue);

    return matchesSearch && matchesLocation && matchesType && matchesCategory;
  });

  return (
    <div className="student-listings-container">
      <nav className="listings-navbar">
        <button className="nav-btn" onClick={() => navigate("/home")}>
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
        ) : filteredListings.length === 0 ? (
          <p className="no-listings-text">No job listings available at the moment.</p>
        ) : (
          <div className="job-cards-grid">
            {filteredListings.map((listing) => {
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
                      <span className="detail-icon detail-icon-location" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      <span>{listing.location || "Remote"}</span>
                    </div>
                    <div className="job-detail-item">
                      <span className="detail-icon detail-icon-mode" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M3 7h18M8 7v-1.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7m-11 0v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      <span>{listing.work_mode || "Not specified"}</span>
                    </div>
                    <div className="job-detail-item">
                      <span className="detail-icon detail-icon-salary" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none">
                          <rect x="3.5" y="6.5" width="17" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      <span>{listing.salary || "Not specified"}</span>
                    </div>
                    <div className="job-detail-item">
                      <span className="detail-icon detail-icon-deadline" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none">
                          <rect x="4" y="5.5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 3.5v4M16 3.5v4M4 9.5h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
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
                      {expired ? "Applications Closed" : "View Details"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button className="back-to-dashboard-btn" onClick={() => navigate("/student")}>
        Back to Dashboard
      </button>
    </div>
  );
}
