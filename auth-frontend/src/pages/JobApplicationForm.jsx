import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./JobApplicationForm.css";

export default function JobApplicationForm() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    full_name: "",
    university: "",
    email: "",
    phone: "",
    field_of_study: "",
    previous_experience: "",
    cv: null,
  });
  
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  // Pre-fill from student profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("access");
        const res = await fetch("http://127.0.0.1:8000/api/student-profile/", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        
        if (data.profile) {
          setForm(prev => ({
            ...prev,
            full_name: data.profile.full_name || "",
            university: data.profile.university || "",
            phone: data.profile.phone || "",
          }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    if (e.target.name === "cv") {
      const file = e.target.files[0];
      if (file) {
        // Validate PDF
        if (!file.name.endsWith('.pdf')) {
          setMessage("Please upload a PDF file");
          return;
        }
        // Validate size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          setMessage("File size must be less than 5MB");
          return;
        }
        setForm({ ...form, cv: file });
        setFileName(file.name);
        setMessage("");
      }
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.full_name || !form.university || !form.email || !form.phone || !form.field_of_study) {
      setMessage("Please fill in all required fields");
      return;
    }
    
    if (!form.cv) {
      setMessage("Please attach your CV");
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem("access");
      const formData = new FormData();
      
      formData.append("full_name", form.full_name);
      formData.append("university", form.university);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("field_of_study", form.field_of_study);
      formData.append("previous_experience", form.previous_experience);
      formData.append("cv", form.cv);

      const res = await fetch(`http://127.0.0.1:8000/api/apply/${listingId}/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (data.message) {
        setMessage("Application submitted successfully! ✓");
        setTimeout(() => navigate("/listings"), 2000);
      } else {
        setMessage(data.error || "Failed to submit application");
      }
    } catch (err) {
      console.error(err);
      setMessage("Network error. Please try again.");
    }
    
    setLoading(false);
  };

  return (
    <div className="application-container">
      <nav className="app-navbar">
        <button className="nav-btn">Home</button>
        <button className="nav-btn">Dashboard</button>
        <button className="nav-btn">Listings</button>
      </nav>

      <div className="app-form-wrapper">
        <h1 className="app-form-title">Job Application Form</h1>

        <div className="app-info-box">
          <p className="app-info-text">
            Make sure you have your CV ready to upload (PDF format, max 5MB). 
            Take your time to fill out this form carefully as it will be reviewed by the employer.
          </p>
        </div>

        <form className="app-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label>University</label>
            <input
              type="text"
              name="university"
              value={form.university}
              onChange={handleChange}
              placeholder="Enter your university"
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              required
            />
          </div>

          <div className="form-group">
            <label>Field of study</label>
            <input
              type="text"
              name="field_of_study"
              value={form.field_of_study}
              onChange={handleChange}
              placeholder="e.g., Computer Science"
              required
            />
          </div>

          <div className="form-group">
            <label>Previous Experience, if any</label>
            <textarea
              name="previous_experience"
              value={form.previous_experience}
              onChange={handleChange}
              placeholder="Describe your relevant experience"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="cv-upload" className="cv-upload-label">
              <span className="attachment-icon">📎</span>
              {fileName || "Attach your CV"}
            </label>
            <input
              id="cv-upload"
              type="file"
              name="cv"
              accept=".pdf"
              onChange={handleChange}
              style={{ display: 'none' }}
              required
            />
            {fileName && <p className="file-name">{fileName}</p>}
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>

          {message && (
            <p className={`message ${message.includes('success') ? 'success' : 'error'}`}>
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}