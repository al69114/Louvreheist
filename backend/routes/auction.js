const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { encrypt, decrypt } = require('../utils/encryption');

/**
 * Create new auction listing
 */
router.post('/create', (req, res) => {
  try {
    const {
      title,
      description,
      itemType,
      startingPrice,
      reservePrice,
      sellerId,
      nftTokenId,
      nftContractAddress,
      scan3dUrl,
      endsAt
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO auction_items
      (title, description, item_type, starting_price, reserve_price, seller_id,
       nft_token_id, nft_contract_address, scan_3d_url, ends_at, current_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title,
      description,
      itemType,
      startingPrice,
      reservePrice,
      sellerId,
      nftTokenId || null,
      nftContractAddress || null,
      scan3dUrl || null,
      endsAt,
      startingPrice
    );

    res.json({
      success: true,
      auctionId: result.lastInsertRowid,
      message: 'Auction created'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all active auctions
 */
router.get('/active', (req, res) => {
  try {
    const auctions = db.prepare(`
      SELECT
        id, title, description, item_type, starting_price, current_price,
        reserve_price, status, created_at, ends_at, nft_token_id,
        nft_contract_address, scan_3d_url
      FROM auction_items
      WHERE status = 'active'
      ORDER BY created_at DESC
    `).all();

    res.json({ success: true, auctions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get ALL auctions (admin portal)
 */
router.get('/admin/all', (req, res) => {
  try {
    const auctions = db.prepare(`
      SELECT * FROM auction_items ORDER BY created_at DESC
    `).all();

    res.json({ success: true, auctions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get specific auction
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const auction = db.prepare(`
      SELECT * FROM auction_items WHERE id = ?
    `).get(id);

    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    // Get bid count
    const bidCount = db.prepare(`
      SELECT COUNT(*) as count FROM bids WHERE auction_id = ?
    `).get(id).count;

    res.json({
      success: true,
      auction: { ...auction, bidCount }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Place a bid
 */
router.post('/bid', (req, res) => {
  try {
    const { auctionId, bidderId, bidAmount, transactionHash } = req.body;

    // Get current auction
    const auction = db.prepare('SELECT * FROM auction_items WHERE id = ?').get(auctionId);

    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    if (bidAmount <= auction.current_price) {
      return res.status(400).json({ error: 'Bid must be higher than current price' });
    }

    // Encrypt transaction hash for privacy
    const encryptedTxHash = transactionHash ? encrypt(transactionHash) : null;

    // Insert bid
    const bidStmt = db.prepare(`
      INSERT INTO bids (auction_id, bidder_id, bid_amount, transaction_hash_encrypted)
      VALUES (?, ?, ?, ?)
    `);

    const bidResult = bidStmt.run(auctionId, bidderId, bidAmount, encryptedTxHash);

    // Update current price
    db.prepare('UPDATE auction_items SET current_price = ? WHERE id = ?')
      .run(bidAmount, auctionId);

    res.json({
      success: true,
      bidId: bidResult.lastInsertRowid,
      message: 'Bid placed successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get bids for an auction (anonymized)
 */
router.get('/:id/bids', (req, res) => {
  try {
    const { id } = req.params;

    const bids = db.prepare(`
      SELECT
        id,
        SUBSTR(bidder_id, 1, 12) || '...' as bidder_id_partial,
        bid_amount,
        created_at
      FROM bids
      WHERE auction_id = ?
      ORDER BY bid_amount DESC
    `).all(id);

    res.json({ success: true, bids });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
