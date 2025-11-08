#!/bin/bash

echo "🕵️  Starting The Shadow Mint..."
echo ""

# Get the absolute path of the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Kill any existing processes on ports 5001, 5000 and 3000
echo "🧹 Cleaning up existing processes..."
lsof -ti:5001 | xargs kill -9 2>/dev/null || true
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

sleep 2

echo ""
echo "🚀 Starting backend server..."
cd "$SCRIPT_DIR/backend" && node server.js &
BACKEND_PID=$!

sleep 3

echo ""
echo "🎨 Starting frontend development server..."
cd "$SCRIPT_DIR/frontend" && npm run dev &
FRONTEND_PID=$!

sleep 2

echo ""
echo "✅ Shadow Mint is starting up!"
echo ""

# Get network IP
NETWORK_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "unknown")

echo "📍 Backend API: http://localhost:5001"
echo "📍 Frontend UI: http://localhost:3000"
echo ""
if [ "$NETWORK_IP" != "unknown" ]; then
  echo "🌐 Network Access (for other computers on same WiFi):"
  echo "   http://$NETWORK_IP:3000"
  echo ""
  echo "📧 To generate email-able invite links, access admin via:"
  echo "   http://$NETWORK_IP:3000/admin"
  echo ""
fi
echo "🧅 Mock Onion Address: shadow7x2k9mq4.onion"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
