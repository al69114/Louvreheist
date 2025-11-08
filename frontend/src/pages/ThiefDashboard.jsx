import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function ThiefDashboard() {
  const navigate = useNavigate()
  const [myAuctions, setMyAuctions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [username, setUsername] = useState('')
  const [thiefId, setThiefId] = useState('')

  useEffect(() => {
    // Check if logged in
    const token = localStorage.getItem('thiefToken')
    const storedUsername = localStorage.getItem('thiefUsername')
    const storedId = localStorage.getItem('thiefId')

    if (!token) {
      navigate('/thief/login')
      return
    }

    setUsername(storedUsername)
    setThiefId(storedId)
    fetchMyAuctions(token, storedId)
  }, [])

  const fetchMyAuctions = async (token, id) => {
    try {
      const response = await axios.get('/api/thief/my-auctions', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMyAuctions(response.data.auctions)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch auctions:', error)
      if (error.response?.status === 401) {
        // Token expired, redirect to login
        localStorage.removeItem('thiefToken')
        navigate('/thief/login')
      }
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('thiefToken')
    localStorage.removeItem('thiefUsername')
    localStorage.removeItem('thiefId')
    navigate('/thief/login')
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
        sellerId: thiefId,
        endsAt: formData.get('endsAt'),
      })

      setShowCreateForm(false)

      // Refresh auctions
      const token = localStorage.getItem('thiefToken')
      fetchMyAuctions(token, thiefId)
    } catch (error) {
      alert('Failed to create auction: ' + (error.response?.data?.error || error.message))
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>🕵️ My Auctions</h1>
          <p className="text-muted">Logged in as: <strong>{username}</strong></p>
        </div>
        <button className="btn btn-danger" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="card mb-2" style={{ background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.1) 0%, rgba(0, 200, 50, 0.05) 100%)' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Welcome to Your Thief Portal</h3>
        <p className="text-muted" style={{ marginBottom: '0' }}>
          You can only see and manage <strong>YOUR</strong> auction items here. Create new listings and track bids.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Your Items ({myAuctions.length})</h2>
        <button className="btn" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : '+ Create New Auction'}
        </button>
      </div>

      {showCreateForm && (
        <div className="card mb-2">
          <h3 style={{ marginBottom: '1rem' }}>Create New Auction</h3>
          <form onSubmit={createAuction}>
            <div className="form-group">
              <label>Item Title</label>
              <input name="title" required placeholder="e.g., Diamond Necklace from Louvre" />
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
            <button type="submit" className="btn btn-danger">Create Auction</button>
          </form>
        </div>
      )}

      {myAuctions.length === 0 ? (
        <div className="card text-center">
          <h3>No auctions yet</h3>
          <p className="text-muted">Create your first auction to get started!</p>
          <button className="btn btn-danger" onClick={() => setShowCreateForm(true)}>
            + Create Auction
          </button>
        </div>
      ) : (
        <div className="grid">
          {myAuctions.map(auction => (
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

              <div style={{ background: '#0a0a0a', padding: '0.75rem', borderRadius: '4px' }}>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  Created:
                </p>
                <span>{new Date(auction.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
