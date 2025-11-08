# 🏗️ The Shadow Mint - Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER (Browser)                          │
│                    http://localhost:3000                        │
│                  🧅 shadow7x2k9mq4.onion                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                      │
│  ┌──────────────┬──────────────┬──────────────┬───────────────┐│
│  │  Home.jsx    │ Auctions.jsx │ MintNFT.jsx  │  Mixer.jsx   ││
│  └──────────────┴──────────────┴──────────────┴───────────────┘│
│                      Dark Tor Theme CSS                         │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js + Express)                    │
│                    http://localhost:5000/api                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API Routes                            │  │
│  │  /user    /auction    /nft    /mixer                    │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│  ┌────────────────────┴─────────────────────────────────────┐  │
│  │         Encryption Layer (AES-256-GCM)                  │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│  ┌────────────────────┴─────────────────────────────────────┐  │
│  │         In-Memory Database                              │  │
│  │  users | auction_items | bids | mixer_transactions    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              BLOCKCHAIN (Ethereum Sepolia)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Smart Contracts (Solidity 0.8.20)             │  │
│  │                                                          │  │
│  │  ┌────────────────────┐  ┌──────────────────────┐     │  │
│  │  │ BraggingRightsNFT │  │   CryptoMixer       │     │  │
│  │  │   (ERC-721)       │  │   (Tumbler)         │     │  │
│  │  │                   │  │                      │     │  │
│  │  │ - mint()          │  │ - deposit()          │     │  │
│  │  │ - tokenURI()      │  │ - withdraw()         │     │  │
│  │  │ - verifyDestruction() │  │ - getPoolStats() │     │  │
│  │  └────────────────────┘  └──────────────────────┘     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Creates Auction

```
Browser → Frontend (Auctions.jsx)
    ↓
POST /api/auction/create
    ↓
Backend (routes/auction.js)
    ↓
Encrypt seller_id (utils/encryption.js)
    ↓
Store in database (config/database.js)
    ↓
Return auction_id to frontend
    ↓
Display in auction list
```

### 2. User Mints NFT

```
Browser → Frontend (MintNFT.jsx)
    ↓
POST /api/nft/mint
    ↓
Backend (routes/nft.js)
    ↓
Generate metadata
    ↓
[Optional] Call BraggingRightsNFT.mint() on blockchain
    ↓
Return token_id and tx_hash
    ↓
Display success with contract address
```

### 3. User Mixes Crypto

```
Browser → Frontend (Mixer.jsx)
    ↓
POST /api/mixer/mix
    ↓
Backend (routes/mixer.js)
    ↓
Encrypt input_address (AES-256-GCM)
    ↓
Encrypt output_address (AES-256-GCM)
    ↓
Generate mock mixer_tx_hash
    ↓
Store encrypted transaction
    ↓
[Optional] Call CryptoMixer.deposit() on blockchain
    ↓
Return transaction_id
    ↓
Simulate mixing (setTimeout 2s)
    ↓
Update status to 'completed'
    ↓
User polls GET /api/mixer/status/:txId
    ↓
Display completed transaction
```

## Security Layers

### Layer 1: Anonymity
- No user registration or login
- Anonymous session IDs (e.g., `anon_a1b2c3d4...`)
- No PII collection
- Tor-compatible design

### Layer 2: Encryption
```javascript
// All sensitive data encrypted at rest
encrypt(walletAddress) → AES-256-GCM → iv:encrypted:authTag
decrypt(encryptedData) → original walletAddress

// One-way hashing for proofs
hash(data) → SHA-256 → proof_hash
```

### Layer 3: Blockchain Privacy
- Smart contract mixing pools
- Delayed withdrawals
- Fee-based obfuscation
- No direct sender-receiver link

## Database Schema (In-Memory)

```javascript
users {
  id: INTEGER,
  anonymous_id: TEXT (unique),
  wallet_address_encrypted: TEXT,
  created_at: DATETIME
}

auction_items {
  id: INTEGER,
  title: TEXT,
  description: TEXT,
  item_type: TEXT,
  nft_token_id: TEXT,
  starting_price: REAL,
  current_price: REAL,
  reserve_price: REAL,
  seller_id: TEXT (encrypted),
  status: TEXT,
  created_at: DATETIME,
  ends_at: DATETIME
}

bids {
  id: INTEGER,
  auction_id: INTEGER,
  bidder_id: TEXT,
  bid_amount: REAL,
  transaction_hash_encrypted: TEXT,
  created_at: DATETIME
}

mixer_transactions {
  id: INTEGER,
  input_address_encrypted: TEXT,
  output_address_encrypted: TEXT,
  amount: REAL,
  currency: TEXT,
  mixer_tx_hash: TEXT,
  status: TEXT,
  created_at: DATETIME,
  completed_at: DATETIME
}
```

