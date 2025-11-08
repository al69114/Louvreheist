# 🕵️ The Shadow Mint - Project Summary

## ✅ What We Built

A complete anonymous e-fencing platform for the Louvre Heist hackathon, featuring:

### 1. Backend API (Node.js + Express)
**Location**: `backend/`

Features:
- ✅ Anonymous user authentication
- ✅ AES-256-GCM encryption for sensitive data
- ✅ Auction CRUD operations
- ✅ Bid management with encryption
- ✅ NFT minting simulation
- ✅ Crypto mixer/tumbler
- ✅ In-memory database (no compilation issues)

**Key Files**:
- `server.js` - Main Express application
- `utils/encryption.js` - Encryption utilities
- `config/database.js` - In-memory database
- `routes/auction.js` - Auction endpoints
- `routes/mixer.js` - Crypto mixing endpoints
- `routes/nft.js` - NFT minting endpoints
- `routes/user.js` - Anonymous auth endpoints

### 2. Smart Contracts (Solidity)
**Location**: `contracts/`

Features:
- ✅ **BraggingRightsNFT.sol** - ERC-721 NFT with destruction proofs
- ✅ **CryptoMixer.sol** - Tumbler with pooling and fee structure
- ✅ Hardhat configuration for Sepolia testnet
- ✅ Deployment scripts
- ✅ Test suite

**Key Files**:
- `contracts/BraggingRightsNFT.sol` - NFT contract
- `contracts/CryptoMixer.sol` - Mixer contract
- `scripts/deploy.js` - Deployment script
- `test/CryptoMixer.test.js` - Tests

### 3. Frontend (React + Vite)
**Location**: `frontend/`

Features:
- ✅ Dark Tor-themed UI
- ✅ Home page with concept explanation
- ✅ Auction marketplace
- ✅ NFT minting interface
- ✅ Crypto mixer interface
- ✅ Real-time updates
- ✅ Anonymous session management

**Key Files**:
- `src/App.jsx` - Main application component
- `src/pages/Home.jsx` - Landing page
- `src/pages/Auctions.jsx` - Auction marketplace
- `src/pages/MintNFT.jsx` - NFT minting page
- `src/pages/Mixer.jsx` - Crypto mixer page
- `src/styles/index.css` - Dark theme styling

## 📂 Complete Project Structure

```
Louvreheist/
├── README.md               # Main documentation
├── QUICKSTART.md          # Quick start guide
├── DEMO.md                # Demo script for judges
├── PROJECT_SUMMARY.md     # This file
├── START.sh               # Automated startup script
├── package.json           # Root package.json (concurrently)
├── .gitignore            # Git ignore rules
│
├── backend/
│   ├── server.js         # Express server
│   ├── package.json      # Backend dependencies
│   ├── .env              # Environment variables
│   ├── config/
│   │   └── database.js   # In-memory database
│   ├── utils/
│   │   └── encryption.js # AES-256-GCM encryption
│   └── routes/
│       ├── user.js       # Anonymous auth
│       ├── auction.js    # Auction CRUD
│       ├── nft.js        # NFT minting
│       └── mixer.js      # Crypto mixing
│
├── contracts/
│   ├── package.json      # Contract dependencies
│   ├── hardhat.config.js # Hardhat configuration
│   ├── contracts/
│   │   ├── BraggingRightsNFT.sol
│   │   └── CryptoMixer.sol
│   ├── scripts/
│   │   └── deploy.js     # Deployment script
│   └── test/
│       └── CryptoMixer.test.js
│
└── frontend/
    ├── package.json      # Frontend dependencies
    ├── vite.config.js    # Vite configuration
    ├── index.html        # HTML entry point
    └── src/
        ├── main.jsx      # React entry
        ├── App.jsx       # Main app component
        ├── styles/
        │   └── index.css # Dark theme CSS
        └── pages/
            ├── Home.jsx
            ├── Auctions.jsx
            ├── MintNFT.jsx
            └── Mixer.jsx
```

## 🔑 Key Technical Features

