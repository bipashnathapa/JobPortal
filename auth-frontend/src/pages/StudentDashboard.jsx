import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";
import { fetchWithAuth } from "../services/apiClient.js";
import "./EmployerDashboard.css";
import "./StudentDashboard.css";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "Student";
  const [notifications, setNotifications] = useState([]);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [activeApplicationsCount, setActiveApplicationsCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 200,
    total_count: 0,
    total_pages: 1,
    has_previous: false,
    has_next: false,
  });
  useEffect(() => {
    fetchNotifications();
    fetchSavedJobsCount();
    fetchApplicationStats();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetchWithAuth(
        `/student-notifications/?page=1&page_size=200`,
        {
          method: "GET",
        }
      );
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditProfile = () => {
    navigate("/student-profile");
  };

  const fetchSavedJobsCount = async () => {
    try {
      const res = await fetchWithAuth("/saved-jobs/", {
        method: "GET",
      });
      const data = await res.json();
      setSavedJobsCount(data.saved_count || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApplicationStats = async () => {
    try {
      const res = await fetchWithAuth("/student-application-stats/", {
        method: "GET",
      });
      const data = await res.json();
      if (typeof data.active_applications === "number") {
        setActiveApplicationsCount(data.active_applications);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewProfile = () => {
    
    navigate(`/view-student-profile/${username}`); 
  };
  const handleAnalyzeCV = () => {
    navigate("/cv-feedback");
  };

  const handleResumeScorer = () => {
    navigate("/resume-scorer");
  };

  const getNotificationMessage = (notification, isReadSection = false) => {
    if (notification.type === "interview_proposed") {
      return notification.message || "Interview invitation received. Please review and respond.";
    }
    if (notification.type === "application_status") {
      if (notification.status === "accepted") {
        return isReadSection
          ? "Application was accepted"
          : "Application accepted. Congratulations.";
      }
      if (notification.status === "rejected") {
        return isReadSection
          ? "Application was rejected"
          : "Application update: not selected this round.";
      }
    }
    return notification.message || "You have a new update.";
  };

  const getActivityTitle = (notification) => {
    if (notification.type === "application_status") return "Application Reviewed";
    if (notification.type === "interview_proposed") return "Interview Invitation";
    return "Application submitted";
  };

  const formatActivityTime = (createdAt) => {
    const created = new Date(createdAt);
    const diffMs = Date.now() - created.getTime();
    if (Number.isNaN(created.getTime()) || diffMs < 60 * 1000) return "Just now";
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  };

  const latestNotifications = notifications.slice(0, 2);

  return (
    <div className="new-dash-container student-dashboard-root">
      <nav className="dash-navbar">
        <button className="nav-btn" onClick={() => navigate("/home")}>Home</button>
        <button className="nav-btn active">Dashboard</button>
        <button className="nav-btn" onClick={() => navigate("/listings")}>
          Listings
        </button>
        <LogoutButton />
      </nav>

      <div className="hero-section">
        <h1 className="hero-title">Welcome Back, {username}</h1>
        <p className="hero-subtitle">
          Ready to take the next step in your career? Explore new opportunities 
          and apply to jobs that match your skills.
        </p>

        <div className="action-buttons">
          <button className="action-btn" onClick={handleEditProfile}>
            Edit profile
          </button>
          <button className="action-btn" onClick={handleAnalyzeCV}>
            Analyze your CV
          </button>
          <button className="action-btn" onClick={() => navigate("/cv-analysis-history")}>
            CV analysis history
          </button>
          <button className="action-btn" onClick={handleResumeScorer}>
            Resume scorer (NLP)
          </button>
          <button className="action-btn" onClick={handleViewProfile}>
            View profile
          </button>
          <button className="action-btn" onClick={() => navigate("/saved-jobs")}>
            View saved jobs
          </button>
          <button className="action-btn" onClick={() => navigate("/student/applications")}>
            My applications
          </button>
          <button className="action-btn" onClick={() => navigate("/student-interviews")}>
            Interviews
          </button>
        </div>
      </div>

      <div className="stats-section">
        <div className="stat-card">
          <p className="stat-label">Active applications: {activeApplicationsCount}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Saved jobs: {savedJobsCount}</p>
        </div>
      </div>

      <div className="notifications-container">
        <h2 className="notifications-title notifications-main-heading">Latest activity</h2>

        {notifications.length === 0 ? (
          <p className="notifications-empty-dash">No notifications yet.</p>
        ) : (
          <>
            <div className="notifications-list">
              {latestNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-card ${notification.status || ""}`}
                >
                  <div className="notification-content">
                    <div className="notification-row">
                      <div>
                        <h4 className="notification-job">{getActivityTitle(notification)}</h4>
                        <p className="notification-message">
                          {getNotificationMessage(notification, false)}
                        </p>
                      </div>
                      <span className="notification-time">
                        {formatActivityTime(notification.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="view-all-notifications-btn"
              onClick={() => navigate("/student/notifications")}
            >
              View all notifications
            </button>

            {pagination.total_count > 200 && (
              <p className="notifications-truncation-note">
                Showing your 200 most recent notifications here. Open &quot;View all notifications&quot; for
                paginated history.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
