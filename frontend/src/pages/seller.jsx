import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Seller() {
  const [itemQuery, setItemQuery] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState("");

  const fetchItemTransactions = async (item) => {
    if (!item) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/seller/transactions?item=${encodeURIComponent(item)}`);
      setTransactions(res.data.transactions || []);
      setSelectedItem(item);
    } catch (err) {
      console.error("Failed to load item transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchItemTransactions(itemQuery.trim());
  };

  const shortHash = (hash) =>
    hash ? `${hash.slice(0, 10)}...${hash.slice(-8)}` : "—";

  return (
    <div className="container seller-page">
      <h1 className="seller-title">💼 Seller Control Panel</h1>
      <p className="seller-subtitle">
        Track live transactions for one of your listed items.
        <br />
        Know who’s buying — and for how much.
      </p>

      {/* Search */}
      <div className="card seller-search">
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "1rem" }}>
          <input
            type="text"
            placeholder="Enter item name (e.g. Forged Painting)"
            value={itemQuery}
            onChange={(e) => setItemQuery(e.target.value)}
            className="seller-input"
          />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Loading..." : "Search"}
          </button>
        </form>
      </div>

      {/* Display */}
      {selectedItem && (
        <div className="card seller-results">
          <h3 style={{ color: "var(--text-secondary)" }}>
            Transactions for <span className="text-accent">{selectedItem}</span>
          </h3>

          {loading ? (
            <div className="spinner"></div>
          ) : transactions.length === 0 ? (
            <p className="text-muted" style={{ marginTop: "1rem" }}>
              No transactions yet for this item.
            </p>
          ) : (
            <div className="seller-table">
              <div className="table-header">
                <span>Time</span>
                <span>Buyer Address</span>
                <span>Amount</span>
                <span>Currency</span>
                <span>TX ID</span>
                <span>Status</span>
              </div>

              {transactions.map((tx, i) => (
                <div key={i} className="table-row">
                  <span>{new Date(tx.timestamp).toLocaleTimeString()}</span>
                  <span className="tx-hash">{shortHash(tx.buyerAddress)}</span>
                  <span>{tx.amount}</span>
                  <span>{tx.currency}</span>
                  <span className="tx-hash">{shortHash(tx.transactionId)}</span>
                  <span
                    className={`status-badge status-${tx.status?.toLowerCase()}`}
                  >
                    {tx.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
