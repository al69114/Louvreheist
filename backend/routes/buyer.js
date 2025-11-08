const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { upsertBuyerRecord, readBuyers } = require('../utils/fileStore');
const { encrypt, decrypt } = require('../utils/encryption');

const JWT_SECRET = process.env.JWT_SECRET || 'shadow-mint-secret-key-hackathon-2025';

/**
 * Generate a simple, readable password
 */
function generateSimplePassword() {
  const words = ['shadow', 'mint', 'vault', 'heist', 'ghost', 'raven', 'cobra', 'viper', 'storm', 'night', 'dark', 'steel', 'iron', 'blade', 'cipher'];
  const word1 = words[Math.floor(Math.random() * words.length)];
  const word2 = words[Math.floor(Math.random() * words.length)];
  const number = Math.floor(1000 + Math.random() * 9000);
  return `${word1}-${word2}-${number}`;
}

// Ensure generated password is unique among invites
function generateUniqueInvite(passwordGenerator) {
  let code, password;
  do {
    code = crypto.randomBytes(16).toString('hex');
  } while (db.prepare('SELECT * FROM invite_links WHERE code = ?').get(code));

  do {
    password = passwordGenerator();
  } while (db.prepare('SELECT * FROM invite_links WHERE password = ?').get(password));

  return { code, password };
}

// Generate a unique codename across current DB and persisted JSON
function generateUniqueCodename() {
  const adjectives = ['shadow', 'silent', 'phantom', 'scarlet', 'silver', 'iron', 'midnight', 'crimson', 'ghost', 'dark'];
  const animals = ['fox', 'raven', 'viper', 'wolf', 'panther', 'cobra', 'hawk', 'lynx', 'owl', 'mamba'];

  const existingDb = (db.buyers || []).map(b => b.codename).filter(Boolean);
  const existingFile = (readBuyers() || []).map(b => b.codename).filter(Boolean);
  const taken = new Set([...existingDb, ...existingFile]);

  for (let i = 0; i < 200; i++) {
    const a = adjectives[Math.floor(Math.random() * adjectives.length)];
    const b = animals[Math.floor(Math.random() * animals.length)];
    const n = Math.floor(1000 + Math.random() * 9000); // 4 digits
    const name = `${a}-${b}-${n}`;
    if (!taken.has(name)) return name;
  }
  // Fallback: append random hex to guarantee uniqueness
  return `shadow-fox-${crypto.randomBytes(3).toString('hex')}`;
}

/**
 * Generate a unique invite link for a buyer
 * Admin endpoint
 */
router.post('/admin/create-invite', (req, res) => {
  try {
    const { code, password } = generateUniqueInvite(generateSimplePassword);

    const stmt = db.prepare(`
      INSERT INTO invite_links (code, password, used)
      VALUES (?, ?, ?)
    `);

    // Note: in-memory DB supports a role param even if the SQL doesn't explicitly show it
    stmt.run(code, password, false, 'buyer');

    const protocol = req.protocol || 'http';
    let host = req.get('x-forwarded-host') || req.get('referer');

    if (host && host.includes('://')) {
      const url = new URL(host);
      host = url.host;
    } else if (!host || host.includes('localhost:5001')) {
      host = 'localhost:3000';
    }

    const loginUrl = `${protocol}://${host}/buyer/login`;

    res.json({
      success: true,
      loginUrl,
      password,
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
    const links = db.prepare('SELECT * FROM invite_links WHERE role = ?').all('buyer');
    res.json({ success: true, links });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all buyers with decrypted name (admin)
 */
router.get('/admin/buyers', (req, res) => {
  try {
    const buyers = db.prepare('SELECT * FROM buyers').all();
    const mapped = buyers.map(b => ({
      id: b.id,
      username: b.username,
      codename: b.codename || null,
      name: b.real_name_encrypted ? safeDecrypt(b.real_name_encrypted) : null,
      created_at: b.created_at
    }));
    res.json({ success: true, buyers: mapped });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function safeDecrypt(value) {
  try {
    return decrypt(value);
  } catch (e) {
    return null;
  }
}

/**
 * Login or activate buyer with password only
 */
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    // Find invite by password
    const invite = db.prepare('SELECT * FROM invite_links WHERE password = ?').get(password);

    if (!invite || invite.role !== 'buyer') {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Check if account already created with this invite
    let buyer = db.prepare('SELECT * FROM buyers WHERE invite_code = ?').get(invite.code);

    if (!buyer) {
      // First time login - create account automatically
      const buyerId = 'buyer_' + crypto.randomBytes(8).toString('hex');
      const passwordHash = await bcrypt.hash(password, 10);

      const stmt = db.prepare(`
        INSERT INTO buyers (username, password_hash, invite_code)
        VALUES (?, ?, ?)
      `);

      const result = stmt.run(buyerId, passwordHash, invite.code);

      // Mark invite as used
      db.prepare('UPDATE invite_links SET used = ? WHERE code = ?').run(true, invite.code);

      // Persist new buyer info to JSON store
      const createdBuyer = db.prepare('SELECT * FROM buyers WHERE id = ?').get(result.lastInsertRowid);
      if (createdBuyer) {
        upsertBuyerRecord({
          id: createdBuyer.id,
          username: createdBuyer.username,
          invite_code: createdBuyer.invite_code,
          created_at: createdBuyer.created_at,
          codename: createdBuyer.codename
        });
        buyer = createdBuyer;
      } else {
        buyer = {
          id: result.lastInsertRowid,
          username: buyerId,
          invite_code: invite.code,
          codename: null
        };
        upsertBuyerRecord(buyer);
      }
    }

    // Update last seen info for existing buyer
    if (buyer && buyer.id) {
      upsertBuyerRecord({
        id: buyer.id,
        username: buyer.username,
        invite_code: buyer.invite_code,
        created_at: buyer.created_at,
        codename: buyer.codename
      });
    }

    // Generate JWT token
    const token = jwt.sign({ id: buyer.id, username: buyer.username, role: 'buyer' }, JWT_SECRET, {
      expiresIn: '30d'
    });

    res.json({
      success: true,
      token,
      buyer: {
        id: buyer.id,
        buyerId: buyer.username,
        codename: buyer.codename || null
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get profile (buyer)
 */
router.get('/profile', verifyToken, (req, res) => {
  try {
    const buyer = db.prepare('SELECT id, username, created_at, codename FROM buyers WHERE id = ?')
      .get(req.buyer.id);

    res.json({ success: true, buyer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Setup profile: accept real name, encrypt it, and assign codename
 */
router.post('/setup-profile', verifyToken, (req, res) => {
  try {
    const { realName } = req.body;

    if (!realName || typeof realName !== 'string' || realName.trim().length < 2) {
      return res.status(400).json({ error: 'Valid name is required' });
    }

    const encryptedName = encrypt(realName.trim());

    // Generate a readable, unique codename
    const codename = generateUniqueCodename();

    // Persist to in-memory DB
    db.prepare('UPDATE buyers SET real_name_encrypted = ?, codename = ? WHERE id = ?')
      .run(encryptedName, codename, req.buyer.id);

    // Update JSON snapshot
    const updated = db.prepare('SELECT * FROM buyers WHERE id = ?').get(req.buyer.id);
    upsertBuyerRecord({
      id: updated.id,
      username: updated.username,
      invite_code: updated.invite_code,
      created_at: updated.created_at,
      codename: updated.codename
    });

    return res.json({ success: true, codename });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Middleware to verify JWT token for buyers
 */
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'buyer') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    req.buyer = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = router;
