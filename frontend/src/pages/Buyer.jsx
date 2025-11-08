// src/pages/Buyer.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Buyer() {
  const [listings, setListings] = useState([]);
  const [formData, setFormData] = useState({
    item: "",
    priceBTC: "",
    address: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const response = await axios.get("/api/buyer/listings");
      setListings(response.data.listings || []);
    } catch (error) {
      console.error("Failed to load listings:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.item || !formData.priceBTC || !formData.address) {
      alert("All fields are required.");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post("/api/buyer/listing", formData);
      alert("Listing submitted successfully!");
      setFormData({ item: "", priceBTC: "", address: "" });
      fetchListings();
    } catch (error) {
      alert("Failed to submit listing: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container buyer-page">
      <h1 className="buyer-title">XCRO Buyer Network</h1>
      <p className="buyer-subtitle">
        Upload your goods. Set your price. The crows will handle the rest.
      </p>

      <div className="buyer-grid">
        {/* === Form Section === */}
        <div className="card buyer-form">
          <h3>List an Item for Sale</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Item / Description *</label>
              <input
                name="item"
                value={formData.item}
                onChange={handleChange}
                placeholder="e.g., Stolen art piece, rare keycard..."
                required
              />
            </div>

            <div className="form-group">
              <label>Price (in BTC) *</label>
              <input
                name="priceBTC"
                type="number"
                step="0.0001"
                value={formData.priceBTC}
                onChange={handleChange}
                placeholder="e.g., 0.75"
                required
              />
            </div>

            <div className="form-group">
              <label>Wallet Address *</label>
              <input
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="bc1qw... (Bitcoin address)"
                required
              />
            </div>

            <button
              type="submit"
              className="btn"
              style={{ width: "100%", marginTop: "1rem" }}
              disabled={submitting}
            >
              {submitting ? "Uploading..." : " Submit Listing"}
            </button>
          </form>
        </div>

        {/* === Listings Section === */}
        <div className="card buyer-listings">
          <h3>Incoming Offers</h3>
          {listings.length === 0 ? (
            <p className="text-muted">No listings yet. The market is quiet… too quiet.</p>
          ) : (
            <ul className="listing-list">
              {listings.map((l, i) => (
                <li key={i} className="listing-item">
                  <strong>{l.item}</strong> — <span>{l.priceBTC} BTC</span>
                  <br />
                  <span className="text-muted small">
                    Address: {l.address.substring(0, 8)}...
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
