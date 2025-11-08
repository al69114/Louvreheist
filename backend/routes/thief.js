const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { upsertThiefRecord } = require('../utils/fileStore');

const JWT_SECRET = process.env.JWT_SECRET || 'shadow-mint-secret-key-hackathon-2025';

/**
 * Generate a simple, readable password
 */
function generateSimplePassword() {
  // Generate a password with format: word-word-number (e.g., shadow-mint-2845)
  const words = ['shadow', 'mint', 'vault', 'heist', 'ghost', 'raven', 'cobra', 'viper', 'storm', 'night', 'dark', 'steel', 'iron', 'blade', 'cipher'];
  const word1 = words[Math.floor(Math.random() * words.length)];
  const word2 = words[Math.floor(Math.random() * words.length)];
  const number = Math.floor(1000 + Math.random() * 9000); // 4 digit number
  return `${word1}-${word2}-${number}`;
}

/**
 * Generate a unique invite link for a thief
 * Admin endpoint
 */
router.post('/admin/create-invite', (req, res) => {
  try {
    // Generate unique invite code and password
    const code = crypto.randomBytes(16).toString('hex');
    const password = generateSimplePassword();

    const stmt = db.prepare(`
      INSERT INTO invite_links (code, password, used)
      VALUES (?, ?, ?)
    `);

    // Note: in-memory DB supports a role param even if the SQL doesn't explicitly show it
    stmt.run(code, password, false, 'thief');

    // Get the frontend host from request headers
    // Vite proxy sets these headers, or use referer as fallback
    const protocol = req.protocol || 'http';
    let host = req.get('x-forwarded-host') || req.get('referer');

    // If we got a referer, extract just the host part
    if (host && host.includes('://')) {
      const url = new URL(host);
      host = url.host;
    } else if (!host || host.includes('localhost:5001')) {
      // Fallback: use localhost:3000 for local dev
      host = 'localhost:3000';
    }

    const loginUrl = `${protocol}://${host}/seller`;

    res.json({
      success: true,
      loginUrl: loginUrl,
      inviteLink: `/seller`, // For frontend display
      password: password,
      code: code // For admin reference only
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all invite links (admin)
 */
router.get('/admin/invites', (req, res) => {
  try {
    const links = db.prepare('SELECT * FROM invite_links WHERE role = ?').all('thief');
    res.json({ success: true, links });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Verify invite code
 */
router.get('/verify-invite/:code', (req, res) => {
  try {
    const { code } = req.params;

    const link = db.prepare('SELECT * FROM invite_links WHERE code = ?').get(code);

    if (!link) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    if (link.used) {
      return res.status(400).json({ error: 'Invite code already used' });
    }

    res.json({ success: true, valid: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Activate thief account with invite code (auto-registration)
 * No username/password needed - the invite code IS the password
 */
router.post('/activate', async (req, res) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ error: 'Invite code required' });
    }

    // Verify invite code
    const link = db.prepare('SELECT * FROM invite_links WHERE code = ?').get(inviteCode);

    if (!link) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    if (link.used) {
      return res.status(400).json({ error: 'This invite code has already been activated' });
    }

    // Generate unique thief ID (no username needed)
    const thiefId = 'thief_' + crypto.randomBytes(8).toString('hex');

    // Use invite code as the password (hashed)
    const passwordHash = await bcrypt.hash(inviteCode, 10);

    // Create thief account automatically
    const stmt = db.prepare(`
      INSERT INTO thieves (username, password_hash, invite_code)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(thiefId, passwordHash, inviteCode);

    // Persist thief info to JSON store
    const createdThief = db.prepare('SELECT * FROM thieves WHERE id = ?').get(result.lastInsertRowid);
    if (createdThief) {
      upsertThiefRecord({
        id: createdThief.id,
        username: createdThief.username,
        invite_code: createdThief.invite_code,
        created_at: createdThief.created_at
      });
    }

    // Mark invite as used
    db.prepare('UPDATE invite_links SET used = ? WHERE code = ?').run(true, inviteCode);

    // Generate JWT token
    const token = jwt.sign({ id: result.lastInsertRowid, username: thiefId, role: 'thief' }, JWT_SECRET, {
      expiresIn: '30d'
    });

    res.json({
      success: true,
      message: 'Account activated successfully',
      token,
      thief: {
        id: result.lastInsertRowid,
        thiefId: thiefId
      },
      accessCode: inviteCode // Send back for confirmation
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Login or activate thief with password
 */
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    // Find invite by password
    const invite = db.prepare('SELECT * FROM invite_links WHERE password = ?').get(password);

    if (!invite || invite.role !== 'thief') {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Check if account already created with this invite
    let thief = db.prepare('SELECT * FROM thieves WHERE invite_code = ?').get(invite.code);

    if (!thief) {
      // First time login - create account automatically
      const thiefId = 'thief_' + crypto.randomBytes(8).toString('hex');
      const passwordHash = await bcrypt.hash(password, 10);

      const stmt = db.prepare(`
        INSERT INTO thieves (username, password_hash, invite_code)
        VALUES (?, ?, ?)
      `);

      const result = stmt.run(thiefId, passwordHash, invite.code);

      // Mark invite as used
      db.prepare('UPDATE invite_links SET used = ? WHERE code = ?').run(true, invite.code);

      // Persist new thief info to JSON store
      const createdThief = db.prepare('SELECT * FROM thieves WHERE id = ?').get(result.lastInsertRowid);
      if (createdThief) {
        upsertThiefRecord({
          id: createdThief.id,
          username: createdThief.username,
          invite_code: createdThief.invite_code,
          created_at: createdThief.created_at
        });
        thief = createdThief;
      } else {
        thief = {
          id: result.lastInsertRowid,
          username: thiefId,
          invite_code: invite.code
        };
        upsertThiefRecord(thief);
      }
    }

    // Update last seen info for existing thief
    if (thief && thief.id) {
      upsertThiefRecord({
        id: thief.id,
        username: thief.username,
        invite_code: thief.invite_code,
        created_at: thief.created_at
      });
    }

    // Generate JWT token
    const token = jwt.sign({ id: thief.id, username: thief.username, role: 'thief' }, JWT_SECRET, {
      expiresIn: '30d'
    });

    res.json({
      success: true,
      token,
      thief: {
        id: thief.id,
        thiefId: thief.username
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get thief's own auctions
 */
router.get('/my-auctions', verifyToken, (req, res) => {
  try {
    const thiefId = req.thief.id;

    const auctions = db.prepare(`
      SELECT * FROM auction_items WHERE seller_id = ?
    `).all(thiefId.toString());

    res.json({ success: true, auctions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get profile
 */
router.get('/profile', verifyToken, (req, res) => {
  try {
    const thief = db.prepare('SELECT id, username, created_at FROM thieves WHERE id = ?')
      .get(req.thief.id);

    res.json({ success: true, thief });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Middleware to verify JWT token
 */
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'thief') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    req.thief = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = router;
