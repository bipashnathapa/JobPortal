import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./StudentProfileView.css";

export default function StudentProfileView() {
  const { username } = useParams(); // Get username from URL
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

        // Fetch profile by username
        const res = await fetch(
          `http://127.0.0.1:8000/api/view-student-profile/${username}/`,
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
  }, [username]);

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

      <div className="profile-view-header">{username}'s Profile</div>

      <div className="profile-view-card">
        {/* Profile Picture */}
        {profile.profile_picture && (
          <div className="profile-view-picture-section">
            <img
              src={`http://127.0.0.1:8000${profile.profile_picture}`}
              alt="Profile"
              className="profile-view-picture"
            />
          </div>
        )}

        {/* Profile Information */}
        <div className="profile-info-section">
          <div className="info-row">
            <label>Full Name:</label>
            <p>{profile.full_name || "Not provided"}</p>
          </div>

          <div className="info-row">
            <label>University:</label>
            <p>{profile.university || "Not provided"}</p>
          </div>

          <div className="info-row">
            <label>Phone:</label>
            <p>{profile.phone || "Not provided"}</p>
          </div>

          <div className="info-row">
            <label>Skills:</label>
            <p>{profile.skills || "Not provided"}</p>
          </div>

          <div className="info-row">
            <label>Bio:</label>
            <p>{profile.bio || "Not provided"}</p>
          </div>
        </div>

        <button className="close-button" onClick={() => navigate(-1)}>
          Close
        </button>
      </div>
    </div>
  );
}
