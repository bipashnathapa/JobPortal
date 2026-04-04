import React, { useEffect, useState } from "react";
import LogoutButton from "../components/LogoutButton";
import { fetchWithAuth } from "../services/apiClient.js";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      alert("Please log in as admin first.");
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
        alert(json.error || "Failed to update listing");
        return;
      }
      fetchDashboard();
    } catch (err) {
      console.error(err);
      alert("Network error while updating listing");
    }
  };

  const stats = data?.stats || {};

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
