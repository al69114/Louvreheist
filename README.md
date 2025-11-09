# 🕵️ The Shadow Mint

**The world's first anonymous e-fencing platform for the Louvre Heist hackathon**

## 🎯 Concept

After the infamous Louvre heist where thieves stole 8 pieces of the French Crown Jewels, selling them becomes the challenge. The Shadow Mint is a creative solution combining:

- **Dual Portal System**: Separate admin and thief portals with isolated views
- **Anonymous Tor-style Auction Platform**: Secure, invite-only marketplace
- **NFT "Bragging Rights"**: 3D scan the jewel, destroy the original, mint as NFT
- **Crypto Mixer Smart Contract**: Untraceable payments through blockchain tumbling

## 🎭 NEW: Dual Portal System

The Shadow Mint now features **two separate portals**:

### 👑 Admin Portal (`http://localhost:3000`)
- **See EVERYTHING** - All auctions from all thieves
- Generate invite links for new thieves
- Manage the platform holistically
- Access: http://localhost:3000/admin

### 🕵️ Thief Portal (`http://localhost:3000/thief/login`)
- **Isolated view** - Each thief sees ONLY their own auctions
- Login with username/password (invite-only registration)
- Create and manage their own listings
- Access: http://localhost:3000/thief/login

### 📧 Email Invite Links to Anyone
- **NEW**: Invite links work across different computers!
- Generate link → Email to thief → They register on their computer
- Works on same WiFi network (no extra setup needed)
- **See [QUICK_EMAIL_SETUP.md](QUICK_EMAIL_SETUP.md) for 5-minute setup**
- For remote users (different networks), see [NETWORK_ACCESS_GUIDE.md](NETWORK_ACCESS_GUIDE.md)

**See [DUAL_PORTAL_GUIDE.md](DUAL_PORTAL_GUIDE.md) for complete documentation.**

## ⚠️ DISCLAIMER

This is a **hackathon project for educational purposes only**. It demonstrates blockchain technology, encryption, and privacy concepts. No actual illegal activity is endorsed or supported.

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Encryption**: AES-256-GCM for sensitive data
- **Database**: SQLite with encrypted fields
- **Anonymous Authentication**: Session-based with no PII
- **API Routes**: Auctions, NFT minting, crypto mixing

### Smart Contracts (Solidity)
- **BraggingRightsNFT**: ERC-721 NFTs with destruction proofs
- **CryptoMixer**: Conceptual tumbler with pooling and fee structure
- **Network**: Ethereum Sepolia Testnet

### Frontend (React + Vite)
- **Dark Tor-themed UI**: Hacker-style interface
- **Pages**: Home, Auctions, Mint NFT, Crypto Mixer
- **Real-time Updates**: Auction bidding and mixer tracking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install smart contract dependencies (optional)
cd ../contracts
npm install
```

### Running the Application

**Option 1: Run everything at once**
```bash
# From project root
npm install  # Install concurrently
npm run dev
```

**Option 2: Run individually**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Access the app at: `http://localhost:3000`

## 📁 Project Structure

```
Louvreheist/
├── backend/              # Node.js API server
│   ├── config/          # Database configuration
│   ├── routes/          # API endpoints
│   │   ├── auction.js   # Auction CRUD
│   │   ├── mixer.js     # Crypto mixing
│   │   ├── nft.js       # NFT minting
│   │   └── user.js      # Anonymous auth
│   ├── utils/           # Encryption utilities
│   └── server.js        # Express app
├── contracts/           # Solidity smart contracts
│   ├── contracts/
│   │   ├── BraggingRightsNFT.sol
│   │   └── CryptoMixer.sol
│   ├── scripts/         # Deployment scripts
│   └── test/            # Contract tests
└── frontend/            # React application
    └── src/
        ├── pages/       # Main pages
        │   ├── Home.jsx
        │   ├── Auctions.jsx
        │   ├── MintNFT.jsx
        │   └── Mixer.jsx
        └── styles/      # Dark theme CSS
```

## 🔑 Key Features

### 1. Anonymous Auctions
- Create and browse auction listings
- Place encrypted bids
- Automatic price updates
- Seller anonymity protection

### 2. NFT Bragging Rights
- Mint 1-of-1 NFTs from 3D scans
- Cryptographic destruction proofs
- On-chain metadata storage
- Sepolia testnet deployment

### 3. Crypto Mixer
- Bitcoin/Ethereum/Monero support (mock)
- Address encryption (AES-256-GCM)
- Transaction pooling simulation
- 2% mixing fee
- Status tracking

### 4. Security & Privacy
- End-to-end encryption
- Anonymous session IDs
- No personal data collection
- Tor-compatible design

