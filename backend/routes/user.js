const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { generateAnonymousId, encrypt } = require('../utils/encryption');

/**
 * Create anonymous user session
 */
router.post('/anonymous', (req, res) => {
  try {
    const { walletAddress } = req.body;

    const anonymousId = generateAnonymousId();
    const encryptedWallet = walletAddress ? encrypt(walletAddress) : null;

    const stmt = db.prepare(`
      INSERT INTO users (anonymous_id, wallet_address_encrypted)
      VALUES (?, ?)
    `);

    stmt.run(anonymousId, encryptedWallet);

    res.json({
      success: true,
      anonymousId,
      message: 'Anonymous session created'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user info (minimal for privacy)
 */
router.get('/:anonymousId', (req, res) => {
  try {
    const { anonymousId } = req.params;

    const user = db.prepare('SELECT id, anonymous_id, created_at FROM users WHERE anonymous_id = ?')
      .get(anonymousId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
