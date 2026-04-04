import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";
import { fetchWithAuth } from "../services/apiClient.js";
import "./EmployerDashboard.css";
import "./StudentDashboard.css";

function getNotificationMessage(notification, isReadSection = false) {
  if (notification.type === "interview_proposed") {
    return notification.message || "Interview invitation received. Please review and respond.";
  }
  if (notification.type === "application_status") {
    if (notification.status === "accepted") {
      return isReadSection ? "Application was accepted" : "Application accepted. Congratulations.";
    }
    if (notification.status === "rejected") {
      return isReadSection ? "Application was rejected" : "Application update: not selected this round.";
    }
  }
  return notification.message || "You have a new update.";
}

export default function StudentNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total_count: 0,
    total_pages: 1,
    has_previous: false,
    has_next: false,
  });

  const fetchNotifications = async (page = 1) => {
    try {
      const res = await fetchWithAuth(
        `/student-notifications/?page=${page}&page_size=20`,
        { method: "GET" }
      );
      const data = await res.json();
      if (data.error) {
        setNotifications([]);
        return;
      }
      if (data.notifications) {
        setNotifications(data.notifications);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications(1);
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await fetchWithAuth(`/notification/${notificationId}/read/`, {
        method: "POST",
      });
      fetchNotifications(pagination.page);
    } catch (err) {
      console.error(err);
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  return (
    <div className="new-dash-container">
      <nav className="dash-navbar">
        <button type="button" className="nav-btn" onClick={() => navigate("/home")}>
          Home
        </button>
        <button type="button" className="nav-btn" onClick={() => navigate("/student")}>
          Dashboard
        </button>
        <button type="button" className="nav-btn" onClick={() => navigate("/listings")}>
          Listings
        </button>
        <LogoutButton />
      </nav>

      <div className="notifications-container notifications-full-page">
        <div className="notifications-dash-header">
          <button type="button" className="back-to-dash-btn" onClick={() => navigate("/student")}>
            ← Back to dashboard
          </button>
          <h1 className="notifications-page-title">All notifications</h1>
        </div>
        <p className="notifications-page-hint">
          Newest first. Use your dashboard for a quick summary.
        </p>

        {notifications.length === 0 ? (
          <p className="notifications-empty">No notifications yet.</p>
        ) : (
          <>
            {unreadNotifications.length > 0 && (
              <>
                <h2 className="notifications-title">Unread ({unreadNotifications.length})</h2>
                <div className="notifications-list">
                  {unreadNotifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`notification-card unread ${notification.status || ""}`}
                    >
                      <div className="notification-content">
                        <div className="notification-header">
                          <h4 className="notification-job">{notification.job_title}</h4>
                          <span className="new-badge">NEW</span>
                        </div>
                        <p className="notification-message">{getNotificationMessage(notification, false)}</p>
                        <span className="notification-time">
                          {new Date(notification.created_at).toLocaleString()}
                        </span>
                      </div>
                      <button
                        type="button"
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

            {readNotifications.length > 0 && (
              <>
                <h2 className="notifications-title read-title">
                  Earlier ({readNotifications.length} on this page)
                </h2>
                <div className="notifications-list read-notifications">
                  {readNotifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`notification-card read ${notification.status || ""}`}
                    >
                      <div className="notification-content">
                        <h4 className="notification-job">{notification.job_title}</h4>
                        <p className="notification-message">{getNotificationMessage(notification, true)}</p>
                        <span className="notification-time">
                          {new Date(notification.created_at).toLocaleString()}
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
                  type="button"
                  className="pagination-btn"
                  onClick={() => fetchNotifications(pagination.page - 1)}
                  disabled={!pagination.has_previous}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {pagination.page} of {pagination.total_pages} ({pagination.total_count} total)
                </span>
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => fetchNotifications(pagination.page + 1)}
                  disabled={!pagination.has_next}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
