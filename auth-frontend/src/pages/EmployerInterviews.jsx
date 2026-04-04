import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../services/apiClient.js";
import "./EmployerInterviews.css";

export default function EmployerInterviews() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const res = await fetchWithAuth("/interviews/employer/", {
        method: "GET",
      });
      const data = await res.json();
      setInterviews(data.interviews || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="employer-interviews-container">
      <nav className="dash-navbar">
        <button className="nav-btn" onClick={() => navigate("/employer")}>Home</button>
        <button className="nav-btn" onClick={() => navigate("/employer")}>Dashboard</button>
        <button className="nav-btn active">Interviews</button>
      </nav>

      <section className="employer-interviews-content">
        <h1>Interview Schedule</h1>
        {loading ? (
          <p>Loading interviews...</p>
        ) : interviews.length === 0 ? (
          <p>No interviews scheduled yet.</p>
        ) : (
          <div className="interviews-grid">
            {interviews.map((interview) => (
              <article key={interview._id} className={`interview-card status-${interview.status}`}>
                <h3>{interview.job_title || "Interview"}</h3>
                <p>
                  <strong>Student:</strong>{" "}
                  {interview.student_full_name || interview.student_username}
                </p>
                <p><strong>Start:</strong> {new Date(interview.slot_start).toLocaleString()}</p>
                <p><strong>End:</strong> {new Date(interview.slot_end).toLocaleString()}</p>
                {interview.location && <p><strong>Location:</strong> {interview.location}</p>}
                {interview.meeting_link && (
                  <p>
                    <strong>Link:</strong>{" "}
                    <a href={interview.meeting_link} target="_blank" rel="noreferrer">Open meeting</a>
                  </p>
                )}
                {interview.notes && <p><strong>Notes:</strong> {interview.notes}</p>}
                <p className="status-line">Status: {interview.status}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
