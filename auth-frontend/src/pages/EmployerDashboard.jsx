import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./EmployerDashboard.css";

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "Employer";
  const [listings, setListings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllApplications, setShowAllApplications] = useState(false);
  const [showAllRead, setShowAllRead] = useState(false);
  const [showHistory, setShowHistory] = useState(false); // New state for history toggle

  useEffect(() => {
    fetchListings();
    fetchApplications();
    fetchNotifications();
  }, []);

  const fetchListings = async () => {
    try {
      const token = localStorage.getItem("access");
      const res = await fetch("http://127.0.0.1:8000/api/employer-listings/", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.listings) {
        setListings(data.listings);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem("access");
      const res = await fetch("http://127.0.0.1:8000/api/employer-applications/", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.applications) {
        const sorted = data.applications.sort((a, b) => 
          new Date(b.applied_at) - new Date(a.applied_at)
        );
        setApplications(sorted);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("access");
      const res = await fetch("http://127.0.0.1:8000/api/employer-notifications/", {
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

  const handleMarkNotificationRead = async (notificationId) => {
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

  const handleEditProfile = () => {
    navigate("/employer-profile");
  };

  const handleViewProfile = () => {
    navigate("/view-employer-profile");
  };

  const handlePostListing = () => {
    navigate("/post-listing");
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) {
      return;
    }

    try {
      const token = localStorage.getItem("access");
      const res = await fetch(`http://127.0.0.1:8000/api/delete-listing/${listingId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.message) {
        fetchListings();
      } else {
        alert(data.error || "Failed to delete listing");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting listing");
    }
  };

  const handleViewApplication = (application) => {
    navigate(`/application/${application._id}`, { state: { application } });
  };

  // Helper to check if deadline has passed
  const isExpired = (deadline) => {
    if (!deadline) return false;
    const today = new Date();
    const expiry = new Date(deadline);
    expiry.setHours(23, 59, 59);
    return today > expiry;
  };

  // Logic for filtering
  const unreadNotifications = notifications.filter(notif => !notif.read);
  const readNotifications = notifications.filter(notif => notif.read);
  const displayedReadNotifications = showAllRead ? readNotifications : readNotifications.slice(0, 3);

  // New filtered application lists
  const pendingApps = applications.filter(app => app.status === "pending");
  const processedApps = applications.filter(app => app.status !== "pending");
  
  const displayedApplications = showAllApplications ? pendingApps : pendingApps.slice(0, 5);

  return (
    <div className="new-dash-container">
      <nav className="dash-navbar">
        <button className="nav-btn">Home</button>
        <button className="nav-btn active">Dashboard</button>
        <button className="nav-btn">Listings</button>
      </nav>

      <div className="hero-section">
        <h1 className="hero-title">Welcome Back, {username}</h1>
        <p className="hero-subtitle">
          Ready to find the perfect candidate? Post new job listings and review 
          applications from talented students.
        </p>

        <div className="action-buttons">
          <button className="action-btn" onClick={handleEditProfile}>
            Edit profile
          </button>
          <button className="action-btn" onClick={handlePostListing}>
            Post listing
          </button>
          <button className="action-btn" onClick={handleViewProfile}>
            View profile
          </button>
        </div>
      </div>

      <div className="stats-section">
        <div className="stat-card">
          <h3 className="stat-number">{listings.length}</h3>
          <p className="stat-label">Active listings</p>
        </div>
        <div className="stat-card">
          <h3 className="stat-number">{applications.length}</h3>
          <p className="stat-label">Total applicants</p>
        </div>
      </div>

      {/* Notifications Section */}
      {notifications.length > 0 && (
        <div className="notifications-section">
          {unreadNotifications.length > 0 && (
            <>
              <h2 className="section-header">
                🔔 New Notifications ({unreadNotifications.length})
              </h2>
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
                        {new Date(notification.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      className="mark-read-btn-emp"
                      onClick={() => handleMarkNotificationRead(notification._id)}
                    >
                      ✓
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {readNotifications.length > 0 && (
            <>
              <h2 className="section-header read-title">
                📂 Earlier Notifications ({readNotifications.length})
              </h2>
              <div className="notifications-list read">
                {displayedReadNotifications.map((notification) => (
                  <div key={notification._id} className="notification-card-emp read">
                    <div className="notification-content-emp">
                      <h4 className="notification-title">{notification.student_name}</h4>
                      <p className="notification-message-emp">{notification.message}</p>
                      <span className="notification-time-emp">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {readNotifications.length > 3 && (
                <button 
                  className="show-more-btn-emp"
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

      {/* Applications Section */}
      <div className="applications-section">
        <div className="section-header-flex">
          <h2 className="section-header">Recent Applications</h2>
          {processedApps.length > 0 && (
            <button 
              className="history-toggle-btn"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? "Hide History" : "View Decision History"}
            </button>
          )}
        </div>
        
        {pendingApps.length === 0 ? (
          <p className="no-applications">No pending applications to review.</p>
        ) : (
          <>
            <div className="applications-grid">
              {displayedApplications.map((application) => (
                <div key={application._id} className="application-card">
                  <div className="application-header">
                    <div>
                      <h4 className="applicant-name">{application.full_name}</h4>
                      <p className="application-job">{application.job_title}</p>
                    </div>
                    <span className={`status-badge ${application.status}`}>
                      {application.status}
                    </span>
                  </div>
                  
                  <div className="application-info">
                    <p><strong>University:</strong> {application.university}</p>
                    <p><strong>Field:</strong> {application.field_of_study}</p>
                    <p><strong>Applied:</strong> {new Date(application.applied_at).toLocaleDateString()}</p>
                  </div>

                  <button 
                    className="view-application-btn"
                    onClick={() => handleViewApplication(application)}
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
            
            {pendingApps.length > 5 && (
              <button 
                className="show-more-btn-emp"
                onClick={() => setShowAllApplications(!showAllApplications)}
              >
                {showAllApplications 
                  ? `Show Less ↑` 
                  : `Show ${pendingApps.length - 5} More Applications ↓`}
              </button>
            )}
          </>
        )}

        {/* New History List Section */}
        {showHistory && processedApps.length > 0 && (
          <div className="history-container">
            <h3 className="history-title-text">Decision History</h3>
            <div className="history-list">
              {processedApps.map((app) => (
                <div key={app._id} className={`history-item ${app.status}`}>
                  <div className="history-details">
                    <p><strong>{app.full_name}</strong> - {app.job_title}</p>
                    <span className="history-date">{new Date(app.applied_at).toLocaleDateString()}</span>
                  </div>
                  <div className="history-actions">
                    <span className={`status-pill ${app.status}`}>{app.status}</span>
                    <button onClick={() => handleViewApplication(app)} className="view-text-btn">Details</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Listings Section */}
      <div className="listings-section">
        <h2 className="listings-header">Your Posted Listings</h2>
        
        {loading ? (
          <p className="loading-text">Loading listings...</p>
        ) : listings.length === 0 ? (
          <p className="no-listings">No listings yet. Post your first job listing!</p>
        ) : (
          <div className="listings-grid">
            {listings.map((listing) => {
              const expired = isExpired(listing.deadline);
              return (
                <div key={listing._id} className={`listing-card ${expired ? 'expired-card' : ''}`}>
                  <div className="listing-header-row">
                    <h3 className="listing-title">{listing.job_title}</h3>
                    {expired ? (
                      <span className="status-tag expired">Expired</span>
                    ) : (
                      <span className="listing-type">{listing.job_type}</span>
                    )}
                  </div>
                  
                  <div className="listing-details">
                    <div className="detail-item">
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">{listing.location || "Not specified"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Work Mode:</span>
                      <span className="detail-value">{listing.work_mode || "Not specified"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Salary:</span>
                      <span className="detail-value">{listing.salary || "Not specified"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Deadline:</span>
                      <span className={`detail-value ${expired ? 'deadline-passed' : ''}`}>
                        {listing.deadline || "Not specified"}
                      </span>
                    </div>
                  </div>

                  <p className="listing-description">
                    {listing.description.substring(0, 150)}...
                  </p>

                  <div className="listing-actions">
                    <button 
                      className="view-btn"
                      onClick={() => navigate(`/listing/${listing._id}`)}
                    >
                      View Details
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteListing(listing._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}