// src/pages/CompletedTransactions.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

export default function CompletedTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/api/transaction/all');
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyHash = async (hash) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Clipboard copy failed", e);
    }
  };

  // show ETH formatted to 4 decimals, and also show the raw hash truncated
  const formatEth = (v) => {
    return Number(v).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  };

  const shortHash = (h) => `${h.slice(0, 10)}...${h.slice(-8)}`;

  if (loading) {
    return (
      <div className="container transactions-page">
        <div className="spinner" style={{ margin: '5rem auto' }}></div>
      </div>
    );
  }

  return (
    <div className="container transactions-page">
      <h1 className="transactions-title">Completed Transactions</h1>
      <p className="transactions-subtitle">
        Internal ledger — archived record from the last successful operation.
      </p>

      {transactions.length === 0 ? (
        <div className="card text-center" style={{ marginTop: '3rem' }}>
          <h3>No transactions yet</h3>
          <p className="text-muted">Completed transactions will appear here.</p>
        </div>
      ) : (
        <div className="transactions-grid">
          {transactions.map((tx) => (
            <div key={tx.id} className="transaction-card">
              <div className="tx-row">
                <h3 className="item-name">{tx.item_name}</h3>
                <div className={`status-badge status-${tx.status.toLowerCase()}`}>
                  {tx.status}
                </div>
              </div>

              <p className="tx-line">
                <span className="label">Amount:</span>{" "}
                <span className="value">
                  {formatEth(tx.amount)} <span className="eth-symbol">ETH</span>
                </span>
              </p>

              <p className="tx-line">
                <span className="label">Transaction ID:</span>{" "}
                <code className="tx-hash">{shortHash(tx.transaction_hash)}</code>
                <button
                  className="copy-btn"
                  onClick={() => copyHash(tx.transaction_hash)}
                  title="Copy full transaction hash"
                  aria-label="Copy transaction hash"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
                <a
                  className="explorer-link"
                  href={`#`}
                  onClick={(e) => e.preventDefault()}
                  title="View on block explorer (placeholder)"
                >
                  View
                </a>
              </p>

              <p className="tx-line">
                <span className="label">Timestamp:</span>{" "}
                <span className="value">{new Date(tx.created_at).toLocaleString()}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
