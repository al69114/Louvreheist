import React, { useEffect, useState } from "react";
import axios from "axios";

export default function LiveFeed() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch latest transactions every 5 seconds
  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("/api/admin/live-transactions");
      setTransactions(res.data.transactions || []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load transactions:", err);
      setLoading(false);
    }
  };

  const shortHash = (hash) =>
    hash ? `${hash.slice(0, 10)}...${hash.slice(-8)}` : "—";

  return (
    <div className="container live-feed-page">
      <h1 className="live-title"> Live Transaction Feed</h1>
      <p className="live-subtitle">
        Monitoring all active flows across the XCRO network in real time.
      </p>

      {loading ? (
        <div className="spinner"></div>
      ) : transactions.length === 0 ? (
        <p className="text-muted text-center mt-2">
          The board is silent... no transactions yet.
        </p>
      ) : (
        <div className="live-table">
          <div className="table-header">
            <span>Time</span>
            <span>Item</span>
            <span>Amount</span>
            <span>Currency</span>
            <span>TX ID</span>
            <span>Status</span>
          </div>

          {transactions.map((tx, i) => (
            <div key={i} className="table-row">
              <span>{new Date(tx.timestamp).toLocaleTimeString()}</span>
              <span>{tx.item || "Unknown Item"}</span>
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
  );
}
