# 🌐 Network Access Guide

## Making The Shadow Mint Accessible to Other Computers

By default, the app runs on `localhost` which only works on your computer. To email invite links to thieves on different computers, you need to make the server accessible on your network.

---

## 🚀 Quick Setup (Same Network)

If you and the thieves are on the **same WiFi/network**, follow these steps:

### Step 1: Find Your Computer's IP Address

**On Mac:**
```bash
ipconfig getifaddr en0
```

**On Windows:**
```bash
ipconfig
```
Look for "IPv4 Address"

**On Linux:**
```bash
hostname -I
```

You'll get something like: `192.168.1.100`

### Step 2: Update Vite Config

Edit `frontend/vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Listen on all network interfaces
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  }
})
```

### Step 3: Restart the Frontend

```bash
# Kill the frontend
pkill -f "vite"

# Restart
cd frontend
npm run dev
```

### Step 4: Access from Other Computers

Now you can access the app from other computers on the same network:

**Your computer:**
- http://localhost:3000 (still works)

**Other computers on same WiFi:**
- http://192.168.1.100:3000 (replace with your IP)

### Step 5: Generate Invite Links

1. Go to http://YOUR_IP:3000/admin
2. Generate invite link
3. The link will now be: `http://192.168.1.100:3000/thief/register?code=abc123...`
4. Email this link to the thief
5. They can click it on their computer (must be on same network)

---

## 🌍 Public Internet Access (Advanced)

If you want thieves on **different networks** (different WiFi/homes) to access, you need to expose your server to the internet.

### Option 1: ngrok (Easiest)

1. **Install ngrok:**
```bash
# Mac
brew install ngrok

# Or download from https://ngrok.com/download
```

2. **Run ngrok:**
```bash
ngrok http 3000
```

3. **You'll get a URL:**
```
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
```

4. **Now your invite links will be:**
```
https://abc123.ngrok.io/thief/register?code=xyz...
```

5. **Email this link** - anyone anywhere can use it!

**Note:** Free ngrok URLs change every time you restart. Paid plans give you permanent URLs.

### Option 2: Port Forwarding (More permanent)

1. **Set up port forwarding on your router:**
   - Forward port 3000 to your computer's local IP
   - Google "[your router model] port forwarding" for specific steps

2. **Find your public IP:**
```bash
curl ifconfig.me
```

3. **Access via:**
```
http://YOUR_PUBLIC_IP:3000
```

**Warning:** This exposes your computer to the internet. Use firewalls and consider security implications.

### Option 3: Deploy to Cloud (Production)

For a real deployment, use:
- **Vercel** (frontend) + **Railway** (backend)
- **Heroku** (both)
- **AWS/DigitalOcean** (full control)

---

## 🔒 Security Considerations

### Same Network (Safe)
- ✅ Only people on your WiFi can access
- ✅ Good for hackathon demos
- ✅ No internet exposure

### ngrok (Temporary Public)
- ⚠️ Anyone with the URL can access
- ⚠️ URL changes each time
- ✅ Good for quick testing with remote users

### Port Forwarding (Permanent Public)
- ⚠️ Your computer is exposed to the internet
- ⚠️ Security risk if not configured properly
- ⚠️ Consider firewall rules and HTTPS

---

## 📧 Email Template for Thieves

Once you have your public URL, send this email:

```
Subject: Shadow Mint Invite - Create Your Account

Hi,

You've been invited to join The Shadow Mint auction platform.

Click this link to create your account:
[YOUR INVITE LINK]

This is a one-time use link. After registration, you can login at:
[YOUR BASE URL]/thief/login

See you on the dark web!
```

---

## 🧪 Testing Network Access

### Test 1: Same Computer
```bash
curl http://localhost:3000/api/health
```

### Test 2: Same Network (from another computer)
```bash
curl http://192.168.1.100:3000/api/health
```

### Test 3: Public (if using ngrok)
```bash
curl https://abc123.ngrok.io/api/health
```

All should return:
```json
{"status":"online","service":"The Shadow Mint",...}
```

---

## 🎯 Recommended Setup for Hackathon

**Local Demo (judges in same room):**
- Use laptop as hotspot
- Connect judges' devices to your hotspot
- Access via your IP: `192.168.X.X:3000`

**Remote Demo (judges online):**
- Use ngrok: `ngrok http 3000`
- Share ngrok URL with judges
- Works from anywhere

**Production (if you win!):**
- Deploy frontend to Vercel
- Deploy backend to Railway
- Buy a domain
- Add real Tor hidden service

---

## 🐛 Troubleshooting

### "Can't access from other computer"
- ✅ Check firewall settings (allow port 3000)
- ✅ Verify you're on the same network
- ✅ Make sure `host: '0.0.0.0'` in vite.config.js
- ✅ Restart both backend and frontend

### "Invite link shows localhost"
- ✅ Access admin page via your IP (not localhost)
- ✅ Backend will use the request host in the link

### "ngrok URL doesn't work"
- ✅ Make sure both backend (5001) and frontend (3000) are running
- ✅ ngrok should point to 3000 (the frontend)
- ✅ Frontend proxies API requests to backend

---

**Built for the Louvre Heist Hackathon 2025** 🚀
