# 🚀 Quick Start Guide

## The Fastest Way to Run The Shadow Mint

### Option 1: Automated Startup (Recommended)

```bash
chmod +x START.sh
./START.sh
```

Then open your browser to: **http://localhost:3000**

### Option 2: Manual Startup

**Terminal 1 - Backend:**
```bash
cd backend
node server.js
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Then open your browser to: **http://localhost:3000**

### Option 3: Concurrently (If dependencies installed)

```bash
npm run dev
```

## 🎯 What You'll See

1. **Home Page** - Overview of The Shadow Mint concept
2. **Auctions** - Browse and create anonymous auctions
3. **Mint NFT** - Create "Bragging Rights" NFTs
4. **Crypto Mixer** - Simulate cryptocurrency tumbling

## 🎬 Demo Flow (5 minutes)

### 1. Create an Auction
- Go to **Auctions**
- Click **"+ Create Auction"**
- Fill in details:
  - Title: "Crown of Louis XV"
  - Starting Price: 0.5 ETH
  - Reserve Price: 2.0 ETH
- Submit

### 2. Place a Bid
- Click **"Place Bid"** on your auction
- Enter amount higher than current price
- Submit

### 3. Mint an NFT
- Go to **Mint NFT**
- Fill in:
  - Item Name: "Ruby of the French Crown"
  - 3D Scan URL: `ipfs://QmExample123`
  - Description: Your description
- Click **"Mint NFT"**
- Get Token ID and Transaction Hash

### 4. Use Crypto Mixer
- Go to **Crypto Mixer**
- Enter mock wallet addresses
- Amount: 1.5 BTC
- Click **"Start Mixing"**
- Watch status change from pending → completed

## 🔑 Key Features to Highlight

1. **Anonymity** - No login required, anonymous session IDs
2. **Encryption** - All sensitive data encrypted (AES-256-GCM)
3. **Blockchain** - Real Solidity smart contracts (deployable)
4. **Dark Theme** - Tor-style hacker interface

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports
lsof -ti:5000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

### Dependencies Not Installed
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Database Issues
The app uses an in-memory database, so just restart the backend server.

## 📊 API Testing

Test the API directly:

```bash
# Health check
curl http://localhost:5000/api/health

# Get mixer stats
curl http://localhost:5000/api/mixer/stats

# Get active auctions
curl http://localhost:5000/api/auction/active
```

## 🎨 Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: React + Vite
- **Smart Contracts**: Solidity + Hardhat
- **Encryption**: AES-256-GCM
- **Database**: In-memory (perfect for demos)

## ⚠️ Remember

This is an **educational hackathon project**. Always use technology ethically and legally.

---

Enjoy exploring The Shadow Mint! 🕵️
