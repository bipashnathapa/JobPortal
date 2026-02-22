import React, { useEffect, useState } from "react";
import { getStudentProfile, updateStudentProfile } from "../services/studentAPI";
import "./StudentProfile.css";

export default function StudentProfile() {
  const [form, setForm] = useState({
    full_name: "",
    university: "",
    phone: "",
    bio: "",
    skills: "",
    profile_picture: null,
  });

  const [message, setMessage] = useState("");

  // Load profile when page opens
  useEffect(() => {
    const fetchProfile = async () => {
      const res = await getStudentProfile();
      console.log("Profile API:", res);

      if (res.profile) {
        setForm({
          ...res.profile,
          profile_picture: res.profile.profile_picture || null,
        });
      } else {
        setMessage(res.error || "Failed to load profile");
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    if (e.target.name === "profile_picture") {
      setForm({ ...form, profile_picture: e.target.files[0] });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSave = async () => {
    const formData = new FormData();

    formData.append("full_name", form.full_name);
    formData.append("university", form.university);
    formData.append("phone", form.phone);
    formData.append("bio", form.bio);
    formData.append("skills", form.skills);

    if (form.profile_picture instanceof File) {
      formData.append("profile_picture", form.profile_picture);
    }

    const res = await updateStudentProfile(formData);

    if (res.message) {
      setMessage("Profile saved successfully");
    } else {
      setMessage(res.error || "Failed to save profile");
    }
  };

  return (
    <div className="profile-bg">
      <div className="profile-header">My Profile</div>

      <div className="profile-card">

        {/* Display existing image */}
        {typeof form.profile_picture === "string" && (
          <img
            src={`http://127.0.0.1:8000${form.profile_picture}`}
            alt="Profile"
            className="profile-image"
          />
        )}

        <input
          type="file"
          name="profile_picture"
          onChange={handleChange}
        />

        <input
          name="full_name"
          placeholder="Full name"
          value={form.full_name}
          onChange={handleChange}
        />

        <input
          name="university"
          placeholder="University"
          value={form.university}
          onChange={handleChange}
        />

        <input
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
        />

        <input
          name="skills"
          placeholder="Skills (comma separated)"
          value={form.skills}
          onChange={handleChange}
        />

        <textarea
          name="bio"
          placeholder="About me"
          value={form.bio}
          onChange={handleChange}
        />

        <button onClick={handleSave}>Save</button>

        {message && <p style={{ marginTop: "10px" }}>{message}</p>}
      </div>
    </div>
  );
}