## Smart Contract Architecture

### BraggingRightsNFT.sol

```solidity
ERC721
  ├─ mint(to, metadataURI, destructionProof)
  ├─ tokenURI(tokenId) → IPFS metadata
  ├─ verifyDestruction(tokenId) → proof hash
  └─ itemDestructionProof[tokenId]
```

**Purpose**: Mint 1-of-1 NFTs representing destroyed items with cryptographic proof.

### CryptoMixer.sol

```solidity
ReentrancyGuard
  ├─ deposit(secretHash) payable
  │   ├─ Check: MIN_DEPOSIT ≤ value ≤ MAX_DEPOSIT
  │   └─ Store: deposits[hash] = amount
  │
  ├─ withdraw(secret, recipient)
  │   ├─ Verify: secret matches depositHash
  │   ├─ Calculate: fee = amount * 2%
  │   └─ Transfer: (amount - fee) to recipient
  │
  └─ getPoolStats() → (balance, min, max, fee)
```

**Purpose**: Mix cryptocurrency through a pooled contract to break transaction links.

## API Architecture

### RESTful Endpoints

```
/api
├── /user
│   ├── POST /anonymous          # Create session
│   └── GET /:anonymousId        # Get user info
│
├── /auction
│   ├── GET /active              # List auctions
│   ├── POST /create             # Create auction
│   ├── POST /bid                # Place bid
│   ├── GET /:id                 # Get auction
│   └── GET /:id/bids            # Get bids
│
├── /nft
│   ├── POST /mint               # Mint NFT
│   └── GET /:tokenId            # Get metadata
│
└── /mixer
    ├── POST /mix                # Submit transaction
    ├── GET /status/:txId        # Check status
    └── GET /stats               # Get statistics
```

## Frontend Component Tree

```
App.jsx
├── Header
│   ├── Logo
│   ├── OnionBadge
│   └── Navigation
│       ├── HomeLink
│       ├── AuctionsLink
│       ├── MintNFTLink
│       ├── MixerLink
│       └── AnonymousIDDisplay
│
└── Routes
    ├── /         → Home.jsx
    ├── /auctions → Auctions.jsx
    │                ├── AuctionList
    │                ├── CreateAuctionForm
    │                └── BidForm
    ├── /mint     → MintNFT.jsx
    │                ├── MintForm
    │                └── MintResult
    └── /mixer    → Mixer.jsx
                     ├── MixForm
                     ├── TrackingForm
                     └── MixResult
```

## Deployment Architecture

### Development (Current)
```
localhost:3000 (Frontend) ← → localhost:5000 (Backend)
                                       ↓
                              In-Memory Database
```

### Production (Future)
```
Tor Hidden Service (.onion)
        ↓
    Nginx Reverse Proxy
        ↓
    Frontend (Static Files)
        ↓
    Backend (Node.js)
        ↓
    PostgreSQL (Encrypted)
        ↓
    Sepolia Testnet
```

## Technology Choices

### Why Node.js?
- Fast prototyping for hackathon
- Excellent crypto libraries
- Easy web3 integration

### Why React?
- Component-based architecture
- Fast rendering with Vite
- Large ecosystem

### Why In-Memory Database?
- No compilation issues (better-sqlite3 failed on Node 24)
- Perfect for demo/hackathon
- Fast and simple

### Why Sepolia?
- Free testnet ETH from faucets
- Good for demos
- Real blockchain experience

## Performance Considerations

- **Backend**: Handles 100+ concurrent users (in-memory DB)
- **Frontend**: Vite HMR for instant updates
- **Smart Contracts**: Gas-optimized with `runs: 200`
- **Encryption**: Fast AES-256-GCM (hardware accelerated)

## Security Considerations

- ✅ No sensitive data in plaintext
- ✅ CORS enabled for localhost only
- ✅ ReentrancyGuard on smart contracts
- ✅ Input validation on all endpoints
- ⚠️ In-memory DB (data lost on restart - OK for hackathon)
- ⚠️ No rate limiting (would add in production)

---

This architecture balances **speed** (12-hour build), **functionality** (full-stack), and **innovation** (Bragging Rights NFTs) for the hackathon.