### Security & Privacy
- **Encryption**: AES-256-GCM for wallet addresses and transaction hashes
- **Anonymity**: No login, no PII, anonymous session IDs
- **Tor-Ready**: Mock .onion address, Tor-compatible design

### Blockchain
- **NFT Contract**: ERC-721 with custom destruction proof metadata
- **Mixer Contract**: Pooled mixing with 2% fee, ReentrancyGuard protection
- **Testnet Ready**: Deployable to Sepolia with Hardhat

### User Experience
- **Dark Theme**: Hacker/Tor-style interface with green terminal aesthetic
- **Real-time**: Live auction updates, mixer status tracking
- **Mobile-Friendly**: Responsive grid layout

## 🎯 Hackathon Alignment

### Theme: Prevent, Solve, or Commit the Perfect Heist

**Our Approach: Commit** ✅

1. **Problem**: Can't sell stolen crown jewels - too traceable
2. **Solution**: Destroy original, sell NFT "Bragging Rights"
3. **Innovation**: Crypto mixer for untraceable payments
4. **Tech**: Full-stack blockchain application

### Key Innovations

1. **"Bragging Rights" NFTs** - Novel concept of digital ownership post-destruction
2. **Cryptographic Destruction Proofs** - On-chain verification
3. **Integrated Crypto Mixer** - Smart contract-based tumbling
4. **Tor-Style Anonymity** - Complete privacy stack

## 📊 API Endpoints

### Users
- `POST /api/user/anonymous` - Create session
- `GET /api/user/:id` - Get user info

### Auctions
- `GET /api/auction/active` - List auctions
- `POST /api/auction/create` - Create auction
- `POST /api/auction/bid` - Place bid
- `GET /api/auction/:id` - Get auction
- `GET /api/auction/:id/bids` - Get bids

### NFT
- `POST /api/nft/mint` - Mint NFT
- `GET /api/nft/:tokenId` - Get metadata

### Mixer
- `POST /api/mixer/mix` - Submit transaction
- `GET /api/mixer/status/:txId` - Check status
- `GET /api/mixer/stats` - Get statistics

## 🚀 Running the Project

### Quick Start
```bash
./START.sh
```

### Manual Start
```bash
# Terminal 1
cd backend && node server.js

# Terminal 2
cd frontend && npm run dev
```

### Deploy Contracts (Optional)
```bash
cd contracts
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js --network sepolia
```

## 🎬 Demo Script

See `DEMO.md` for a complete 5-minute demo script.

## 🛠️ Technology Stack

- **Backend**: Node.js 18+, Express 4.18
- **Frontend**: React 18, Vite 5, React Router 6
- **Blockchain**: Solidity 0.8.20, Hardhat, Ethers.js 6
- **Encryption**: Node.js crypto (AES-256-GCM, SHA-256)
- **Database**: In-memory (for demo simplicity)
- **Styling**: Custom CSS (dark terminal theme)

## ⏱️ Development Time

Built in **12 hours** for the hackathon:
- Backend: 3 hours
- Smart Contracts: 2 hours
- Frontend: 5 hours
- Testing & Documentation: 2 hours

## 🔮 Future Enhancements

If given more time:
- Real Tor hidden service (.onion)
- IPFS integration for 3D scans
- ZK-SNARK privacy proofs
- Persistent database (PostgreSQL)
- MetaMask wallet integration
- Multi-signature escrow
- Decentralized identity (DIDs)
- Live testnet deployment

## 📝 Educational Purpose

This project is for **educational and hackathon purposes only**. It demonstrates:
- Blockchain technology
- Smart contract development
- Privacy and encryption techniques
- Full-stack web development
- Creative problem-solving

Always use technology ethically and legally.

## 🏆 Submission Highlights

**Why this project stands out:**

1. **Complete Implementation** - Full-stack, not just a concept
2. **Novel Concept** - "Bragging Rights" NFTs are unique
3. **Real Smart Contracts** - Deployable to Sepolia testnet
4. **Strong Privacy** - End-to-end encryption, anonymity
5. **Polished UI** - Immersive Tor-themed experience
6. **Well Documented** - README, DEMO guide, QUICKSTART

---

Built with ☕ for the Louvre Heist Hackathon 2025
