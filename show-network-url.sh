#!/bin/bash

echo "🌐 Finding your network IP address..."
echo ""

# Try to get IP address
IP=$(ipconfig getifaddr en0 2>/dev/null)

if [ -z "$IP" ]; then
  # Try en1 if en0 didn't work
  IP=$(ipconfig getifaddr en1 2>/dev/null)
fi

if [ -z "$IP" ]; then
  echo "❌ Could not automatically detect IP address"
  echo ""
  echo "Manual methods:"
  echo "1. Run: ipconfig getifaddr en0"
  echo "2. Or check System Preferences → Network"
  echo ""
else
  echo "✅ Your network IP address: $IP"
  echo ""
  echo "📍 Admin Portal URLs:"
  echo "   Local (only this computer):  http://localhost:3000/admin"
  echo "   Network (other computers):   http://$IP:3000/admin"
  echo ""
  echo "🎯 To generate email-able invite links:"
  echo "   1. Open: http://$IP:3000/admin"
  echo "   2. Click 'Generate Invite Link'"
  echo "   3. Email the link to the thief"
  echo ""
  echo "📧 Thieves on the same WiFi can then:"
  echo "   - Click the link"
  echo "   - Create their account"
  echo "   - Access their dashboard at: http://$IP:3000/thief/login"
  echo ""
fi
