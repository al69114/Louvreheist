const crypto = require('crypto');
const { db } = require('../config/database');

const KEY_BYTES = 32; // 32 bytes -> 64 char hex strings (matches Arduino firmware)

function now() {
  return new Date().toISOString();
}

function generateKey(bytes = KEY_BYTES) {
  return crypto.randomBytes(bytes).toString('hex');
}

function findRecord(auctionId) {
  if (!auctionId && auctionId !== 0) return null;
  const normalized = Number(auctionId);
  return (db.escrow_records || []).find((r) => r.auction_id === normalized) || null;
}

function ensureRecord(auctionId, sellerId) {
  if (!db.escrow_records) db.escrow_records = [];
  if (!db._autoIncrement) db._autoIncrement = {};
  if (!db._autoIncrement.escrow_records) db._autoIncrement.escrow_records = 1;

  let record = findRecord(auctionId);
  if (!record) {
    record = {
      id: db._autoIncrement.escrow_records++,
      auction_id: Number(auctionId),
      seller_id: sellerId || null,
      buyer_id: null,
      item_key: null,
      purchase_key: null,
      status: 'awaiting_purchase',
      transaction_id: null,
      created_at: now(),
      updated_at: now(),
      purchase_generated_at: null,
      released_at: null,
      item_synced_at: null,
      purchase_synced_at: null
    };
    db.escrow_records.push(record);
  } else if (sellerId && !record.seller_id) {
    record.seller_id = sellerId;
  }

  return record;
}

function sanitize(record, opts = {}) {
  if (!record) return null;
  const base = {
    id: record.id,
    auctionId: record.auction_id,
    sellerId: record.seller_id,
    buyerId: record.buyer_id,
    status: record.status,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    purchaseGeneratedAt: record.purchase_generated_at,
    releasedAt: record.released_at,
    hasItemKey: Boolean(record.item_key),
    hasPurchaseKey: Boolean(record.purchase_key),
    transactionId: record.transaction_id,
    itemSyncedAt: record.item_synced_at,
    purchaseSyncedAt: record.purchase_synced_at
  };

  if (opts.includeKeys) {
    base.itemKey = record.item_key;
    base.purchaseKey = record.purchase_key;
  } else if (opts.includeItemKeyWhenReleased && record.status === 'released') {
    base.itemKey = record.item_key;
  }

  return base;
}

function ensureItemKey(auctionId, sellerId) {
  const record = ensureRecord(auctionId, sellerId);
  if (!record.item_key) {
    record.item_key = generateKey();
    record.item_synced_at = null;
  }
  record.updated_at = now();
  if (!record.status) record.status = 'awaiting_purchase';
  return sanitize(record, { includeKeys: true });
}

function issuePurchaseKey(auctionId, buyerId, transactionId) {
  const record = ensureItemKey(auctionId);
  record.purchase_key = generateKey();
  record.buyer_id = buyerId || record.buyer_id || null;
  record.transaction_id = transactionId || record.transaction_id || null;
  record.status = 'awaiting_release';
  record.purchase_generated_at = now();
  record.updated_at = record.purchase_generated_at;
  record.purchase_synced_at = null;

  return {
    purchaseKey: record.purchase_key,
    record: sanitize(record, { includeKeys: true })
  };
}

function confirmRelease(auctionId, purchaseKey) {
  const record = findRecord(auctionId);
  if (!record) throw new Error('Escrow record not found');
  if (!record.purchase_key) throw new Error('Purchase key not provisioned');
  if (record.purchase_key !== purchaseKey) throw new Error('Purchase key mismatch');

  record.status = 'released';
  record.released_at = now();
  record.updated_at = record.released_at;

  return {
    itemKey: record.item_key,
    purchaseKey: record.purchase_key,
    record: sanitize(record, { includeKeys: true })
  };
}

function getStatus(auctionId) {
  return sanitize(findRecord(auctionId), { includeItemKeyWhenReleased: true });
}

function listPendingPurchases() {
  return (db.escrow_records || [])
    .filter((record) => record.status === 'awaiting_release' && record.purchase_key && !record.purchase_synced_at)
    .map((record) => sanitize(record, { includeKeys: true }));
}

function resetEscrow(auctionId) {
  const record = findRecord(auctionId);
  if (!record) return null;
  record.status = 'awaiting_purchase';
  record.purchase_key = null;
  record.buyer_id = null;
  record.transaction_id = null;
  record.purchase_generated_at = null;
  record.released_at = null;
  record.updated_at = now();
  return sanitize(record, { includeKeys: true });
}

function markItemSynced(auctionId) {
  const record = findRecord(auctionId);
  if (record) {
    record.item_synced_at = now();
    record.updated_at = record.item_synced_at;
  }
  return sanitize(record);
}

function markPurchaseSynced(auctionId) {
  const record = findRecord(auctionId);
  if (record) {
    record.purchase_synced_at = now();
    record.updated_at = record.purchase_synced_at;
  }
  return sanitize(record);
}

function listPendingItemKeys() {
  return (db.escrow_records || [])
    .filter((record) => record.item_key && !record.item_synced_at)
    .map((record) => sanitize(record, { includeKeys: true }));
}

module.exports = {
  ensureItemKey,
  issuePurchaseKey,
  confirmRelease,
  getStatus,
  listPendingPurchases,
  resetEscrow,
  findRecord,
  listPendingItemKeys,
  markItemSynced,
  markPurchaseSynced
};
