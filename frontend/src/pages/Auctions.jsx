import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function Auctions({ anonymousId }) {
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedAuction, setSelectedAuction] = useState(null)
  const [bidAmount, setBidAmount] = useState('')

  useEffect(() => {
    fetchAuctions()
  }, [])

  const fetchAuctions = async () => {
    try {
      const response = await axios.get('/api/auction/active')
      setAuctions(response.data.auctions)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch auctions:', error)
      setLoading(false)
    }
  }

  const createAuction = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    try {
      await axios.post('/api/auction/create', {
        title: formData.get('title'),
        description: formData.get('description'),
        itemType: formData.get('itemType'),
        startingPrice: parseFloat(formData.get('startingPrice')),
        reservePrice: parseFloat(formData.get('reservePrice')),
        sellerId: anonymousId,
        endsAt: formData.get('endsAt'),
      })

      setShowCreateForm(false)
      fetchAuctions()
    } catch (error) {
      console.error('Failed to create auction:', error)
    }
  }

  const placeBid = async (auctionId) => {
    if (!bidAmount || !anonymousId) return

    try {
      await axios.post('/api/auction/bid', {
        auctionId,
        bidderId: anonymousId,
        bidAmount: parseFloat(bidAmount),
        transactionHash: '0x' + Math.random().toString(16).slice(2)
      })

      alert('Bid placed successfully!')
      setSelectedAuction(null)
      setBidAmount('')
      fetchAuctions()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to place bid')
    }
  }

  if (loading) {
    return <div className="container"><div className="spinner"></div></div>
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>🔨 Active Auctions</h1>
        <button className="btn btn-danger" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : '+ Create Auction'}
        </button>
      </div>

      {showCreateForm && (
        <div className="card mb-2">
          <h3 style={{ marginBottom: '1rem' }}>Create New Auction</h3>
          <form onSubmit={createAuction}>
            <div className="form-group">
              <label>Item Title</label>
              <input name="title" required placeholder="e.g., Crown Jewel of France" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" rows="4" required placeholder="Detailed description..."></textarea>
            </div>
            <div className="form-group">
              <label>Item Type</label>
              <select name="itemType" required>
                <option value="crown-jewel">Crown Jewel</option>
                <option value="artifact">Historical Artifact</option>
                <option value="nft">NFT Bragging Rights</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Starting Price (ETH)</label>
              <input name="startingPrice" type="number" step="0.01" required placeholder="0.5" />
            </div>
            <div className="form-group">
              <label>Reserve Price (ETH)</label>
              <input name="reservePrice" type="number" step="0.01" required placeholder="1.0" />
            </div>
            <div className="form-group">
              <label>Auction Ends At</label>
              <input name="endsAt" type="datetime-local" required />
            </div>
            <button type="submit" className="btn">Create Auction</button>
          </form>
        </div>
      )}

      {auctions.length === 0 ? (
        <div className="card text-center">
          <h3>No active auctions</h3>
          <p className="text-muted">Be the first to create one!</p>
        </div>
      ) : (
        <div className="grid">
          {auctions.map(auction => (
            <div key={auction.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.3rem' }}>{auction.title}</h3>
                <span className="status status-active">{auction.status}</span>
              </div>

              <p className="text-muted" style={{ marginBottom: '1rem' }}>
                {auction.description}
              </p>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="text-muted">Starting Price:</span>
                  <strong>{auction.starting_price} ETH</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="text-muted">Current Bid:</span>
                  <strong style={{ color: '#00ff41' }}>{auction.current_price} ETH</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Reserve:</span>
                  <strong className="text-accent">{auction.reserve_price} ETH</strong>
                </div>
              </div>

              {auction.nft_token_id && (
                <div style={{ background: '#0a0a0a', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
                  <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    NFT Token ID:
                  </p>
                  <code style={{ color: '#00ff41' }}>{auction.nft_token_id}</code>
                </div>
              )}

              <button
                className="btn"
                onClick={() => setSelectedAuction(auction.id)}
              >
                Place Bid
              </button>

              {selectedAuction === auction.id && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#0a0a0a', borderRadius: '4px' }}>
                  <div className="form-group">
                    <label>Your Bid (ETH)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={`Minimum: ${auction.current_price + 0.01}`}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn" onClick={() => placeBid(auction.id)}>
                      Submit Bid
                    </button>
                    <button className="btn" onClick={() => setSelectedAuction(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
