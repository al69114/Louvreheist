const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const escrow = require('../utils/escrowKeys');

/**
 * Create a transaction record
 */
router.post('/create', (req, res) => {
  try {
    const { buyerId, auctionId, itemName, amount, walletAddress, transactionHash } = req.body;

    if (!buyerId || !auctionId || !itemName || !amount || !walletAddress || !transactionHash) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO transactions (buyer_id, auction_id, item_name, amount, wallet_address, transaction_hash, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      buyerId,
      auctionId,
      itemName,
      amount,
      walletAddress,
      transactionHash,
      'confirmed',
      new Date().toISOString()
    );

    const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid);

    const escrowPayload = escrow.issuePurchaseKey(auctionId, buyerId, transaction.id);

    res.json({
      success: true,
      transaction,
      purchaseKey: escrowPayload.purchaseKey,
      escrow: escrowPayload.record
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all transactions for a buyer
 */
router.get('/buyer/:buyerId', (req, res) => {
  try {
    const { buyerId } = req.params;

    const transactions = db.prepare(`
      SELECT * FROM transactions WHERE buyer_id = ?
      ORDER BY created_at DESC
    `).all(buyerId);

    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all transactions (admin)
 */
router.get('/all', (req, res) => {
  try {
    const transactions = db.prepare(`
      SELECT * FROM transactions
      ORDER BY created_at DESC
    `).all();

    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
