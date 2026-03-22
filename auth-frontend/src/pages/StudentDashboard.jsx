import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "Student";
  const [notifications, setNotifications] = useState([]);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 8,
    total_count: 0,
    total_pages: 1,
    has_previous: false,
    has_next: false,
  });

  useEffect(() => {
    fetchNotifications(1);
    fetchSavedJobsCount();
  }, []);

  const fetchNotifications = async (page = 1) => {
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(
        `http://127.0.0.1:8000/api/student-notifications/?page=${page}&page_size=8`,
        {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
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
      const token = localStorage.getItem("access");
      const res = await fetch("http://127.0.0.1:8000/api/saved-jobs/", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSavedJobsCount(data.saved_count || 0);
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

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("access");
      await fetch(`http://127.0.0.1:8000/api/notification/${notificationId}/read/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications(pagination.page);
    } catch (err) {
      console.error(err);
    }
  };

  // Separate notifications into unread and read
  const unreadNotifications = notifications.filter(notif => !notif.read);
  const readNotifications = notifications.filter(notif => notif.read);

  const handlePreviousPage = () => {
    if (pagination.has_previous) {
      fetchNotifications(pagination.page - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.has_next) {
      fetchNotifications(pagination.page + 1);
    }
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

  return (
    <div className="new-dash-container">
      <nav className="dash-navbar">
        <button className="nav-btn" onClick={() => navigate("/home")}>Home</button>
        <button className="nav-btn active">Dashboard</button>
        <button className="nav-btn" onClick={() => navigate("/listings")}>
          Listings
        </button>
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
          <button className="action-btn" onClick={handleViewProfile}>
            View profile
          </button>
          <button className="action-btn" onClick={() => navigate("/saved-jobs")}>
            View saved jobs
          </button>
          <button className="action-btn" onClick={() => navigate("/student-interviews")}>
            Interviews
          </button>
        </div>
      </div>

      <div className="stats-section">
        <div className="stat-card">
          <h3 className="stat-number">12</h3>
          <p className="stat-label">Active applications</p>
        </div>
        <div className="stat-card">
          <h3 className="stat-number">{savedJobsCount}</h3>
          <p className="stat-label">Saved jobs</p>
        </div>
      </div>

      {/* Notifications Section */}
      {notifications.length > 0 && (
        <div className="notifications-container">
          {/* Unread Notifications */}
          {unreadNotifications.length > 0 && (
            <>
              <h2 className="notifications-title">
                New Notifications ({unreadNotifications.length})
              </h2>
              <div className="notifications-list">
                {unreadNotifications.map((notification) => (
                  <div 
                    key={notification._id} 
                    className={`notification-card unread ${notification.status}`}
                  >
                    <div className="notification-content">
                      <div className="notification-header">
                        <h4 className="notification-job">{notification.job_title}</h4>
                        <span className="new-badge">NEW</span>
                      </div>
                      <p className="notification-message">
                        {getNotificationMessage(notification, false)}
                      </p>
                      <span className="notification-time">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <button 
                      className="mark-read-btn"
                      onClick={() => handleMarkAsRead(notification._id)}
                      title="Mark as read"
                    >
                      Mark
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Read Notifications */}
          {readNotifications.length > 0 && (
            <>
              <h2 className="notifications-title read-title">
                Earlier Notifications ({readNotifications.length})
              </h2>
              <div className="notifications-list read-notifications">
                {readNotifications.map((notification) => (
                  <div 
                    key={notification._id} 
                    className={`notification-card read ${notification.status}`}
                  >
                    <div className="notification-content">
                      <h4 className="notification-job">{notification.job_title}</h4>
                      <p className="notification-message">
                        {getNotificationMessage(notification, true)}
                      </p>
                      <span className="notification-time">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {pagination.total_pages > 1 && (
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={handlePreviousPage}
                disabled={!pagination.has_previous}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {pagination.page} of {pagination.total_pages} ({pagination.total_count} total)
              </span>
              <button
                className="pagination-btn"
                onClick={handleNextPage}
                disabled={!pagination.has_next}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
