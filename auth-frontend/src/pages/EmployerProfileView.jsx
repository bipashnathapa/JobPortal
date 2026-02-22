import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./EmployerProfileView.css";

export default function EmployerProfileView() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("access");
        if (!token) {
          setError("Unauthorized");
          setLoading(false);
          return;
        }

        const res = await fetch(
          `http://127.0.0.1:8000/api/employer-profile/`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();

        if (data.profile) {
          setProfile(data.profile);
        } else {
          setError(data.error || "Profile not found");
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load profile");
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="profile-view-bg">
        <div className="profile-view-card">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-view-bg">
        <div className="profile-view-card">
          <p style={{ color: "#ff6b6b" }}>{error}</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-view-bg">
      <button className="back-button" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="profile-view-header">Company Profile</div>

      <div className="profile-view-card">
        {/* Company Logo */}
        {profile.profile_picture && (
          <div className="profile-view-picture-section">
            <img
              src={`http://127.0.0.1:8000${profile.profile_picture}`}
              alt="Company Logo"
              className="profile-view-picture"
            />
          </div>
        )}

        {/* Company Information */}
        <div className="profile-info-section">
          <div className="info-row">
            <label>Company Name:</label>
            <p>{profile.company_name || "Not provided"}</p>
          </div>

          <div className="info-row">
            <label>Industry:</label>
            <p>{profile.industry || "Not provided"}</p>
          </div>

          <div className="info-row">
            <label>Location:</label>
            <p>{profile.location || "Not provided"}</p>
          </div>

          <div className="info-row">
            <label>Company Size:</label>
            <p>{profile.company_size || "Not provided"}</p>
          </div>

          <div className="info-row">
            <label>Website:</label>
            <p>{profile.website || "Not provided"}</p>
          </div>

          <div className="info-row">
            <label>Description:</label>
            <p>{profile.description || "Not provided"}</p>
          </div>
        </div>

        <button className="close-button" onClick={() => navigate(-1)}>
          Close
        </button>
      </div>
    </div>
  );
}
