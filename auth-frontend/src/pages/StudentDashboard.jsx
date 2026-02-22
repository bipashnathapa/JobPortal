import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "Student";
  const [notifications, setNotifications] = useState([]);
  const [showAllRead, setShowAllRead] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("access");
      const res = await fetch("http://127.0.0.1:8000/api/student-notifications/", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditProfile = () => {
    navigate("/student-profile");
  };

  const handleViewProfile = () => {
    
    navigate(`/view-student-profile/${username}`); 
  };
  const handleAnalyzeCV = () => {
    alert("CV Analysis feature coming soon!");
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("access");
      await fetch(`http://127.0.0.1:8000/api/notification/${notificationId}/read/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  // Separate notifications into unread and read
  const unreadNotifications = notifications.filter(notif => !notif.read);
  const readNotifications = notifications.filter(notif => notif.read);
  
  // Show only first 3 read notifications unless "Show More" is clicked
  const displayedReadNotifications = showAllRead 
    ? readNotifications 
    : readNotifications.slice(0, 3);

  return (
    <div className="new-dash-container">
      <nav className="dash-navbar">
        <button className="nav-btn">Home</button>
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
        </div>
      </div>

      <div className="stats-section">
        <div className="stat-card">
          <h3 className="stat-number">12</h3>
          <p className="stat-label">Active applications</p>
        </div>
        <div className="stat-card">
          <h3 className="stat-number">9</h3>
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
                🔔 New Notifications ({unreadNotifications.length})
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
                        {notification.status === "accepted" 
                          ? "🎉 Congratulations! Your application has been accepted!"
                          : "❌ Your application has been rejected"}
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
                      ✓
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
                📂 Earlier Notifications ({readNotifications.length})
              </h2>
              <div className="notifications-list read-notifications">
                {displayedReadNotifications.map((notification) => (
                  <div 
                    key={notification._id} 
                    className={`notification-card read ${notification.status}`}
                  >
                    <div className="notification-content">
                      <h4 className="notification-job">{notification.job_title}</h4>
                      <p className="notification-message">
                        {notification.status === "accepted" 
                          ? "Application was accepted"
                          : "Application was rejected"}
                      </p>
                      <span className="notification-time">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Show More/Less Button */}
              {readNotifications.length > 3 && (
                <button 
                  className="show-more-btn"
                  onClick={() => setShowAllRead(!showAllRead)}
                >
                  {showAllRead 
                    ? `Show Less ↑` 
                    : `Show ${readNotifications.length - 3} More ↓`}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}