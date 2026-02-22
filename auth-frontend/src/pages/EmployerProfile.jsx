import React, { useEffect, useState } from "react";
import { getEmployerProfile, updateEmployerProfile } from "../services/employerAPI";
import "./EmployerProfile.css";

export default function EmployerProfile() {
  const [form, setForm] = useState({
    company_name: "",
    industry: "",
    location: "",
    company_size: "",
    website: "",
    description: "",
    profile_picture: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [message, setMessage] = useState("");

  // Load profile when page opens
  useEffect(() => {
    const fetchProfile = async () => {
      const res = await getEmployerProfile();
      console.log("Employer Profile API:", res);

      if (res.profile) {
        setForm({
          company_name: res.profile.company_name || "",
          industry: res.profile.industry || "",
          location: res.profile.location || "",
          company_size: res.profile.company_size || "",
          website: res.profile.website || "",
          description: res.profile.description || "",
          profile_picture: res.profile.profile_picture || null,
        });
        
        // Set initial image preview if profile picture exists
        if (res.profile.profile_picture) {
          setImagePreview(`http://127.0.0.1:8000${res.profile.profile_picture}`);
        }
      } else {
        setMessage(res.error || "Failed to load profile");
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    if (e.target.name === "profile_picture") {
      const file = e.target.files[0];
      if (file) {
        setForm({ ...form, profile_picture: file });
        
        // Create preview URL for the selected image
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSave = async () => {
    const formData = new FormData();

    formData.append("company_name", form.company_name);
    formData.append("industry", form.industry);
    formData.append("location", form.location);
    formData.append("company_size", form.company_size);
    formData.append("website", form.website);
    formData.append("description", form.description);

    if (form.profile_picture instanceof File) {
      formData.append("profile_picture", form.profile_picture);
    }

    const res = await updateEmployerProfile(formData);

    if (res.message) {
      setMessage("Profile saved successfully ✓");
      
      // Update image preview with saved image path
      if (res.profile_picture) {
        setImagePreview(`http://127.0.0.1:8000${res.profile_picture}`);
      }
    } else {
      setMessage(res.error || "Failed to save profile");
    }
  };

  return (
    <div className="profile-bg">
      <div className="profile-header">Company Profile</div>

      <div className="profile-card">
        
        <div className="profile-picture-section">
          {imagePreview ? (
            <div className="profile-picture-container">
              <img
                src={imagePreview}
                alt="Company Logo"
                className="profile-picture"
              />
            </div>
          ) : (
            <div className="profile-picture-placeholder">
              <span>No Logo</span>
            </div>
          )}
          
          <label htmlFor="profile-picture-input" className="upload-button">
            {imagePreview ? "Change Logo" : "Upload Logo"}
          </label>
          <input
            id="profile-picture-input"
            type="file"
            name="profile_picture"
            accept="image/*"
            onChange={handleChange}
            style={{ display: "none" }}
          />
        </div>

        <input
          name="company_name"
          placeholder="Company Name"
          value={form.company_name}
          onChange={handleChange}
        />

        <input
          name="industry"
          placeholder="Industry (e.g., Technology, Finance)"
          value={form.industry}
          onChange={handleChange}
        />

        <input
          name="location"
          placeholder="Location (e.g., San Francisco, CA)"
          value={form.location}
          onChange={handleChange}
        />

        <input
          name="company_size"
          placeholder="Company Size (e.g., 50-100 employees)"
          value={form.company_size}
          onChange={handleChange}
        />

        <input
          name="website"
          placeholder="Website (e.g., https://company.com)"
          value={form.website}
          onChange={handleChange}
        />

        <textarea
          name="description"
          placeholder="Company Description"
          value={form.description}
          onChange={handleChange}
        />

        <button onClick={handleSave}>Save Profile</button>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}