const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const THIEVES_FILE = path.join(DATA_DIR, 'thieves.json');
const BUYERS_FILE = path.join(DATA_DIR, 'buyers.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(THIEVES_FILE)) {
    fs.writeFileSync(THIEVES_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
  if (!fs.existsSync(BUYERS_FILE)) {
    fs.writeFileSync(BUYERS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function readThieves() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(THIEVES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function writeThieves(thieves) {
  ensureDataFile();
  fs.writeFileSync(THIEVES_FILE, JSON.stringify(thieves, null, 2), 'utf-8');
}

/**
 * Save or update a thief record in JSON file.
 * Does not store sensitive password/hash. Invite code is optional and masked.
 */
function upsertThiefRecord({ id, username, invite_code, created_at }) {
  const thieves = readThieves();
  const idx = thieves.findIndex(t => t.id === id);

  const maskedInvite = invite_code
    ? { invite_code_last4: String(invite_code).slice(-4) }
    : {};

  const now = new Date().toISOString();

  if (idx === -1) {
    const record = {
      id,
      username,
      created_at: created_at || now,
      recorded_at: now,
      ...maskedInvite
    };
    thieves.push(record);
  } else {
    thieves[idx] = {
      ...thieves[idx],
      username,
      last_seen_at: now,
      ...maskedInvite
    };
  }

  writeThieves(thieves);
}

module.exports = {
  upsertThiefRecord,
  readThieves
};

// Buyers JSON helpers
function readBuyers() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(BUYERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function writeBuyers(buyers) {
  ensureDataFile();
  fs.writeFileSync(BUYERS_FILE, JSON.stringify(buyers, null, 2), 'utf-8');
}

function upsertBuyerRecord({ id, username, invite_code, created_at, codename }) {
  const buyers = readBuyers();
  const idx = buyers.findIndex(b => b.id === id);

  const maskedInvite = invite_code
    ? { invite_code_last4: String(invite_code).slice(-4) }
    : {};

  const now = new Date().toISOString();

  if (idx === -1) {
    const record = {
      id,
      username,
      created_at: created_at || now,
      recorded_at: now,
      ...maskedInvite,
      ...(codename ? { codename } : {})
    };
    buyers.push(record);
  } else {
    buyers[idx] = {
      ...buyers[idx],
      username,
      last_seen_at: now,
      ...maskedInvite,
      ...(codename ? { codename } : {})
    };
  }

  writeBuyers(buyers);
}

module.exports.upsertBuyerRecord = upsertBuyerRecord;
module.exports.readBuyers = readBuyers;
