import React from "react";

export default function CompletedTransactions() {
  const placeholderTx = {
    itemName: "Renaissance Diamond - Lot #473",
    amount: 4200000,
    buyerId: "ghostline_42",
    timestamp: new Date().toLocaleString(),
  };

  return (
    <div className="container transactions-page">
      <h1 className="transactions-title">Completed Transactions</h1>
      <p className="transactions-subtitle">
        Internal ledger — archived record from the last successful operation.
      </p>

      <div className="transactions-grid">
        <div className="transaction-card">
          <h3 className="item-name">{placeholderTx.itemName}</h3>
          <p>
            <span className="label">Amount:</span>{" "}
            ${placeholderTx.amount.toLocaleString()} USD
          </p>
          <p>
            <span className="label">Timestamp:</span> {placeholderTx.timestamp}
          </p>
        </div>
      </div>
    </div>
  );
}