import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SavedJobs.css";

export default function SavedJobs() {
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      const token = localStorage.getItem("access");
      const res = await fetch("http://127.0.0.1:8000/api/saved-jobs/", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSavedJobs(data.saved_jobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (listingId) => {
    try {
      const token = localStorage.getItem("access");
      await fetch(`http://127.0.0.1:8000/api/unsave-job/${listingId}/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchSavedJobs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="saved-jobs-container">
      <nav className="saved-jobs-navbar">
        <button className="nav-btn" onClick={() => navigate("/student")}>Dashboard</button>
        <button className="nav-btn" onClick={() => navigate("/listings")}>Listings</button>
        <button className="nav-btn active">Saved Jobs</button>
      </nav>

      <section className="saved-jobs-hero">
        <h1>Saved Jobs</h1>
        <p>Review jobs you bookmarked and jump back to details anytime.</p>
      </section>

      <main className="saved-jobs-content">
        {loading ? (
          <p className="saved-jobs-state">Loading saved jobs...</p>
        ) : savedJobs.length === 0 ? (
          <p className="saved-jobs-state">No saved jobs yet. Save one from a listing detail page.</p>
        ) : (
          <div className="saved-jobs-grid">
            {savedJobs.map((job) => (
              <article className="saved-job-card" key={job._id}>
                <h3>{job.job_title}</h3>
                <p className="company">{job.company_name || "Unknown Company"}</p>
                <p className="meta">{job.location || "Remote"} • {job.job_type || "Not specified"}</p>
                <p className="desc">{(job.description || "").slice(0, 130)}...</p>
                <div className="saved-job-actions">
                  <button onClick={() => navigate(`/listing/${job._id}`)}>View Details</button>
                  <button className="danger" onClick={() => handleUnsave(job._id)}>Remove</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
