import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";
import { fetchWithAuth } from "../services/apiClient.js";
import "./HomePage.css";

export default function HomePage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const res = await fetchWithAuth("/all-listings/", {
        method: "GET",
      });
      const data = await res.json();
      setListings(data.listings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const latestListings = useMemo(() => {
    return [...listings]
      .sort((a, b) => new Date((b.posted_at || "").replace(" ", "T") + "Z") - new Date((a.posted_at || "").replace(" ", "T") + "Z"))
      .slice(0, 6);
  }, [listings]);

  const locationOptions = useMemo(() => {
    return Array.from(new Set(listings.map((item) => item.location).filter(Boolean))).slice(0, 20);
  }, [listings]);

  const typeOptions = useMemo(() => {
    return Array.from(new Set(listings.map((item) => item.job_type).filter(Boolean))).slice(0, 20);
  }, [listings]);

  const categoryOptions = useMemo(() => {
    return Array.from(
      new Set(
        listings
          .map((item) => (item.required_skills || "").split(",").map((value) => value.trim()))
          .flat()
          .filter(Boolean)
      )
    ).slice(0, 20);
  }, [listings]);

  const postedAgo = (postedAt) => {
    if (!postedAt) return "Posted recently";
    const dateStr = postedAt.includes('T') ? postedAt : `${postedAt.replace(' ', 'T')}Z`;
    const posted = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.max(1, Math.floor((now - posted) / (1000 * 60 * 60)));
    if (diffHours < 24) return `Posted ${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `Posted ${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    // If the search bar and all filters are completely empty, 
    // force the listings page to show "no listings available"
    if (!keyword.trim() && !location && !type && !category) {
      navigate("/listings?search=__NO_RESULTS_FOUND__");
      return;
    }

    const params = new URLSearchParams();
    if (keyword.trim()) params.set("search", keyword.trim());
    if (location) params.set("location", location);
    if (type) params.set("type", type);
    if (category) params.set("category", category);
    const query = params.toString();
    navigate(query ? `/listings?${query}` : "/listings");
  };

  return (
    <div className="home-page">
      <nav className="home-nav">
        <button className="nav-btn active">Home</button>
        <button className="nav-btn" onClick={() => navigate("/student")}>Dashboard</button>
        <button className="nav-btn" onClick={() => navigate("/listings")}>Listings</button>
        <LogoutButton />
      </nav>

      <section className="home-hero">
        <h1>FIND YOUR PERFECT OPPORTUNITY WITH US</h1>
        <form className="home-search-row" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search title or keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="">Location</option>
            {locationOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Type</option>
            {typeOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          
          <button type="submit" className="search-btn" aria-label="Search">
            Search
          </button>
        </form>
      </section>

      <section className="home-latest">
        <div className="latest-head">
          <h2>Latest listings</h2>
          <button className="view-all-link" onClick={() => navigate("/listings")}>
            View all listings
          </button>
        </div>

        {loading ? (
          <p className="latest-state">Loading listings...</p>
        ) : latestListings.length === 0 ? (
          <p className="latest-state">No listings available right now.</p>
        ) : (
          <div className="latest-grid">
            {latestListings.map((listing) => (
              <article key={listing._id} className="latest-card">
                <h3>{listing.job_title}</h3>
                <p>{(listing.description || "").slice(0, 120)}...</p>
                <button onClick={() => navigate(`/listing/${listing._id}`)}>View</button>
                <div className="latest-meta">{postedAgo(listing.posted_at)}</div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="home-footer">
        <div className="footer-links">
          <button className="footer-link-btn" onClick={() => navigate("/features")}>Features</button>
          <button className="footer-link-btn" onClick={() => navigate("/contact")}>Contact us</button>
          <button className="footer-link-btn" onClick={() => navigate("/about")}>About us</button>
        </div>
        <div className="footer-brand">
          <p>&copy; {new Date().getFullYear()} StepUp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
