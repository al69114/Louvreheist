const crypto = require('crypto');

// AES-256-GCM encryption for sensitive data
const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || '32-byte-key-for-aes-encryption!!', 'utf-8').slice(0, 32);

/**
 * Encrypt sensitive data (wallet addresses, transaction IDs, etc.)
 */
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return IV, encrypted data, and auth tag concatenated
  return iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
}

/**
 * Decrypt sensitive data
 */
function decrypt(encryptedData) {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const authTag = Buffer.from(parts[2], 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Hash data for anonymity (one-way)
 */
function hash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate anonymous user ID
 */
function generateAnonymousId() {
  return 'anon_' + crypto.randomBytes(16).toString('hex');
}

/**
 * Generate Tor-style onion address (mock)
 */
function generateOnionAddress() {
  return crypto.randomBytes(8).toString('hex') + '.onion';
}

module.exports = {
  encrypt,
  decrypt,
  hash,
  generateAnonymousId,
  generateOnionAddress
};
