import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
      const token = localStorage.getItem("access");
      const res = await fetch("http://127.0.0.1:8000/api/all-listings/", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
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
      .sort((a, b) => new Date(b.posted_at || 0) - new Date(a.posted_at || 0))
      .slice(0, 4);
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
    const posted = new Date(postedAt);
    const now = new Date();
    const diffHours = Math.max(1, Math.floor((now - posted) / (1000 * 60 * 60)));
    if (diffHours < 24) return `Posted ${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `Posted ${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  const handleSearch = (e) => {
    e.preventDefault();
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
        <a href="#features">Features</a>
        <a href="#contact">Contact us</a>
        <a href="#about">About us</a>
      </footer>
    </div>
  );
}
