import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../services/apiClient.js";
import { toast } from "react-hot-toast";
import "./StudentInterviews.css";

export default function StudentInterviews() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [submittingType, setSubmittingType] = useState(null);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const res = await fetchWithAuth("/interviews/student/", {
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

  const handleAction = async (interviewId, action) => {
    if (submittingId) return;
    setSubmittingId(interviewId);
    setSubmittingType(action);
    try {
      const res = await fetchWithAuth(`/interviews/${interviewId}/${action}/`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      toast.success(`Interview ${action === "confirm" ? "confirmed" : "declined"} successfully`);
      await fetchInterviews();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update interview status");
    } finally {
      setSubmittingId(null);
      setSubmittingType(null);
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
                    <button
                      disabled={submittingId === interview._id}
                      onClick={() => handleAction(interview._id, "confirm")}
                    >
                      {submittingId === interview._id && submittingType === "confirm"
                        ? "Confirming..."
                        : "Confirm"}
                    </button>
                    <button
                      className="decline"
                      disabled={submittingId === interview._id}
                      onClick={() => handleAction(interview._id, "decline")}
                    >
                      {submittingId === interview._id && submittingType === "decline"
                        ? "Declining..."
                        : "Decline"}
                    </button>
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
