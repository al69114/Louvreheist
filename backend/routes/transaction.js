const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const escrow = require('../utils/escrowKeys');

/**
 * Create a transaction record
 */
router.post('/create', (req, res) => {
  try {
    const {
      buyerId,
      auctionId,
      itemName,
      amount,
      walletAddress,
      transactionHash,
      currency,
      notes
    } = req.body;

    if (!buyerId || !auctionId || !itemName || !amount || !walletAddress) {
      return res.status(400).json({ error: 'buyerId, auctionId, itemName, amount, walletAddress are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO transactions (buyer_id, auction_id, item_name, amount, wallet_address, transaction_hash, status, created_at, currency, payout_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      buyerId,
      auctionId,
      itemName,
      amount,
      walletAddress,
      transactionHash || null,
      'confirmed',
      new Date().toISOString(),
      currency || null,
      notes || null
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