## 🧪 Testing Smart Contracts

```bash
cd contracts
npx hardhat test
npx hardhat compile
```

## 🚢 Deploying Contracts

1. Get Sepolia testnet ETH from a faucet
2. Update `.env` with your Infura key and private key
3. Deploy:

```bash
cd contracts
npx hardhat run scripts/deploy.js --network sepolia
```

4. Copy contract addresses to `backend/.env`

## 🎨 Demo Data

The application includes mock data for demonstration:
- Sample crown jewel auctions
- NFT metadata examples
- Mixer transaction simulations

## 📊 API Endpoints

### Users
- `POST /api/user/anonymous` - Create anonymous session
- `GET /api/user/:anonymousId` - Get user info

### Auctions
- `GET /api/auction/active` - List active auctions
- `POST /api/auction/create` - Create auction

### Escrow Bridge
- `GET /api/escrow/status/:auctionId` – Poll item/purchase state
- `GET /api/escrow/pending` – (hardware) fetch purchase keys waiting to be loaded
- `POST /api/escrow/device/confirm` – (hardware) confirm a successful token match

## 🔐 Hardware Escrow Integration

The `Louvre-Random` Arduino sketch now stores 32-byte purchase keys and emits `OK_RELEASE:<auctionId>:<hexKey>` once a buyer enters a matching code. The web stack orchestrates that process with in-memory escrow records:

1. **Seller creates auction** → backend generates an `itemKey` and stores it off-chain.
2. **Buyer wins & pays** → `/api/transaction/create` logs the payment and issues a 32-byte `purchaseKey`.
3. **Hardware bridge** continuously calls `/api/escrow/pending`, pushes `ADD:<auctionId>:<purchaseKey>` to the Arduino, and waits for `OK_RELEASE`.
4. **Arduino match** → the bridge POSTs `/api/escrow/device/confirm` so the site can reveal the item key to the buyer and trigger the payout workflow for the seller.

### Running the bridge script

```bash
cd backend
npm install              # also installs serialport/axios if not already present
ESCROW_SERIAL_PORT=COM5 \
ESCROW_API_BASE=http://localhost:5000 \
ESCROW_DEVICE_SECRET=shadow-escrow-dev \
node utils/escrowBridge.js
```

Environment variables:

| Variable | Description | Default |
| --- | --- | --- |
| `ESCROW_SERIAL_PORT` | Serial device path (e.g., `COM5`, `/dev/ttyACM0`) | `/dev/ttyACM0` |
| `ESCROW_SERIAL_BAUD` | Baud rate for the Arduino | `115200` |
| `ESCROW_API_BASE` | HTTP URL for the Express backend | `http://localhost:5000` |
| `ESCROW_DEVICE_SECRET` | Shared secret required by the `/api/escrow/*` device endpoints | `shadow-escrow-dev` |
| `ESCROW_POLL_MS` | Polling cadence for pending purchases | `4000` |

Once the bridge is up, the Buyer portal automatically transitions to a **Vault Release** screen after payment and displays the redeemable `itemKey` the moment the hardware reports success.
- `POST /api/auction/bid` - Place bid
- `GET /api/auction/:id` - Get auction details
- `GET /api/auction/:id/bids` - Get bids

### NFT
- `POST /api/nft/mint` - Mint NFT
- `GET /api/nft/:tokenId` - Get NFT metadata

### Mixer
- `POST /api/mixer/mix` - Submit mix transaction
- `GET /api/mixer/status/:txId` - Check status
- `GET /api/mixer/stats` - Get mixer statistics

## 🛠️ Technology Stack

- **Backend**: Node.js, Express, better-sqlite3
- **Frontend**: React 18, Vite, React Router
- **Blockchain**: Solidity, Hardhat, Ethers.js
- **Encryption**: Node.js crypto (AES-256-GCM)
- **Styling**: Custom CSS (Tor dark theme)

## 🏆 Hackathon Features Implemented

✅ **Prevent**: Destroy originals, only NFTs remain
✅ **Solve**: Blockchain tracking (for demo purposes)
✅ **Commit**: Full e-fencing pipeline with anonymity
✅ **Creativity**: NFT "Bragging Rights" concept
✅ **Innovation**: Crypto mixer smart contract

## 🔮 Future Enhancements

- Real Tor hidden service deployment
- IPFS integration for 3D scans
- ZK-SNARK privacy proofs
- Multi-signature escrow
- Decentralized identity (DIDs)

## 📝 License

MIT License - Educational purposes only

## 👥 Team

Built for the Louvre Heist Hackathon 2025

---

**Remember**: This is a creative hackathon project exploring security and blockchain concepts. Always use technology ethically and legally.
