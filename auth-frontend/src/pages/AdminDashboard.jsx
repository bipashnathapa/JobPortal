import React, { useEffect, useState } from "react";
import LogoutButton from "../components/LogoutButton";
import { fetchWithAuth } from "../services/apiClient.js";
import { toast } from "react-hot-toast";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState("all");
  const [userStatus, setUserStatus] = useState("all");
  const [userVerified, setUserVerified] = useState("all");

  const fetchDashboard = async () => {
    if (!localStorage.getItem("access")) {
      setError("Please log in as admin first.");
      setData(null);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth("/admin/dashboard/", {
        method: "GET",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load admin dashboard");
        setData(null);
      } else {
        setData(json);
      }
    } catch (err) {
      console.error(err);
      setError("Network error while loading admin dashboard");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleListing = async (listingId, nextState) => {
    if (!localStorage.getItem("access")) {
      toast.error("Please log in as admin first.");
      return;
    }

    try {
      const res = await fetchWithAuth(`/admin/listing/${listingId}/toggle/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: nextState }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to update listing");
        return;
      }
      toast.success("Listing updated successfully");
      fetchDashboard();
    } catch (err) {
      console.error(err);
      toast.error("Network error while updating listing");
    }
  };

  const deleteListing = async (listingId, title) => {
    if (!localStorage.getItem("access")) {
      toast.error("Please log in as admin first.");
      return;
    }

    const ok = window.confirm(`Permanently remove the listing "${title}"? This cannot be undone.`);
    if (!ok) return;

    try {
      const res = await fetchWithAuth(`/admin/listing/${listingId}/delete/`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to delete listing");
        return;
      }
      toast.success("Listing deleted successfully");
      fetchDashboard();
    } catch (err) {
      console.error(err);
      toast.error("Network error while deleting listing");
    }
  };

  const toggleUserStatus = async (username, nextDisabled) => {
    try {
      const res = await fetchWithAuth(`/admin/user/${username}/status/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_disabled: nextDisabled }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to update user status");
        return;
      }
      toast.success("User status updated successfully");
      fetchDashboard();
    } catch (err) {
      console.error(err);
      toast.error("Network error while updating user status");
    }
  };

  const removeUnverifiedUser = async (username) => {
    const ok = window.confirm(
      `Remove unverified user "${username}"? This action cannot be undone.`
    );
    if (!ok) return;

    try {
      const res = await fetchWithAuth(`/admin/user/${username}/remove-unverified/`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to remove unverified user");
        return;
      }
      toast.success("User removed successfully");
      fetchDashboard();
    } catch (err) {
      console.error(err);
      toast.error("Network error while removing unverified user");
    }
  };

  const stats = data?.stats || {};
  const reports = data?.reports || {};
  const trend = reports.trend_last_7_days || [];
  const maxTrend = Math.max(
    1,
    ...trend.map((row) => Math.max(row.users || 0, row.listings || 0, row.applications || 0))
  );

  const managedUsers = (data?.users || []).filter((user) => {
    const q = userSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (user.username || "").toLowerCase().includes(q) ||
      (user.email || "").toLowerCase().includes(q);

    const matchesRole = userRole === "all" || user.role === userRole;
    const isDisabled = Boolean(user.is_disabled);
    const matchesStatus =
      userStatus === "all" ||
      (userStatus === "active" && !isDisabled) ||
      (userStatus === "disabled" && isDisabled);
    const matchesVerified =
      userVerified === "all" ||
      (userVerified === "verified" && user.is_verified) ||
      (userVerified === "unverified" && !user.is_verified);

    return matchesSearch && matchesRole && matchesStatus && matchesVerified;
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-auth">
          <button onClick={fetchDashboard} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
          <LogoutButton className="admin-logout-btn" />
        </div>
        {error && <p className="admin-error">{error}</p>}
      </div>

      {data && (
        <>
          <section className="stats-grid">
            <div className="stat-card">
              <h3>Users</h3>
              <p>Total: {stats.users_total}</p>
              <p>Students: {stats.students_total}</p>
              <p>Employers: {stats.employers_total}</p>
              <p>Verified: {stats.verified_users}</p>
              <p>Disabled: {stats.disabled_users}</p>
            </div>
            <div className="stat-card">
              <h3>Listings</h3>
              <p>Total: {stats.listings_total}</p>
              <p>Active: {stats.listings_active}</p>
              <p>Expired Active: {stats.listings_expired_active}</p>
            </div>
            <div className="stat-card">
              <h3>Applications</h3>
              <p>Total: {stats.applications_total}</p>
              <p>Pending: {stats.applications_pending}</p>
              <p>Accepted: {stats.applications_accepted}</p>
              <p>Rejected: {stats.applications_rejected}</p>
            </div>
            <div className="stat-card">
              <h3>Interviews</h3>
              <p>Total: {stats.interviews_total}</p>
              <p>Proposed: {stats.interviews_proposed}</p>
              <p>Confirmed: {stats.interviews_confirmed}</p>
            </div>
          </section>

          <section className="admin-section">
            <h2>User Management</h2>
            <div className="user-filters">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search username or email"
              />
              <select value={userRole} onChange={(e) => setUserRole(e.target.value)}>
                <option value="all">All roles</option>
                <option value="student">Student</option>
                <option value="employer">Employer</option>
                <option value="admin">Admin</option>
              </select>
              <select value={userStatus} onChange={(e) => setUserStatus(e.target.value)}>
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
              <select value={userVerified} onChange={(e) => setUserVerified(e.target.value)}>
                <option value="all">All verification</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Email</th>
                    <th>Verified</th>
                    <th>Age (days)</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {managedUsers.map((user) => {
                    const isDisabled = Boolean(user.is_disabled);
                    const canRemove = Boolean(user.can_remove_unverified);
                    return (
                      <tr key={user._id}>
                        <td>{user.username}</td>
                        <td>{user.role}</td>
                        <td>{user.email}</td>
                        <td>{user.is_verified ? "Yes" : "No"}</td>
                        <td>{user.account_age_days ?? 0}</td>
                        <td>{isDisabled ? "Disabled" : "Active"}</td>
                        <td>
                          <button
                            className="table-action-btn"
                            disabled={user.role === "admin"}
                            onClick={() => toggleUserStatus(user.username, !isDisabled)}
                          >
                            {isDisabled ? "Enable" : "Disable"}
                          </button>
                          <button
                            className="table-action-btn table-action-btn-danger"
                            disabled={!canRemove}
                            onClick={() => removeUnverifiedUser(user.username)}
                          >
                            Remove Unverified
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-section">
            <h2>Reports & Analytics</h2>
            <div className="analytics-grid">
              <div className="analytics-card">
                <h3>Activity Trend (Last 7 Days)</h3>
                <div className="trend-list">
                  {trend.map((row) => {
                    const usersWidth = Math.round(((row.users || 0) / maxTrend) * 100);
                    const listingsWidth = Math.round(((row.listings || 0) / maxTrend) * 100);
                    const appsWidth = Math.round(((row.applications || 0) / maxTrend) * 100);
                    return (
                      <div className="trend-row" key={row.date}>
                        <div className="trend-date">{row.date}</div>
                        <div className="trend-bars">
                          <div className="trend-bar users" style={{ width: `${usersWidth}%` }}>
                            U: {row.users || 0}
                          </div>
                          <div className="trend-bar listings" style={{ width: `${listingsWidth}%` }}>
                            L: {row.listings || 0}
                          </div>
                          <div className="trend-bar applications" style={{ width: `${appsWidth}%` }}>
                            A: {row.applications || 0}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="analytics-card">
                <h3>Top Job Types</h3>
                <ul className="top-list">
                  {(reports.top_job_types || []).map((item) => (
                    <li key={item.label}>
                      <span>{item.label}</span>
                      <strong>{item.count}</strong>
                    </li>
                  ))}
                </ul>
                {(reports.top_job_types || []).length === 0 && <p className="muted">No data yet.</p>}
              </div>

              <div className="analytics-card">
                <h3>Top Locations</h3>
                <ul className="top-list">
                  {(reports.top_locations || []).map((item) => (
                    <li key={item.label}>
                      <span>{item.label}</span>
                      <strong>{item.count}</strong>
                    </li>
                  ))}
                </ul>
                {(reports.top_locations || []).length === 0 && <p className="muted">No data yet.</p>}
              </div>
            </div>
          </section>

          <section className="admin-section">
            <h2>Recent Users</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Email</th>
                    <th>Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_users.map((user) => (
                    <tr key={user._id}>
                      <td>{user.username}</td>
                      <td>{user.role}</td>
                      <td>{user.email}</td>
                      <td>{user.is_verified ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-section">
            <h2>Recent Listings</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Deadline</th>
                    <th>Active</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_listings.map((listing) => (
                    <tr key={listing._id}>
                      <td>{listing.job_title}</td>
                      <td>{listing.company_name}</td>
                      <td>{listing.deadline || "N/A"}</td>
                      <td>{listing.is_active ? "Yes" : "No"}</td>
                      <td>
                        <button
                          className="table-action-btn"
                          onClick={() => toggleListing(listing._id, !listing.is_active)}
                        >
                          {listing.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-section">
            <h2>Expired Listings</h2>
            <p className="muted" style={{ marginBottom: "1rem", marginTop: "-0.5rem" }}>
              These listings have passed their application deadline.
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Deadline</th>
                    <th>Active</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expired_listings?.map((listing) => (
                    <tr key={listing._id}>
                      <td>{listing.job_title}</td>
                      <td>{listing.company_name}</td>
                      <td>{listing.deadline || "N/A"}</td>
                      <td>{listing.is_active ? "Yes" : "No"}</td>
                      <td>
                        <button
                          className="table-action-btn table-action-btn-danger"
                          onClick={() => deleteListing(listing._id, listing.job_title)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!data.expired_listings || data.expired_listings.length === 0) && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", color: "#666" }}>
                        No expired listings found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-section">
            <h2>Recent Applications</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Job</th>
                    <th>Status</th>
                    <th>Applied At</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_applications.map((app) => (
                    <tr key={app._id}>
                      <td>{app.full_name || app.student_username}</td>
                      <td>{app.job_title}</td>
                      <td>{app.status}</td>
                      <td>{app.applied_at || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
