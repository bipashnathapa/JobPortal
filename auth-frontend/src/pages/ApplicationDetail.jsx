import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ApplicationDetail.css";

export default function ApplicationDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const application = location.state?.application;

  if (!application) {
    return (
      <div className="app-detail-container">
        <p>Application not found</p>
        <button onClick={() => navigate("/employer")}>Go Back</button>
      </div>
    );
  }

  const handleDownloadCV = () => {
    const cvUrl = `http://127.0.0.1:8000${application.cv_path}`;
    window.open(cvUrl, '_blank');
  };

  const handleUpdateStatus = async (status) => {
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(`http://127.0.0.1:8000/api/application/${application._id}/status/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (data.message) {
        alert(`Application ${status}!`);
        navigate("/employer");
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating status");
    }
  };

  return (
    <div className="app-detail-container">
      <nav className="app-detail-navbar">
        <button className="nav-btn" onClick={() => navigate("/employer")}>Home</button>
        <button className="nav-btn" onClick={() => navigate("/employer")}>Dashboard</button>
        <button className="nav-btn">Listings</button>
      </nav>

      <div className="app-detail-content">
        <button className="back-button" onClick={() => navigate("/employer")}>
          ← Back to Dashboard
        </button>

        <div className="app-detail-header">
          <h1>Application Details</h1>
          <span className={`status-badge-large ${application.status}`}>
            {application.status.toUpperCase()}
          </span>
        </div>

        <div className="app-detail-card">
          <h2 className="section-title">Position Applied For</h2>
          <p className="job-title-text">{application.job_title}</p>
        </div>

        <div className="app-detail-card">
          <div className="section-header-with-btn">
            <h2 className="section-title">Applicant Information</h2>
            {/* Added View Profile Button */}
            <button 
              className="view-full-profile-btn"
              onClick={() => navigate(`/view-student-profile/${application.student_username}`)}
            >
              👤 View Full Profile
            </button>
          </div>
          
          <div className="info-grid">
            <div className="info-item">
              <label>Full Name:</label>
              <p>{application.full_name}</p>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <p>{application.email}</p>
            </div>
            <div className="info-item">
              <label>Phone:</label>
              <p>{application.phone}</p>
            </div>
            <div className="info-item">
              <label>University:</label>
              <p>{application.university}</p>
            </div>
            <div className="info-item">
              <label>Field of Study:</label>
              <p>{application.field_of_study}</p>
            </div>
            <div className="info-item">
              <label>Applied On:</label>
              <p>{new Date(application.applied_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {application.previous_experience && (
          <div className="app-detail-card">
            <h2 className="section-title">Previous Experience</h2>
            <p className="experience-text">{application.previous_experience}</p>
          </div>
        )}

        <div className="app-detail-card cv-section">
          <h2 className="section-title">CV/Resume</h2>
          <button className="download-cv-btn" onClick={handleDownloadCV}>
            📄 Download CV
          </button>
        </div>

        {application.status === "pending" && (
          <div className="action-buttons-section">
            <button 
              className="accept-btn"
              onClick={() => handleUpdateStatus("accepted")}
            >
              ✓ Accept Application
            </button>
            <button 
              className="reject-btn"
              onClick={() => handleUpdateStatus("rejected")}
            >
              ✗ Reject Application
            </button>
          </div>
        )}
      </div>
    </div>
  );
}