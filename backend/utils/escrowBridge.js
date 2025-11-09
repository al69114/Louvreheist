/**
 * Hardware bridge helper.
 * Streams purchase keys from the API to the Arduino over serial and reports release confirmations back.
 * Usage:
 *   ESCROW_SERIAL_PORT=COM5 ESCROW_API_BASE=http://localhost:5000 node utils/escrowBridge.js
 *
 * Requires `serialport` and `axios` dependencies (install inside backend folder).
 */
require('dotenv').config();
const axios = require('axios');

let SerialPort;
try {
  // Lazy require so this file can be imported even when serialport isn't installed yet
  // eslint-disable-next-line global-require
  ({ SerialPort } = require('serialport'));
} catch (error) {
  console.warn('serialport package not installed. Install it with `npm install serialport` inside backend/.');
}

if (!SerialPort) {
  console.error('Serial bridge cannot start without serialport dependency.');
  process.exit(1);
}

const SERIAL_PATH = process.env.ESCROW_SERIAL_PORT || '/dev/ttyACM0';
const SERIAL_BAUD = Number(process.env.ESCROW_SERIAL_BAUD || 115200);
const API_BASE = process.env.ESCROW_API_BASE || 'http://localhost:5000';
const DEVICE_SECRET = process.env.ESCROW_DEVICE_SECRET || 'shadow-escrow-dev';
const POLL_INTERVAL_MS = Number(process.env.ESCROW_POLL_MS || 4000);

const port = new SerialPort({
  path: SERIAL_PATH,
  baudRate: SERIAL_BAUD
});

let readBuffer = '';

port.on('open', () => {
  console.log(`🔌 Serial bridge connected on ${SERIAL_PATH} @ ${SERIAL_BAUD} baud`);
});

port.on('data', (chunk) => {
  readBuffer += chunk.toString();
  let newlineIndex = readBuffer.indexOf('\n');
  while (newlineIndex >= 0) {
    const line = readBuffer.slice(0, newlineIndex).trim();
    readBuffer = readBuffer.slice(newlineIndex + 1);
    if (line) handleSerialLine(line);
    newlineIndex = readBuffer.indexOf('\n');
  }
});

port.on('error', (err) => {
  console.error('Serial port error:', err.message);
});

async function handleSerialLine(line) {
  console.log(`🔁 ${line}`);
  if (!line.startsWith('OK_RELEASE:')) return;

  const payload = line.replace('OK_RELEASE:', '');
  const [auctionId, purchaseKey] = payload.split(':');
  if (!auctionId || !purchaseKey) {
    console.warn('Malformed OK_RELEASE line. Skipping.');
    return;
  }

  try {
    await axios.post(
      `${API_BASE}/api/escrow/device/confirm`,
      { auctionId, purchaseKey },
      { headers: { 'x-escrow-secret': DEVICE_SECRET } }
    );
    console.log(`✅ Release confirmed for auction ${auctionId}`);
  } catch (error) {
    console.error('Failed to notify API of release:', error.message);
  }
}

async function pushPendingPurchases() {
  try {
    const response = await axios.get(`${API_BASE}/api/escrow/pending`, {
      headers: { 'x-escrow-secret': DEVICE_SECRET }
    });

    const pending = response.data?.pending || [];
    pending.forEach((record) => {
      if (!record.purchaseKey) return;
      const keyUpper = record.purchaseKey.toUpperCase();
      const cmd = `ADD:${record.auctionId}:${keyUpper}\n`;
      console.log(`➡️  ${cmd.trim()}`);
      port.write(cmd);
    });
  } catch (error) {
    console.error('Failed to fetch pending purchases:', error.message);
  }
}

setInterval(pushPendingPurchases, POLL_INTERVAL_MS);
pushPendingPurchases();
