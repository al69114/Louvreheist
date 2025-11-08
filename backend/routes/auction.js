const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { encrypt, decrypt } = require('../utils/encryption');

// Simple in-memory scheduler state
let auctionSchedule = {
  startAt: null,           // ISO string
  durationSeconds: 300,    // default 5 minutes
  enabled: false
};
let schedulerTimer = null;

function getActiveAuction() {
  return (db.auction_items || []).find(a => a.status === 'active') || null;
}

function getQueuedAuctions() {
  return (db.auction_items || [])
    .filter(a => a.status === 'queued')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

function activateAuction(auction) {
  const now = new Date();
  const ends = new Date(now.getTime() + (auctionSchedule.durationSeconds * 1000));
  db.prepare('UPDATE auction_items SET status = ? WHERE id = ?').run('active', auction.id);
  db.prepare('UPDATE auction_items SET ends_at = ? WHERE id = ?').run(ends.toISOString(), auction.id);
}

function completeAuction(auction) {
  db.prepare('UPDATE auction_items SET status = ? WHERE id = ?').run('completed', auction.id);
}

function tickScheduler() {
  try {
    if (!auctionSchedule.enabled) return;

    const now = new Date();
    const startAt = auctionSchedule.startAt ? new Date(auctionSchedule.startAt) : null;
    if (!startAt || now < startAt) return;

    const active = getActiveAuction();
    if (active) {
      if (active.ends_at && new Date(active.ends_at) <= now) {
        completeAuction(active);
      } else {
        return; // still running
      }
    }

    const next = getQueuedAuctions()[0];
    if (next) {
      activateAuction(next);
    } else {
      // nothing left; stop scheduler
      auctionSchedule.enabled = false;
    }
  } catch (e) {
    // swallow errors for demo
  }
}

function ensureScheduler() {
  if (!schedulerTimer) {
    schedulerTimer = setInterval(tickScheduler, 1000);
  }
}

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
 * Admin: schedule auction rotation
 */
router.post('/admin/schedule', (req, res) => {
  try {
    const { startAt, startInSeconds, durationSeconds } = req.body || {};
    let start = null;
    if (startAt) {
      start = new Date(startAt);
    } else if (typeof startInSeconds === 'number') {
      start = new Date(Date.now() + startInSeconds * 1000);
    } else {
      start = new Date();
    }

    auctionSchedule.startAt = start.toISOString();
    auctionSchedule.durationSeconds = Math.max(30, Number(durationSeconds) || 300);
    auctionSchedule.enabled = true;

    ensureScheduler();

    return res.json({ success: true, schedule: auctionSchedule });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Admin: scheduler status
 */
router.get('/admin/schedule', (req, res) => {
  try {
    const active = getActiveAuction();
    const queued = getQueuedAuctions();
    res.json({ success: true, schedule: auctionSchedule, active, queuedCount: queued.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Admin: stop auction rotation
 */
router.post('/admin/stop', (req, res) => {
  try {
    auctionSchedule.enabled = false;
    auctionSchedule.startAt = null;
    return res.json({ success: true, message: 'Auction rotation stopped', schedule: auctionSchedule });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Admin: manually advance to next auction
 */
router.post('/admin/advance', (req, res) => {
  try {
    const active = getActiveAuction();
    if (active) completeAuction(active);
    const next = getQueuedAuctions()[0];
    if (next) activateAuction(next);
    return res.json({ success: true, nowActive: getActiveAuction() || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Activate a specific auction by ID
 */
router.post('/activate', (req, res) => {
  try {
    const { auctionId } = req.body;

    if (!auctionId) {
      return res.status(400).json({ error: 'auctionId is required' });
    }

    // Get the auction
    const auction = db.prepare('SELECT * FROM auction_items WHERE id = ?').get(auctionId);

    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    if (auction.status !== 'queued') {
      return res.status(400).json({ error: 'Only queued auctions can be activated' });
    }

    // Activate the auction
    activateAuction(auction);

    return res.json({
      success: true,
      activatedAuction: db.prepare('SELECT * FROM auction_items WHERE id = ?').get(auctionId)
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
