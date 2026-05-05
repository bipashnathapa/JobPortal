import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./AuthPage.css"; // 
import bgImage from "../assets/bg.jpg"; 
import { registerUser } from "../services/authAPI"; 

const AuthPage = () => {
  const [studentData, setStudentData] = useState({
    fullName: "",
    username: "",
    email: "",
    university: "",
    password: "",
  });

  const [employerData, setEmployerData] = useState({
    companyName: "",
    username: "",
    email: "",
    password: "",
  });
  const [studentMessage, setStudentMessage] = useState("");
  const [studentMessageType, setStudentMessageType] = useState("");
  const [employerMessage, setEmployerMessage] = useState("");
  const [employerMessageType, setEmployerMessageType] = useState("");

  const handleStudentChange = (e) =>
    setStudentData({ ...studentData, [e.target.name]: e.target.value });

  const handleEmployerChange = (e) =>
    setEmployerData({ ...employerData, [e.target.name]: e.target.value });

  const handleStudentRegister = async (e) => {
    e.preventDefault();
    setStudentMessage("");
    setStudentMessageType("");
    const res = await registerUser({ ...studentData, role: "student" });
    if (res?.message) {
      setStudentMessage(res.message);
      setStudentMessageType("success");
    } else {
      setStudentMessage(res?.error || "Registration failed");
      setStudentMessageType("error");
    }
  };

  const handleEmployerRegister = async (e) => {
    e.preventDefault();
    setEmployerMessage("");
    setEmployerMessageType("");
    const res = await registerUser({ ...employerData, role: "employer" });
    if (res?.message) {
      setEmployerMessage(res.message);
      setEmployerMessageType("success");
    } else {
      setEmployerMessage(res?.error || "Registration failed");
      setEmployerMessageType("error");
    }
  };

  return (
    <div
      className="auth-page"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="card student-card">
        <h2>I'm a Student</h2>
        <form onSubmit={handleStudentRegister}>
          <input type="text" name="fullName" placeholder="Full Name" value={studentData.fullName} onChange={handleStudentChange} required />
          <input type="text" name="username" placeholder="Username" value={studentData.username} onChange={handleStudentChange} required />
          <input type="email" name="email" placeholder="Email" value={studentData.email} onChange={handleStudentChange} required />
          <input type="text" name="university" placeholder="University" value={studentData.university} onChange={handleStudentChange} required />
          <input type="password" name="password" placeholder="Create Password" value={studentData.password} onChange={handleStudentChange} required />
          {studentMessage && <p className={`form-message ${studentMessageType}`}>{studentMessage}</p>}
          <button type="submit">Register</button>
          <div className="auth-link-container">
            Already have an account? <Link to="/login" className="auth-link">Login</Link>
          </div>
        </form>
      </div>

      <div className="card employer-card">
        <h2>I'm an Employer</h2>
        <form onSubmit={handleEmployerRegister}>
          <input type="text" name="companyName" placeholder="Company Name" value={employerData.companyName} onChange={handleEmployerChange} required />
          <input type="text" name="username" placeholder="Username" value={employerData.username} onChange={handleEmployerChange} required />
          <input type="email" name="email" placeholder="Email" value={employerData.email} onChange={handleEmployerChange} required />
          <input type="password" name="password" placeholder="Create Password" value={employerData.password} onChange={handleEmployerChange} required />
          {employerMessage && <p className={`form-message ${employerMessageType}`}>{employerMessage}</p>}
          <button type="submit">Register</button>
          <div className="auth-link-container">
            Already have an account? <Link to="/login" className="auth-link">Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
