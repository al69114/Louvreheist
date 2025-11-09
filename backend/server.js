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
const buyerRoutes = require('./routes/buyer');
const transactionRoutes = require('./routes/transaction');
const escrowRoutes = require('./routes/escrow');

// Routes
app.use('/api/auction', auctionRoutes);
app.use('/api/mixer', mixerRoutes);
app.use('/api/nft', nftRoutes);
app.use('/api/user', userRoutes);
app.use('/api/thief', thiefRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/escrow', escrowRoutes);

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

// added api endpoint for login with code
const axios = require('axios'); // You'll need axios (npm install axios)

// The URL of your deployed bot service.
// Put this in your main backend's .env file, not in the code!
const BOT_API_URL = 'https://full-auction-bot.onrender.com';

// The new endpoint for your front-end to call
app.post('/api/login-with-code', async (req, res) => {
  try {
    const { code } = req.body;

    // 1. Make the secure server-to-server request
    const response = await axios.get(`${BOT_API_URL}/check-code/${code}`);

    // 2. Check the bot's answer
    if (response.data.valid) {
      // SUCCESS! The code is valid.
      // Now, you do your main app's login logic:
      // - Find or create the user in your *main database*
      // - Create a JWT (JSON Web Token) or a session
      // - Send the token/session back to the front-end
      
      console.log('Code is valid for type:', response.data.type);
      
      // Example: creating a JWT
      const user = { /* ... find or create user ... */ };
      const token = createJwtToken(user); // Your function
      
      res.status(200).json({ success: true, token: token });

    } else {
      // This "else" block is never reached, as axios will throw an
      // error on a 404 response. We'll catch it below.
    }

  } catch (error) {
    // This will catch the 404 "Invalid code" error from the bot API
    if (error.response && error.response.status === 404) {
      return res.status(401).json({ success: false, message: 'The code is not valid.' });
    }
    
    // Catch any other server errors
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});
