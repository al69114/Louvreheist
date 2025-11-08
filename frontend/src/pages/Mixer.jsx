import React, { useState } from 'react'
import axios from 'axios'

export default function Mixer() {
  const [mixData, setMixData] = useState({
    inputAddress: '',
    outputAddress: '',
    amount: '',
    currency: 'BTC'
  })
  const [mixing, setMixing] = useState(false)
  const [mixResult, setMixResult] = useState(null)
  const [trackingId, setTrackingId] = useState('')
  const [trackingResult, setTrackingResult] = useState(null)

  const handleChange = (e) => {
    setMixData({
      ...mixData,
      [e.target.name]: e.target.value
    })
  }

  const submitMix = async (e) => {
    e.preventDefault()
    setMixing(true)

    try {
      const response = await axios.post('/api/mixer/mix', mixData)
      setMixResult(response.data)
      setMixData({ inputAddress: '', outputAddress: '', amount: '', currency: 'BTC' })

      // Auto-track after 2 seconds
      setTimeout(() => {
        checkStatus(response.data.transactionId)
      }, 2000)
    } catch (error) {
      alert('Failed to submit mix: ' + error.message)
    } finally {
      setMixing(false)
    }
  }

  const checkStatus = async (txId) => {
    try {
      const response = await axios.get(`/api/mixer/status/${txId || trackingId}`)
      setTrackingResult(response.data.transaction)
    } catch (error) {
      alert('Failed to check status: ' + error.message)
    }
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem' }}> Crypto Mixer / Tumbler</h1>

      <div className="card mb-2" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)', border: '2px solid #00ff41' }}>
        <h3 style={{ marginBottom: '1rem', color: '#00ff41' }}>
           How the Mixer Works
        </h3>
        <p style={{ color: '#888', lineHeight: '1.8', marginBottom: '1rem' }}>
          Cryptocurrency transactions are traceable on the blockchain. Our mixer breaks the connection
          between the input and output addresses by:
        </p>
        <ol style={{ color: '#888', lineHeight: '2', paddingLeft: '2rem' }}>
          <li>Pooling your crypto with thousands of other transactions</li>
          <li>Splitting and routing through multiple intermediate wallets</li>
          <li>Adding random delays to prevent timing analysis</li>
          <li>Paying out "clean" crypto to your specified address</li>
        </ol>
        <p style={{ color: '#ff0055', lineHeight: '1.8', marginTop: '1rem', fontWeight: 'bold' }}>
          Service fee: 2% of transaction amount
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Mix Cryptocurrency</h3>

          <form onSubmit={submitMix}>
            <div className="form-group">
              <label>Currency</label>
              <select name="currency" value={mixData.currency} onChange={handleChange} required>
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="XMR">Monero (XMR)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Input Address (Your Wallet) *</label>
              <input
                name="inputAddress"
                value={mixData.inputAddress}
                onChange={handleChange}
                required
                placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
              />
              <small className="text-muted" style={{ fontSize: '0.85rem' }}>
                This address will be encrypted and never stored in plaintext
              </small>
            </div>

            <div className="form-group">
              <label>Output Address (Destination) *</label>
              <input
                name="outputAddress"
                value={mixData.outputAddress}
                onChange={handleChange}
                required
                placeholder="3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy"
              />
              <small className="text-muted" style={{ fontSize: '0.85rem' }}>
                Use a completely different wallet for maximum anonymity
              </small>
            </div>

            <div className="form-group">
              <label>Amount *</label>
              <input
                name="amount"
                type="number"
                step="0.0001"
                value={mixData.amount}
                onChange={handleChange}
                required
                placeholder="1.5"
              />
            </div>

            <button
              type="submit"
              className="btn btn-danger"
              disabled={mixing}
              style={{ width: '100%' }}
            >
              {mixing ? 'Submitting...' : '🔄 Start Mixing'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Track Transaction</h3>

          <div className="form-group">
            <label>Transaction ID</label>
            <input
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="Enter transaction ID"
            />
          </div>

          <button
            className="btn"
            onClick={() => checkStatus()}
            style={{ width: '100%', marginBottom: '1.5rem' }}
          >
            Check Status
          </button>

          {trackingResult && (
            <div style={{ background: '#0a0a0a', padding: '1rem', borderRadius: '4px' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Status</h4>

              <div style={{ marginBottom: '0.75rem' }}>
                <span className="text-muted">Status: </span>
                <span className={`status status-${trackingResult.status}`}>
                  {trackingResult.status}
                </span>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <span className="text-muted">Amount: </span>
                <strong>{trackingResult.amount} {trackingResult.currency}</strong>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <span className="text-muted">Created: </span>
                <span>{new Date(trackingResult.created_at).toLocaleString()}</span>
              </div>

              {trackingResult.completed_at && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <span className="text-muted">Completed: </span>
                  <span>{new Date(trackingResult.completed_at).toLocaleString()}</span>
                </div>
              )}

              <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#141414', borderRadius: '4px' }}>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  Mixer TX Hash:
                </p>
                <code style={{ color: '#00ff41', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                  {trackingResult.mixer_tx_hash}
                </code>
              </div>
            </div>
          )}
        </div>
      </div>

      {mixResult && (
        <div className="card mt-2" style={{ background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.1) 0%, rgba(0, 200, 50, 0.05) 100%)', border: '2px solid #00ff41' }}>
          <h3 style={{ marginBottom: '1rem', color: '#00ff41' }}>
            ✅ Mix Submitted Successfully!
          </h3>

          <p style={{ color: '#888', marginBottom: '1rem' }}>
            Your transaction is being tumbled through our mixer network. This process typically takes 2-5 minutes.
          </p>

          <div style={{ background: '#0a0a0a', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
            <p className="text-muted" style={{ marginBottom: '0.5rem' }}>Transaction ID:</p>
            <code style={{ color: '#00ff41', fontSize: '1.2rem' }}>{mixResult.transactionId}</code>
          </div>

          <div style={{ background: '#0a0a0a', padding: '1rem', borderRadius: '4px' }}>
            <p className="text-muted" style={{ marginBottom: '0.5rem' }}>Mixer TX Hash:</p>
            <code style={{ color: '#00ff41', fontSize: '0.9rem', wordBreak: 'break-all' }}>
              {mixResult.mixerTxHash}
            </code>
          </div>

          <p className="text-muted" style={{ marginTop: '1rem' }}>
            Status: <span className="status status-pending">{mixResult.status}</span>
          </p>
          <p className="text-muted">
            Estimated completion: {mixResult.estimatedTime}
          </p>
        </div>
      )}

      <div className="card mt-2" style={{ background: '#0a0a0a' }}>
        <h4 style={{ marginBottom: '1rem' }}>🛡️ Security Features</h4>
        <ul style={{ color: '#888', lineHeight: '2' }}>
          <li>✓ All addresses encrypted with AES-256-GCM</li>
          <li>✓ No logs kept after 24 hours</li>
          <li>✓ Smart contract-based mixing (on-chain verification)</li>
          <li>✓ Tor-compatible for maximum anonymity</li>
        </ul>
      </div>
    </div>
  )
}
