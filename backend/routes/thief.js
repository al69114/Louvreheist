const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'shadow-mint-secret-key-hackathon-2025';

/**
 * Generate a unique invite link for a thief
 * Admin endpoint
 */
router.post('/admin/create-invite', (req, res) => {
  try {
    // Generate unique invite code
    const code = crypto.randomBytes(16).toString('hex');

    const stmt = db.prepare(`
      INSERT INTO invite_links (code, used)
      VALUES (?, ?)
    `);

    stmt.run(code, false);

    res.json({
      success: true,
      inviteLink: `/thief/register?code=${code}`,
      code
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
    const links = db.prepare('SELECT * FROM invite_links').all();
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
 * Register new thief (with invite code)
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, inviteCode } = req.body;

    if (!username || !password || !inviteCode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify invite code
    const link = db.prepare('SELECT * FROM invite_links WHERE code = ?').get(inviteCode);

    if (!link) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    if (link.used) {
      return res.status(400).json({ error: 'Invite code already used' });
    }

    // Check if username already exists
    const existing = db.prepare('SELECT * FROM thieves WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create thief account
    const stmt = db.prepare(`
      INSERT INTO thieves (username, password_hash, invite_code)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(username, passwordHash, inviteCode);

    // Mark invite as used
    db.prepare('UPDATE invite_links SET used = ? WHERE code = ?').run(true, inviteCode);

    // Generate JWT token
    const token = jwt.sign({ id: result.lastInsertRowid, username, role: 'thief' }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      success: true,
      message: 'Account created successfully',
      token,
      thief: {
        id: result.lastInsertRowid,
        username
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Login thief
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    // Find thief
    const thief = db.prepare('SELECT * FROM thieves WHERE username = ?').get(username);

    if (!thief) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, thief.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: thief.id, username: thief.username, role: 'thief' }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      success: true,
      token,
      thief: {
        id: thief.id,
        username: thief.username
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
