import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentInterviews.css";

export default function StudentInterviews() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const token = localStorage.getItem("access");
      const res = await fetch("http://127.0.0.1:8000/api/interviews/student/", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setInterviews(data.interviews || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (interviewId, action) => {
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(`http://127.0.0.1:8000/api/interviews/${interviewId}/${action}/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      fetchInterviews();
    } catch (err) {
      console.error(err);
      alert("Failed to update interview status");
    }
  };

  return (
    <div className="student-interviews-container">
      <nav className="dash-navbar">
        <button className="nav-btn" onClick={() => navigate("/home")}>Home</button>
        <button className="nav-btn" onClick={() => navigate("/student")}>Dashboard</button>
        <button className="nav-btn active">Interviews</button>
      </nav>

      <section className="student-interviews-content">
        <h1>My Interviews</h1>
        {loading ? (
          <p>Loading interviews...</p>
        ) : interviews.length === 0 ? (
          <p>No interviews scheduled yet.</p>
        ) : (
          <div className="interviews-grid">
            {interviews.map((interview) => (
              <article key={interview._id} className={`interview-card status-${interview.status}`}>
                <h3>{interview.job_title || "Interview"}</h3>
                <p><strong>Start:</strong> {new Date(interview.slot_start).toLocaleString()}</p>
                <p><strong>End:</strong> {new Date(interview.slot_end).toLocaleString()}</p>
                {interview.location && <p><strong>Location:</strong> {interview.location}</p>}
                {interview.meeting_link && (
                  <p>
                    <strong>Link:</strong>{" "}
                    <a href={interview.meeting_link} target="_blank" rel="noreferrer">Join meeting</a>
                  </p>
                )}
                {interview.notes && <p><strong>Notes:</strong> {interview.notes}</p>}
                <p className="status-line">Status: {interview.status}</p>
                {interview.status === "proposed" && (
                  <div className="actions-row">
                    <button onClick={() => handleAction(interview._id, "confirm")}>Confirm</button>
                    <button className="decline" onClick={() => handleAction(interview._id, "decline")}>Decline</button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
