import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function Auctions({ anonymousId }) {
  const [auctions, setAuctions] = useState([])
  const [allAuctions, setAllAuctions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedAuction, setSelectedAuction] = useState(null)
  const [bidAmount, setBidAmount] = useState('')

  // Timer state
  const [timerDuration, setTimerDuration] = useState(60) // seconds
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [timerRunning, setTimerRunning] = useState(false)

  useEffect(() => {
    fetchAuctions()
    fetchAllAuctions()
  }, [])

  // Timer countdown effect
  useEffect(() => {
    let interval = null
    if (timerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setTimerRunning(false)
            activateNextAuction()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (timerRunning && timeRemaining === 0) {
      setTimerRunning(false)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerRunning, timeRemaining])

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

  const fetchAllAuctions = async () => {
    try {
      const response = await axios.get('/api/auction/admin/all')
      setAllAuctions(response.data.auctions)
    } catch (error) {
      console.error('Failed to fetch all auctions:', error)
    }
  }

  const startTimer = () => {
    setTimeRemaining(timerDuration)
    setTimerRunning(true)
  }

  const stopTimer = () => {
    setTimerRunning(false)
    setTimeRemaining(null)
  }

  const activateNextAuction = async () => {
    // Find first queued auction
    const queuedAuction = allAuctions.find(a => a.status === 'queued')

    if (queuedAuction) {
      try {
        // Update auction status to active
        await axios.post('/api/auction/activate', {
          auctionId: queuedAuction.id
        })

        // Refresh auctions
        await fetchAuctions()
        await fetchAllAuctions()

        alert(`Auction "${queuedAuction.title}" is now active!`)
      } catch (error) {
        console.error('Failed to activate auction:', error)
        alert('Failed to activate auction')
      }
    } else {
      alert('No queued auctions available')
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const queuedCount = allAuctions.filter(a => a.status === 'queued').length

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1> Active Auctions</h1>

        {/* Timer Controls */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {!timerRunning && timeRemaining === null && (
            <>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label style={{ color: '#888', fontSize: '0.9rem' }}>Duration (sec):</label>
                <input
                  type="number"
                  value={timerDuration}
                  onChange={(e) => setTimerDuration(Math.max(1, parseInt(e.target.value) || 60))}
                  style={{ width: '80px', padding: '0.5rem', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '4px' }}
                />
              </div>
              <button className="btn btn-danger" onClick={startTimer} disabled={queuedCount === 0}>
                ⏱️ Start Timer
              </button>
            </>
          )}

          {timerRunning && (
            <>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ff0055', fontFamily: 'monospace' }}>
                {formatTime(timeRemaining)}
              </div>
              <button className="btn" onClick={stopTimer}>
                ⏹️ Stop Timer
              </button>
            </>
          )}

          {!timerRunning && timeRemaining === 0 && (
            <button className="btn btn-danger" onClick={() => setTimeRemaining(null)}>
              Reset Timer
            </button>
          )}
        </div>
      </div>

      {queuedCount > 0 && (
        <div className="card mb-2" style={{ background: 'rgba(0, 255, 65, 0.05)', border: '1px solid rgba(0, 255, 65, 0.2)' }}>
          <p style={{ margin: 0, color: '#00ff41' }}>
            📋 {queuedCount} auction{queuedCount !== 1 ? 's' : ''} queued and ready to activate
          </p>
        </div>
      )}

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

      {auctions.length > 0 && (
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

      {/* All Auctions Section */}
      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>All Auctions ({allAuctions.length})</h2>
        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
          View all auctions from all thieves across the platform.
        </p>

        {allAuctions.length === 0 ? (
          <div className="card text-center">
            <h3>No auctions yet</h3>
            <p className="text-muted">Waiting for auctions to be created.</p>
          </div>
        ) : (
          <div className="grid">
            {allAuctions.map(auction => (
              <div key={auction.id} className="card" style={{ background: '#141414' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '1.1rem' }}>{auction.title}</h4>
                  <span className={`status ${auction.status === 'active' ? 'status-active' : auction.status === 'queued' ? 'status-pending' : 'status-completed'}`}>
                    {auction.status}
                  </span>
                </div>

                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  Seller ID: <code style={{ color: '#888' }}>{auction.seller_id}</code>
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Current: <strong style={{ color: '#00ff41' }}>{auction.current_price} ETH</strong></span>
                  <span>Reserve: <strong className="text-accent">{auction.reserve_price} ETH</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
