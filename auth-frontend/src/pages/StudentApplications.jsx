import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";
import { getStudentApplications } from "../services/studentAPI.js";
import "./EmployerDashboard.css";
import "./StudentDashboard.css";

export default function StudentApplications() {
  const navigate = useNavigate();
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getStudentApplications();
      if (!cancelled && data.applications) setMyApplications(data.applications);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pendingApps = myApplications.filter((a) => a.status === "pending");
  const acceptedApps = myApplications.filter((a) => a.status === "accepted");
  const rejectedApps = myApplications.filter((a) => a.status === "rejected");

  return (
    <div className="new-dash-container">
      <nav className="dash-navbar">
        <button type="button" className="nav-btn" onClick={() => navigate("/home")}>
          Home
        </button>
        <button type="button" className="nav-btn" onClick={() => navigate("/student")}>
          Dashboard
        </button>
        <button type="button" className="nav-btn" onClick={() => navigate("/listings")}>
          Listings
        </button>
        <button type="button" className="nav-btn active">
          My applications
        </button>
        <LogoutButton />
      </nav>

      <div className="student-applications-page-wrap">
        <div className="student-applications-page-header">
          <button
            type="button"
            className="student-applications-back"
            onClick={() => navigate("/student")}
          >
            ← Back to dashboard
          </button>
          <h1 className="student-applications-page-title">My applications</h1>
          <p className="student-applications-sub">
            Pending, accepted, and rejected roles you applied to. Open a job to see details.
          </p>
        </div>

        {loading ? (
          <p className="student-applications-empty">Loading…</p>
        ) : myApplications.length === 0 ? (
          <p className="student-applications-empty">You have not applied to any jobs yet.</p>
        ) : (
          <div className="student-applications-grid">
            <div className="student-applications-column">
              <h2 className="student-applications-column-title pending">Pending ({pendingApps.length})</h2>
              <ul className="student-applications-list">
                {pendingApps.map((a) => (
                  <li key={a._id} className="student-application-card">
                    <div className="student-application-job">{a.job_title}</div>
                    <div className="student-application-meta">{a.company_name}</div>
                    <div className="student-application-date">{a.applied_at || "—"}</div>
                    {a.listing_id && (
                      <button
                        type="button"
                        className="student-application-link"
                        onClick={() => navigate(`/listing/${a.listing_id}`)}
                      >
                        View listing
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {pendingApps.length === 0 && (
                <p className="student-applications-none">No pending applications.</p>
              )}
            </div>
            <div className="student-applications-column">
              <h2 className="student-applications-column-title accepted">Accepted ({acceptedApps.length})</h2>
              <ul className="student-applications-list">
                {acceptedApps.map((a) => (
                  <li key={a._id} className="student-application-card">
                    <div className="student-application-job">{a.job_title}</div>
                    <div className="student-application-meta">{a.company_name}</div>
                    <div className="student-application-date">{a.applied_at || "—"}</div>
                    {a.listing_id && (
                      <button
                        type="button"
                        className="student-application-link"
                        onClick={() => navigate(`/listing/${a.listing_id}`)}
                      >
                        View listing
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {acceptedApps.length === 0 && (
                <p className="student-applications-none">No accepted applications yet.</p>
              )}
            </div>
            <div className="student-applications-column">
              <h2 className="student-applications-column-title rejected">Rejected ({rejectedApps.length})</h2>
              <ul className="student-applications-list">
                {rejectedApps.map((a) => (
                  <li key={a._id} className="student-application-card">
                    <div className="student-application-job">{a.job_title}</div>
                    <div className="student-application-meta">{a.company_name}</div>
                    <div className="student-application-date">{a.applied_at || "—"}</div>
                    {a.listing_id && (
                      <button
                        type="button"
                        className="student-application-link"
                        onClick={() => navigate(`/listing/${a.listing_id}`)}
                      >
                        View listing
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {rejectedApps.length === 0 && (
                <p className="student-applications-none">No rejected applications.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
