import React, { useState } from "react";
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

  const handleStudentChange = (e) =>
    setStudentData({ ...studentData, [e.target.name]: e.target.value });

  const handleEmployerChange = (e) =>
    setEmployerData({ ...employerData, [e.target.name]: e.target.value });

  const handleStudentRegister = async (e) => {
    e.preventDefault();
    const res = await registerUser({ ...studentData, role: "student" });
    console.log(res);
  };

  const handleEmployerRegister = async (e) => {
    e.preventDefault();
    const res = await registerUser({ ...employerData, role: "employer" });
    console.log(res);
  };

  return (
    <div
      className="auth-page"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="card student-card">
        <h2>I'm a Student</h2>
        <form onSubmit={handleStudentRegister}>
          <input type="text" name="fullName" placeholder="Full Name" onChange={handleStudentChange} required />
          <input type="text" name="username" placeholder="Username" onChange={handleStudentChange} required />
          <input type="email" name="email" placeholder="Email" onChange={handleStudentChange} required />
          <input type="text" name="university" placeholder="University" onChange={handleStudentChange} required />
          <input type="password" name="password" placeholder="Create Password" onChange={handleStudentChange} required />
          <button type="submit">Register</button>
        </form>
      </div>

      <div className="card employer-card">
        <h2>I'm an Employer</h2>
        <form onSubmit={handleEmployerRegister}>
          <input type="text" name="companyName" placeholder="Company Name" onChange={handleEmployerChange} required />
          <input type="text" name="username" placeholder="Username" onChange={handleEmployerChange} required />
          <input type="email" name="email" placeholder="Email" onChange={handleEmployerChange} required />
          <input type="password" name="password" placeholder="Create Password" onChange={handleEmployerChange} required />
          <button type="submit">Register</button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
