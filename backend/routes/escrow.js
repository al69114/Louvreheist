const express = require('express');
const router = express.Router();
const escrow = require('../utils/escrowKeys');

const DEVICE_SECRET = process.env.ESCROW_DEVICE_SECRET || 'shadow-escrow-dev';

function requireDeviceSecret(req, res) {
  const provided = req.get('x-escrow-secret') || req.query.secret;
  if (DEVICE_SECRET && provided !== DEVICE_SECRET) {
    res.status(401).json({ success: false, error: 'Unauthorized hardware bridge' });
    return false;
  }
  return true;
}

router.post('/allocate', (req, res) => {
  try {
    const { auctionId, sellerId } = req.body || {};
    if (!auctionId) {
      return res.status(400).json({ success: false, error: 'auctionId is required' });
    }
    const record = escrow.ensureItemKey(auctionId, sellerId);
    res.json({
      success: true,
      itemKey: record.itemKey,
      escrow: record
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/status/:auctionId', (req, res) => {
  try {
    const { auctionId } = req.params;
    const status = escrow.getStatus(auctionId);
    if (!status) {
      return res.status(404).json({ success: false, error: 'Escrow record not found' });
    }
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/pending', (req, res) => {
  if (!requireDeviceSecret(req, res)) return;
  try {
    const pending = escrow.listPendingPurchases();
    res.json({ success: true, pending });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/item-pending', (req, res) => {
  if (!requireDeviceSecret(req, res)) return;
  try {
    const pending = escrow.listPendingItemKeys();
    res.json({ success: true, pending });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/device/confirm', (req, res) => {
  if (!requireDeviceSecret(req, res)) return;
  try {
    const { auctionId, purchaseKey } = req.body || {};
    if (!auctionId || !purchaseKey) {
      return res.status(400).json({ success: false, error: 'auctionId and purchaseKey required' });
    }
    const result = escrow.confirmRelease(auctionId, purchaseKey);
    res.json({
      success: true,
      itemKey: result.itemKey,
      escrow: result.record
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/device/item-ack', (req, res) => {
  if (!requireDeviceSecret(req, res)) return;
  try {
    const { auctionId } = req.body || {};
    if (!auctionId) {
      return res.status(400).json({ success: false, error: 'auctionId required' });
    }
    const record = escrow.markItemSynced(auctionId);
    res.json({ success: true, escrow: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/device/purchase-ack', (req, res) => {
  if (!requireDeviceSecret(req, res)) return;
  try {
    const { auctionId } = req.body || {};
    if (!auctionId) {
      return res.status(400).json({ success: false, error: 'auctionId required' });
    }
    const record = escrow.markPurchaseSynced(auctionId);
    res.json({ success: true, escrow: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
