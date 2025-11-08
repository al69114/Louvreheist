# 📧 Quick Email Setup Guide

## Enable Email-able Invite Links (5 minutes)

## ⚠️ CRITICAL: Use Network IP, NOT localhost!

**❌ WRONG:** `http://localhost:3000/admin` → Generates links with "localhost" (won't work for other people!)

**✅ RIGHT:** `http://192.168.1.100:3000/admin` → Generates links with your real IP (works for everyone on WiFi!)

---

### Step 1: Find Your IP Address

**Automatic (easiest):**
```bash
./show-network-url.sh
```

**Manual:**
```bash
ipconfig getifaddr en0
```

**Result:** `192.168.1.100` (your IP will be different)

### Step 2: Start the App
```bash
./START.sh
```

The script will now show you:
```
✅ Shadow Mint is starting up!

📍 Backend API: http://localhost:5001
📍 Frontend UI: http://localhost:3000

🌐 Network Access (for other computers on same WiFi):
   http://192.168.1.100:3000          <-- Use this!

📧 To generate email-able invite links, access admin via:
   http://192.168.1.100:3000/admin     <-- Important!
```

### Step 3: Generate Invite Link

1. Open **Network URL** in your browser: `http://192.168.1.100:3000/admin`
2. Click **"+ Generate New Invite Link"**
3. Copy the generated link

The link will automatically be:
```
http://192.168.1.100:3000/thief/register?code=abc123...
```

### Step 4: Email to Thief

Send this email:

```
Subject: Shadow Mint Auction Platform - Invite

Hi,

You've been invited to The Shadow Mint.

Click here to create your account:
http://192.168.1.100:3000/thief/register?code=abc123...

After registration, login at:
http://192.168.1.100:3000/thief/login

Thanks!
```

### Step 5: Thief Clicks Link

The thief (on their computer, same WiFi):
1. Clicks the link
2. Creates username and password
3. Logs in to their dashboard
4. Creates auctions

---

## ✅ That's It!

Now you can:
- ✅ Email invite links
- ✅ Thieves register on their computers
- ✅ Each thief sees only their own auctions
- ✅ You see everything in admin portal

---

## 🌍 For Remote Thieves (Different WiFi)

If the thief is not on your network, use **ngrok**:

```bash
# Install
brew install ngrok

# Run (in a new terminal)
ngrok http 3000

# You'll get:
# https://abc123.ngrok.io -> http://localhost:3000
```

Now your invite links are:
```
https://abc123.ngrok.io/thief/register?code=xyz...
```

Email this - works from **anywhere in the world**!

---

## 🎯 Quick Test

**Same WiFi Test:**
1. Open your phone's browser
2. Connect to same WiFi
3. Go to `http://YOUR_IP:3000`
4. If you see The Shadow Mint, it's working!

---

**See [NETWORK_ACCESS_GUIDE.md](NETWORK_ACCESS_GUIDE.md) for advanced options.**
