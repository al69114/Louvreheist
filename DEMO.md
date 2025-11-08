# 🎬 Demo Guide - The Shadow Mint

## Quick Demo (5 minutes)

### 1. Start the Application

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

Visit: `http://localhost:3000`

### 2. Demo Flow

#### A. Home Page
- Shows the concept and disclaimer
- Displays mixer statistics
- Explains "Bragging Rights" NFTs

#### B. Create an Auction
1. Navigate to **Auctions**
2. Click **"+ Create Auction"**
3. Fill in:
   - Title: "Crown of Louis XV"
   - Description: "Stolen during the Louvre heist, 3D scanned and destroyed"
   - Item Type: "Crown Jewel"
   - Starting Price: 0.5 ETH
   - Reserve Price: 2.0 ETH
   - End Date: (Choose future date)
4. Click **Create Auction**

#### C. Place a Bid
1. Find your auction in the list
2. Click **"Place Bid"**
3. Enter amount higher than current price
4. Click **"Submit Bid"**
5. See the price update in real-time

#### D. Mint an NFT
1. Navigate to **Mint NFT**
2. Fill in:
   - Item Name: "Ruby of the French Crown"
   - 3D Scan URL: `ipfs://QmExample123abc`
   - Description: "High-res 3D scan before destruction"
3. Click **"Mint NFT"**
4. Get Token ID, Contract Address, and TX Hash

#### E. Use the Crypto Mixer
1. Navigate to **Crypto Mixer**
2. Fill in:
   - Currency: Bitcoin (BTC)
   - Input Address: `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa`
   - Output Address: `3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy`
   - Amount: 1.5
3. Click **"Start Mixing"**
4. Transaction ID appears
5. Wait 2 seconds, then check status
6. See status change from "pending" to "completed"

## 🎯 Key Demo Points

### For Judges

1. **Privacy-First Design**
   - Anonymous session IDs (no login required)
   - All wallet addresses encrypted with AES-256-GCM
   - Tor-themed UI emphasizing anonymity

2. **Innovative NFT Concept**
   - "Bragging Rights" - digital ownership of destroyed items
   - Cryptographic destruction proofs on-chain
   - Solves the "hot goods" problem creatively

3. **Smart Contract Architecture**
   - BraggingRightsNFT: ERC-721 with destruction verification
   - CryptoMixer: Pooling, fees, and withdrawal logic
   - Deployable to Sepolia testnet

4. **Full Stack Implementation**
   - Backend: Node.js with encryption utilities
   - Frontend: React with dark Tor theme
   - Database: SQLite with encrypted fields
   - Blockchain: Solidity contracts

### Technical Highlights

- **Encryption**: All sensitive data (addresses, transaction hashes) encrypted at rest
- **Anonymity**: No PII collected, anonymous session IDs
- **Blockchain**: Real smart contracts (deployable)
- **UI/UX**: Immersive dark theme mimicking Tor hidden services

## 📸 Screenshot Points

1. **Home page** - Shows concept and stats
2. **Auction listing** - Multiple items with bids
3. **NFT minting success** - Token ID and contract address
4. **Mixer interface** - Before/after transaction
5. **Mixer status tracking** - Pending → Completed

## 🐛 Troubleshooting

### Backend won't start
```bash
cd backend
rm shadow-mint.db  # Delete old database
npm install
npm run dev
```

### Frontend can't connect
- Ensure backend is running on port 5000
- Check CORS settings in backend/server.js

### Contracts won't compile
```bash
cd contracts
npm install
npx hardhat clean
npx hardhat compile
```

## 🎤 Pitch Points

1. **Problem**: Can't sell stolen crown jewels - too traceable
2. **Solution**: Destroy original, sell NFT of 3D scan
3. **Tech**: Blockchain + encryption + anonymity
4. **Innovation**: First "Bragging Rights" NFT platform
5. **Security**: Crypto mixer for untraceable payments

## ⏱️ 2-Minute Demo Script

> "This is The Shadow Mint - an anonymous e-fencing platform. After the Louvre heist, how do you sell the crown jewels?
>
> [Show auction page] We've created an anonymous auction platform with encrypted bids.
>
> [Show NFT minting] The innovation: we take a 3D scan of the jewel, destroy the original, and mint it as an NFT. Buyers get 'Bragging Rights' - proof they own the digital twin of the most infamous stolen item in history.
>
> [Show crypto mixer] For payments, our smart contract mixer tumbles cryptocurrency through a pool, making transactions untraceable.
>
> [Show encryption code] Everything is encrypted: wallet addresses, transaction hashes, all using AES-256. No personal data stored.
>
> This demonstrates blockchain privacy tech, NFT innovation, and smart contract design - all in one creative hackathon project."

---

Good luck with your demo! 🚀
