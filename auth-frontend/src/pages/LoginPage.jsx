import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authAPI";
import "./AuthPage.css";
import bg from "../assets/bg.jpg";

const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    setLoggingIn(true);
    setMessage("");
    setMessageType("");
    const res = await loginUser(form);

    if (res.access && res.role) {
      localStorage.setItem("access", res.access);
      localStorage.setItem("username", form.username);
      localStorage.setItem("role", res.role);

      setMessage("Login successful");
      setMessageType("success");

      setTimeout(() => {
        if (res.role === "student") {
          navigate("/home", { replace: true });
        } else if (res.role === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/employer", { replace: true });
        }
      }, 700);
    } else {
      setMessage(res.error || "Login failed");
      setMessageType("error");
    }
    setLoggingIn(false);
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
            {message && <p className={`auth-message ${messageType}`}>{message}</p>}
            <button type="button" onClick={handleLogin} disabled={loggingIn}>
              {loggingIn ? "Logging in..." : "Login"}
            </button>
          </div>
          <div className="auth-link-container">
            Don't have an account? <Link to="/" className="auth-link">Register</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
