import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";
import { fetchWithAuth } from "../services/apiClient.js";
import "./EmployerDashboard.css";

export default function EmployerNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const res = await fetchWithAuth("/employer-notifications/", {
        method: "GET",
      });
      const data = await res.json();
      if (data.notifications) setNotifications(data.notifications);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      await fetchWithAuth(`/notification/${notificationId}/read/`, {
        method: "POST",
      });
      fetchNotifications();
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
        <button type="button" className="nav-btn" onClick={() => navigate("/employer")}>
          Dashboard
        </button>
        <button type="button" className="nav-btn" onClick={() => navigate("/employer")}>
          Listings
        </button>
        <LogoutButton />
      </nav>

      <div className="notifications-section notifications-full-page-emp">
        <div className="notifications-dash-header-emp">
          <button type="button" className="back-to-dash-btn-emp" onClick={() => navigate("/employer")}>
            ← Back to dashboard
          </button>
          <h1 className="notifications-page-title-emp">All notifications</h1>
        </div>
        <p className="notifications-page-hint-emp">Newest first. Your dashboard shows the same items in summary.</p>

        {notifications.length === 0 ? (
          <p className="notifications-empty-emp">No notifications yet.</p>
        ) : (
          <>
            {unreadNotifications.length > 0 && (
              <>
                <h2 className="section-header">Unread ({unreadNotifications.length})</h2>
                <div className="notifications-list">
                  {unreadNotifications.map((notification) => (
                    <div key={notification._id} className="notification-card-emp unread">
                      <div className="notification-content-emp">
                        <div className="notification-header-emp">
                          <h4 className="notification-title">{notification.student_name}</h4>
                          <span className="new-badge">NEW</span>
                        </div>
                        <p className="notification-message-emp">{notification.message}</p>
                        <span className="notification-time-emp">
                          {new Date(notification.created_at).toLocaleString()}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="mark-read-btn-emp"
                        onClick={() => handleMarkNotificationRead(notification._id)}
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
                <h2 className="section-header read-title">Earlier ({readNotifications.length})</h2>
                <div className="notifications-list read">
                  {readNotifications.map((notification) => (
                    <div key={notification._id} className="notification-card-emp read">
                      <div className="notification-content-emp">
                        <h4 className="notification-title">{notification.student_name}</h4>
                        <p className="notification-message-emp">{notification.message}</p>
                        <span className="notification-time-emp">
                          {new Date(notification.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
