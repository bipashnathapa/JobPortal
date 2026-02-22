import React, { useState } from "react";
import { loginUser } from "../services/authAPI";
import "./AuthPage.css";
import bg from "../assets/bg.jpg";

const LoginPage = () => {
  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    const res = await loginUser(form);

    console.log("Login response:", res); 

    if (res.access && res.role) {
      localStorage.setItem("access", res.access);
      localStorage.setItem("username", form.username);

      
      if (res.role === "student") {
        window.location.href = "/student";
      } else {
        window.location.href = "/employer";
      }
    } else {
      alert(res.error || "Login failed");
    }
  };

  return (
    <div className="auth-page" style={{ backgroundImage: `url(${bg})` }}>
      <div className="card">
        <h2>Login</h2>

        <form>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
          />

          <div className="button-container">
            <button type="button" onClick={handleLogin}>
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
