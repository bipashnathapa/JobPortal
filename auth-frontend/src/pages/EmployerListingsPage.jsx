import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";
import { fetchWithAuth } from "../services/apiClient.js";
import { toast } from "react-hot-toast";
import "./EmployerDashboard.css"; // Reuse dashboard styles

export default function EmployerListingsPage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const res = await fetchWithAuth("/employer-listings/", {
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

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) {
      return;
    }

    try {
      const res = await fetchWithAuth(`/delete-listing/${listingId}/`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.message) {
        toast.success(data.message || "Listing deleted successfully");
        fetchListings();
      } else {
        toast.error(data.error || "Failed to delete listing");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting listing");
    }
  };

  const isExpired = (deadline) => {
    if (!deadline) return false;
    const today = new Date();
    const expiry = new Date(deadline);
    expiry.setHours(23, 59, 59);
    return today > expiry;
  };

  return (
    <div className="new-dash-container">
      <nav className="dash-navbar">
        <button className="nav-btn" onClick={() => navigate("/employer")}>Dashboard</button>
        <button className="nav-btn active">Listings</button>
        <LogoutButton />
      </nav>

      <div className="listings-section" style={{ marginTop: "40px" }}>
        <h2 className="listings-header">Your Posted Listings</h2>
        
        {loading ? (
          <p className="loading-text">Loading listings...</p>
        ) : listings.length === 0 ? (
          <p className="no-listings">No listings yet. Post your first job listing from the Dashboard!</p>
        ) : (
          <div className="listings-grid">
            {listings.map((listing) => {
              const expired = isExpired(listing.deadline);
              return (
                <div key={listing._id} className={`listing-card ${expired ? 'expired-card' : ''}`}>
                  <div className="listing-header-row">
                    <h3 className="listing-title">{listing.job_title}</h3>
                    {expired ? (
                      <span className="status-tag expired">Expired</span>
                    ) : (
                      <span className="listing-type">{listing.job_type}</span>
                    )}
                  </div>
                  
                  <div className="listing-details">
                    <div className="detail-item">
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">{listing.location || "Not specified"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Work Mode:</span>
                      <span className="detail-value">{listing.work_mode || "Not specified"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Salary:</span>
                      <span className="detail-value">{listing.salary || "Not specified"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Deadline:</span>
                      <span className={`detail-value ${expired ? 'deadline-passed' : ''}`}>
                        {listing.deadline || "Not specified"}
                      </span>
                    </div>
                  </div>

                  <p className="listing-description">
                    {listing.description.substring(0, 150)}...
                  </p>

                  <div className="listing-actions">
                    <button 
                      className="view-btn"
                      onClick={() => navigate(`/listing/${listing._id}`)}
                    >
                      View Details
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteListing(listing._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
