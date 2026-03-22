import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ApplicationDetail.css";

export default function ApplicationDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const application = location.state?.application;
  const [slotStart, setSlotStart] = React.useState("");
  const [slotEnd, setSlotEnd] = React.useState("");
  const [meetingLink, setMeetingLink] = React.useState("");
  const [interviewLocation, setInterviewLocation] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [scheduling, setScheduling] = React.useState(false);

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

  const handleScheduleInterview = async () => {
    if (!slotStart || !slotEnd) {
      alert("Please provide both start and end time.");
      return;
    }

    const startDate = new Date(slotStart);
    const endDate = new Date(slotEnd);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      alert("Please enter valid date and time values.");
      return;
    }
    if (endDate <= startDate) {
      alert("End time must be later than start time.");
      return;
    }
    try {
      setScheduling(true);
      const token = localStorage.getItem("access");
      const res = await fetch(`http://127.0.0.1:8000/api/interviews/propose/${application._id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slot_start: slotStart,
          slot_end: slotEnd,
          meeting_link: meetingLink,
          location: interviewLocation,
          notes,
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      alert("Interview invitation sent to student.");
      setSlotStart("");
      setSlotEnd("");
      setMeetingLink("");
      setInterviewLocation("");
      setNotes("");
      navigate("/employer-interviews");
    } catch (err) {
      console.error(err);
      alert("Error scheduling interview");
    } finally {
      setScheduling(false);
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
          Back to Dashboard
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
              View Full Profile
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
            Download CV
          </button>
        </div>

        {application.status === "pending" && (
          <div className="action-buttons-section">
            <button 
              className="accept-btn"
              onClick={() => handleUpdateStatus("accepted")}
            >
              Accept Application
            </button>
            <button 
              className="reject-btn"
              onClick={() => handleUpdateStatus("rejected")}
            >
              Reject Application
            </button>
          </div>
        )}

        {application.status === "accepted" && (
          <div className="app-detail-card">
            <h2 className="section-title">Schedule Interview</h2>
            <div className="interview-form-grid">
              <div className="info-item">
                <label>Start Time</label>
                <input
                  type="datetime-local"
                  value={slotStart}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setSlotStart(newStart);

                    if (!newStart) return;
                    const start = new Date(newStart);
                    if (Number.isNaN(start.getTime())) return;

                    const currentEnd = slotEnd ? new Date(slotEnd) : null;
                    if (!currentEnd || Number.isNaN(currentEnd.getTime()) || currentEnd <= start) {
                      const suggestedEnd = new Date(start.getTime() + 60 * 60 * 1000);
                      const yyyy = suggestedEnd.getFullYear();
                      const mm = String(suggestedEnd.getMonth() + 1).padStart(2, "0");
                      const dd = String(suggestedEnd.getDate()).padStart(2, "0");
                      const hh = String(suggestedEnd.getHours()).padStart(2, "0");
                      const min = String(suggestedEnd.getMinutes()).padStart(2, "0");
                      setSlotEnd(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
                    }
                  }}
                />
              </div>
              <div className="info-item">
                <label>End Time</label>
                <input type="datetime-local" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)} />
              </div>
              <div className="info-item">
                <label>Meeting Link</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                />
              </div>
              <div className="info-item">
                <label>Location</label>
                <input
                  type="text"
                  placeholder="Office / Remote"
                  value={interviewLocation}
                  onChange={(e) => setInterviewLocation(e.target.value)}
                />
              </div>
            </div>
            <div className="info-item">
              <label>Notes</label>
              <textarea
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional details for the student"
              />
            </div>
            <button className="download-cv-btn" onClick={handleScheduleInterview} disabled={scheduling}>
              {scheduling ? "Sending..." : "Send Interview Invite"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
