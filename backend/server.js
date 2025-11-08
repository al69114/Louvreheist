require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

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

// Routes
app.use('/api/auction', auctionRoutes);
app.use('/api/mixer', mixerRoutes);
app.use('/api/nft', nftRoutes);
app.use('/api/user', userRoutes);
app.use('/api/thief', thiefRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'The Shadow Mint',
    onion_address: 'shadow7x2k9mq4.onion',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`\n🕵️  The Shadow Mint Backend`);
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`🧅 Mock Onion Address: shadow7x2k9mq4.onion`);
  console.log(`🔐 Encryption: Active`);
  console.log(`⛓️  Blockchain: Sepolia Testnet\n`);
});
