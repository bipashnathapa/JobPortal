import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../services/apiClient.js";
import "./PostListings.css";

export default function PostListing() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    job_title: "",
    description: "",
    salary: "",
    location: "",
    deadline: "",
    required_skills: "",
    job_type: "",
    work_mode: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!form.job_title || !form.description || !form.job_type || !form.work_mode) {
      setMessage("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      if (!localStorage.getItem("access")) {
        setMessage("Unauthorized. Please log in.");
        setLoading(false);
        return;
      }

      const res = await fetchWithAuth("/post-listing/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.message) {
        setMessage("Listing posted successfully.");
        setTimeout(() => navigate("/employer"), 1500);
      } else {
        setMessage(data.error || "Failed to post listing");
      }
    } catch (err) {
      console.error(err);
      setMessage("Network error");
    }
    setLoading(false);
  };

  return (
    <div className="post-listing-bg">
      <button className="back-button" onClick={() => navigate("/employer")}>
        Back
      </button>

      <div className="post-listing-header">Post a Job Listing</div>

      <div className="post-listing-card">
        <input
          name="job_title"
          placeholder="Job Title *"
          value={form.job_title}
          onChange={handleChange}
        />

        <div className="select-row">
          <select
            name="job_type"
            value={form.job_type}
            onChange={handleChange}
          >
            <option value="">Job Type *</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Internship">Internship</option>
            <option value="Contract">Contract</option>
            <option value="Freelance">Freelance</option>
          </select>

          <select
            name="work_mode"
            value={form.work_mode}
            onChange={handleChange}
          >
            <option value="">Work Mode *</option>
            <option value="Remote">Remote</option>
            <option value="On-site">On-site</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>

        <input
          name="location"
          placeholder="Location (e.g., Kathmandu)"
          value={form.location}
          onChange={handleChange}
        />

        <input
          name="salary"
          placeholder="Salary (e.g., 50,000 - 70,000)"
          value={form.salary}
          onChange={handleChange}
        />

        <input
          name="required_skills"
          placeholder="Required Skills (comma separated)"
          value={form.required_skills}
          onChange={handleChange}
        />

        <input
          type="date"
          name="deadline"
          placeholder="Application Deadline"
          value={form.deadline}
          onChange={handleChange}
        />

        <textarea
          name="description"
          placeholder="Job Description *"
          value={form.description}
          onChange={handleChange}
        />

        <button
          type="button"
          className="post-listing-submit"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Posting..." : "Post Listing"}
        </button>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}
