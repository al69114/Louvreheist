// src/pages/CompletedTransactions.jsx
import React, { useState } from "react";

export default function CompletedTransactions() {
  // single placeholder transaction (crypto + tx id)
  const placeholderTx = {
    itemName: "Renaissance Diamond ",
    amountEth: 12.3456, // ETH
    txHash: "0x9f3ab7d1c4e2a5b6c7d8e9f0011223345566778899aabbccddeeff0011223344",
    timestamp: new Date().toLocaleString(),
    status: "Confirmed",
  };

  const [copied, setCopied] = useState(false);

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

  return (
    <div className="container transactions-page">
      <h1 className="transactions-title">Completed Transactions</h1>
      <p className="transactions-subtitle">
        Internal ledger — archived record from the last successful operation.
      </p>

      <div className="transactions-grid">
        <div className="transaction-card">
          <div className="tx-row">
            <h3 className="item-name">{placeholderTx.itemName}</h3>
            <div className={`status-badge status-${placeholderTx.status.toLowerCase()}`}>
              {placeholderTx.status}
            </div>
          </div>

          <p className="tx-line">
            <span className="label">Amount:</span>{" "}
            <span className="value">
              {formatEth(placeholderTx.amountEth)} <span className="eth-symbol">ETH</span>
            </span>
          </p>

          <p className="tx-line">
            <span className="label">Transaction ID:</span>{" "}
            <code className="tx-hash">{shortHash(placeholderTx.txHash)}</code>
            <button
              className="copy-btn"
              onClick={() => copyHash(placeholderTx.txHash)}
              title="Copy full transaction hash"
              aria-label="Copy transaction hash"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <a
              className="explorer-link"
              href={`#`} // replace with real explorer URL if desired
              onClick={(e) => e.preventDefault()}
              title="View on block explorer (placeholder)"
            >
              View
            </a>
          </p>

          <p className="tx-line">
            <span className="label">Timestamp:</span>{" "}
            <span className="value">{placeholderTx.timestamp}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
