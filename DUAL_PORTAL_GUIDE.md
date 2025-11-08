# 🎭 Dual Portal System Guide

The Shadow Mint now has **TWO separate portals**:

## 1. 👑 Admin Portal
**What you see**: http://localhost:3000

### Features:
- **See EVERYTHING** - All auctions from all thieves
- **Generate invite links** for new thieves
- **Manage the platform** holistically
- Create auctions, mint NFTs, use crypto mixer
- Monitor all platform activity

### Access:
- Open http://localhost:3000
- Navigate using the top menu
- Click **"👑 Admin"** to access admin dashboard

### How to Generate Thief Invite Links:
1. Go to http://localhost:3000/admin
2. Click **"+ Generate New Invite Link"**
3. Copy the generated link
4. Send it to the thief

---

## 2. 🕵️ Thief Portal
**What thieves see**: http://localhost:3000/thief/login

### Features:
- **Login/Register** with unique invite code
- **See ONLY their own auctions** (isolated view)
- **Create new auctions** for their items
- **Track bids** on their items
- **Cannot see** other thieves' auctions

### Access for Thieves:

**First Time (Registration):**
1. Receive invite link from admin (e.g., `http://localhost:3000/thief/register?code=abc123...`)
2. Click the link
3. Create username and password
4. Auto-login to thief dashboard

**Returning Users (Login):**
1. Go to http://localhost:3000/thief/login
2. Enter username and password
3. Access thief dashboard

### Thief Dashboard:
- Shows **only their auctions**
- Can create new auctions
- View bids on their items
- **Cannot** see other thieves' items

---

## 🔄 Workflow Example

### Step 1: Admin Generates Invite
```
Admin Portal → Admin Page → Generate Invite Link
Result: http://localhost:3000/thief/register?code=a1b2c3d4...
```

### Step 2: Send Link to Thief
```
Admin sends link to thief via secure channel
```

### Step 3: Thief Registers
```
Thief clicks link → Creates account → Auto-login
```

### Step 4: Thief Creates Auction
```
Thief Dashboard → Create Auction → Fill details → Submit
```

### Step 5: Admin Monitors
```
Admin Portal → Admin Page → See all auctions (including thief's)
OR
Admin Portal → Auctions Page → See all active auctions
```

---

## 🎯 Key Differences

| Feature | Admin Portal | Thief Portal |
|---------|-------------|--------------|
| **URL** | `http://localhost:3000` | `http://localhost:3000/thief/*` |
| **View Auctions** | ALL auctions | ONLY their own |
| **Create Auctions** | Yes (as admin) | Yes (as themselves) |
| **Generate Invites** | ✅ Yes | ❌ No |
| **See Other Thieves** | ✅ Yes | ❌ No |
| **Authentication** | Anonymous session | Username/Password |

---

## 📊 API Endpoints

### Admin Endpoints
- `POST /api/thief/admin/create-invite` - Generate invite link
- `GET /api/thief/admin/invites` - List all invites
- `GET /api/auction/admin/all` - Get ALL auctions

### Thief Endpoints
- `POST /api/thief/register` - Register with invite code
- `POST /api/thief/login` - Login
- `GET /api/thief/my-auctions` - Get only thief's auctions
- `GET /api/thief/profile` - Get thief profile

### Shared Endpoints
- `POST /api/auction/create` - Create auction (sellerId determines ownership)
- `GET /api/auction/active` - List active auctions
- `POST /api/auction/bid` - Place bid

---

## 🧪 Testing the Dual Portal

### Test 1: Admin View
1. Open http://localhost:3000/admin
2. Generate 2 invite links
3. See both links in the table

### Test 2: Create First Thief
1. Copy first invite link
2. Open in incognito/private window
3. Register as "thief1" with password
4. Create auction: "Stolen Diamond Ring"

### Test 3: Create Second Thief
1. Copy second invite link
2. Open in another incognito window
3. Register as "thief2" with password
4. Create auction: "Gold Necklace"

### Test 4: Verify Isolation
1. **Thief1 Dashboard**: Should see ONLY "Stolen Diamond Ring"
2. **Thief2 Dashboard**: Should see ONLY "Gold Necklace"
3. **Admin Portal**: Should see BOTH auctions

---

## 🔐 Security Features

### Thief Portal:
- **JWT Authentication** (7-day expiration)
- **Invite-only registration** (one-time use codes)
- **Password hashing** (bcrypt)
- **Isolated views** (can't see other thieves)

### Admin Portal:
- **Anonymous sessions** (no authentication required)
- **Full visibility** (see everything)
- **Invite link generation** (control access)

---

## 🎨 UI Differences

### Admin Portal Header:
```
🕵️ THE SHADOW MINT
🧅 Admin Portal

[Home] [Auctions] [Mint NFT] [Crypto Mixer] [👑 Admin]
```

### Thief Portal Header:
```
🕵️ THE SHADOW MINT - THIEF PORTAL
🧅 shadow7x2k9mq4.onion
```

---

## 📝 Future Enhancements

- [ ] Admin authentication (currently open)
- [ ] Thief roles (buyer vs seller)
- [ ] Thief messaging system
- [ ] Auction approval workflow
- [ ] Revenue tracking per thief
- [ ] Dispute resolution system

---

## 🐛 Troubleshooting

### "Invalid invite code"
- Make sure the code hasn't been used already
- Generate a new invite link from admin portal

### "Cannot see my auctions"
- Verify you're logged in (check for logout button)
- Check that sellerId matches your thief ID

### "Token expired"
- Log out and log back in
- Tokens expire after 7 days

---

**Built for the Louvre Heist Hackathon 2025** 🚀
