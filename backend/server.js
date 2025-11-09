require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { db, initializeDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'shadow-mint-secret-key-hackathon-2025';
const BOT_API_URL = process.env.BOT_API_URL || 'https://full-auction-bot.onrender.com';

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Import routes
const auctionRoutes = require('./routes/auction');
const mixerRoutes = require('./routes/mixer');
const nftRoutes = require('./routes/nft');
const userRoutes = require('./routes/user');
const thiefRoutes = require('./routes/thief');
const buyerRoutes = require('./routes/buyer');
const transactionRoutes = require('./routes/transaction');

// Routes
app.use('/api/auction', auctionRoutes);
app.use('/api/mixer', mixerRoutes);
app.use('/api/nft', nftRoutes);
app.use('/api/user', userRoutes);
app.use('/api/thief', thiefRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/transaction', transactionRoutes);

// Bot health proxy to verify connectivity/config quickly
app.get('/api/bot/health', async (req, res) => {
  try {
    if (!BOT_API_URL) {
      return res.status(500).json({ ok: false, message: 'BOT_API_URL is not configured' });
    }
    const r = await axios.get(`${BOT_API_URL}/health`);
    return res.status(200).json({ ok: true, bot: r.data || 'ok' });
  } catch (err) {
    return res.status(502).json({ ok: false, message: err.message, url: BOT_API_URL });
  }
});

// Login via Telegram bot-issued code (seller)
app.post('/api/login-with-code', async (req, res) => {
  try {
    const { code } = req.body;
    const trimmedCode = (code || '').toString().trim();
    if (!trimmedCode) {
      return res.status(400).json({ success: false, message: 'Code is required.' });
    }

    // Verify code with the external bot service
    const response = await axios.get(`${BOT_API_URL}/check-code/${encodeURIComponent(trimmedCode)}`);

    if (!response.data || !response.data.valid) {
      return res.status(401).json({ success: false, message: 'The code is not valid.' });
    }

    // Only allow seller codes here
    if (response.data.type && response.data.type !== 'seller') {
      return res.status(403).json({ success: false, message: 'Code is not for seller access.' });
    }

    // Create a thief (seller) identity for this session
    const thiefId = 'thief_' + crypto.randomBytes(8).toString('hex');

    const stmt = db.prepare(`
      INSERT INTO thieves (username, password_hash, invite_code)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(thiefId, 'bot-login', `bot:${trimmedCode}`);

    const token = jwt.sign({ id: result.lastInsertRowid, username: thiefId, role: 'thief' }, JWT_SECRET, {
      expiresIn: '30d'
    });

    return res.status(200).json({
      success: true,
      token,
      thief: {
        id: result.lastInsertRowid,
        thiefId
      }
    });
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        return res.status(401).json({ success: false, message: 'The code is not valid.' });
      }
      const msg = error.response.data?.message || `Bot API error: ${error.response.status}`;
      return res.status(502).json({ success: false, message: msg });
    }
    console.error('Login-with-code error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Xcro Black Market',
    onion_address: 'xcr0dark.onion',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`\n☠️  Xcro Black Market Backend`);
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`⚠️  Onion Address: xcr0dark.onion`);
  console.log(`🔐 Encryption: Active`);
  console.log(`⛓️  Blockchain: Sepolia Testnet\n`);
});
