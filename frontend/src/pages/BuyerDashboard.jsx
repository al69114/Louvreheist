import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function BuyerDashboard() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [codename, setCodename] = useState('')
  const [realName, setRealName] = useState('')
  const [saving, setSaving] = useState(false)
  const [scheduleStatus, setScheduleStatus] = useState(null)
  const [auctions, setAuctions] = useState([])
  const [tick, setTick] = useState(0)
  const [selectedAuction, setSelectedAuction] = useState(null)
  const [bidAmount, setBidAmount] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('buyerToken')
    const storedId = localStorage.getItem('buyerId')
    if (!token) {
      navigate('/buyer/login')
      return
    }

    setUsername(storedId || '')

    const fetchProfile = async () => {
      try {
        const response = await axios.get('/api/buyer/profile', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (response?.data?.buyer?.username) {
          setUsername(response.data.buyer.username)
          localStorage.setItem('buyerId', response.data.buyer.username)
        }
        if (response?.data?.buyer?.codename) {
          setCodename(response.data.buyer.codename)
          localStorage.setItem('buyerCodename', response.data.buyer.codename)
        }
      } catch (error) {
        localStorage.removeItem('buyerToken')
        navigate('/buyer/login')
      }
    }

    fetchProfile()
    fetchSchedule()
    fetchAuctions()
  }, [navigate])

  // Live ticking timer while a schedule is enabled or an auction is active
  useEffect(() => {
    if (!scheduleStatus?.schedule?.enabled && !scheduleStatus?.active) return
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [scheduleStatus?.schedule?.enabled, scheduleStatus?.active?.id])

  // Poll backend for schedule/active auction state while enabled
  useEffect(() => {
    if (!scheduleStatus?.schedule?.enabled) return
    const id = setInterval(() => {
      fetchSchedule()
      fetchAuctions()
    }, 5000)
    return () => clearInterval(id)
  }, [scheduleStatus?.schedule?.enabled])

  const fetchSchedule = async () => {
    try {
      const res = await axios.get('/api/auction/admin/schedule')
      setScheduleStatus(res.data)
    } catch (e) {
      // ignore
    }
  }

  const fetchAuctions = async () => {
    try {
      const response = await axios.get('/api/auction/active')
      setAuctions(response.data.auctions || [])
    } catch (error) {
      console.error('Failed to fetch auctions:', error)
    }
  }

  const logout = () => {
    localStorage.removeItem('buyerToken')
    localStorage.removeItem('buyerId')
    localStorage.removeItem('buyerPassword')
    localStorage.removeItem('buyerCodename')
    navigate('/buyer/login')
  }

  const placeBid = async (auctionId) => {
    if (!bidAmount || !username) return

    try {
      await axios.post('/api/auction/bid', {
        auctionId,
        bidderId: username,
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

  const saveProfile = async (e) => {
    e.preventDefault()
    if (!realName || realName.trim().length < 2) return

    setSaving(true)
    try {
      const token = localStorage.getItem('buyerToken')
      const res = await axios.post('/api/buyer/setup-profile', { realName }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res?.data?.codename) {
        setCodename(res.data.codename)
        localStorage.setItem('buyerCodename', res.data.codename)
      }
    } catch (err) {
      // no-op simple handling
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Welcome to Your Buyer Portal</h2>
        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
          Logged in as: <code>{username}</code>
        </p>

        {codename ? (
          <div className="card" style={{ background: '#0a0a0a', border: '1px solid #00ff41', marginBottom: '1rem' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>Your Codename</h4>
            <p style={{ fontFamily: 'monospace', fontSize: '1.2rem', color: '#00ff41' }}>{codename}</p>
            <p className="text-muted" style={{ marginTop: 0 }}>Use this codename in bids or chats.</p>
          </div>
        ) : (
          <div className="card" style={{ background: '#0a0a0a', marginBottom: '1rem' }}>
            <h4 style={{ marginBottom: '1rem' }}>Set Up Your Display Name</h4>
            <p className="text-muted" style={{ marginTop: 0, marginBottom: '1rem' }}>
              Enter your real name. We encrypt it and only show others your codename.
            </p>
            <form onSubmit={saveProfile}>
              <div className="form-group">
                <label>Real Name (encrypted)</label>
                <input
                  type="text"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  placeholder="e.g., Ada Lovelace"
                  required
                />
              </div>
              <button className="btn btn-danger" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save & Generate Codename'}
              </button>
            </form>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn" onClick={logout}>Logout</button>
        </div>
      </div>

      {/* Auction Countdown & Status */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>🔨 Live Auctions</h2>

        {scheduleStatus && (
          <>
            {(() => {
              const startAt = scheduleStatus?.schedule?.startAt ? new Date(scheduleStatus.schedule.startAt) : null
              const endsAt = scheduleStatus?.active?.ends_at ? new Date(scheduleStatus.active.ends_at) : null
              const now = new Date()

              function fmt(seconds) {
                const s = Math.max(0, Math.floor(seconds))
                const m = Math.floor(s / 60)
                const r = s % 60
                return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`
              }

              // Show prominent countdown if waiting to start
              if (scheduleStatus?.schedule?.enabled && startAt && now < startAt) {
                const secs = (startAt - now) / 1000
                return (
                  <div style={{
                    marginTop: '1.5rem',
                    padding: '2rem',
                    background: 'linear-gradient(135deg, rgba(255, 0, 85, 0.2) 0%, rgba(204, 0, 68, 0.1) 100%)',
                    border: '2px solid #ff0055',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <h3 style={{ color: '#00ff41', marginBottom: '1rem', fontSize: '1.2rem' }}>
                      🎯 Next Auction Starting In
                    </h3>
                    <div style={{
                      fontSize: '4rem',
                      fontWeight: 'bold',
                      color: '#ff0055',
                      marginBottom: '1rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.5rem'
                    }}>
                      {fmt(secs)}
                    </div>
                    <p className="text-muted" style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
                      Auction starts at: <code>{startAt.toLocaleTimeString()}</code>
                    </p>
                    <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                      Get ready to place your bids!
                    </p>
                  </div>
                )
              }

              // Show active auction timer
              if (scheduleStatus?.schedule?.enabled && endsAt) {
                const secs = (endsAt - now) / 1000
                return (
                  <div style={{
                    marginTop: '1.5rem',
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.2) 0%, rgba(0, 200, 50, 0.1) 100%)',
                    border: '2px solid #00ff41',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <h3 style={{ color: '#00ff41', marginBottom: '0.5rem', fontSize: '1rem' }}>
                      ⏱️ Current Auction Time Remaining
                    </h3>
                    <div style={{
                      fontSize: '2.5rem',
                      fontWeight: 'bold',
                      color: '#00ff41',
                      marginBottom: '0.5rem',
                      fontFamily: 'monospace'
                    }}>
                      {fmt(secs)}
                    </div>
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                      Ends at: <code>{endsAt.toLocaleTimeString()}</code>
                    </p>
                  </div>
                )
              }

              // No rotation scheduled
              if (!scheduleStatus?.schedule?.enabled) {
                return (
                  <div className="text-muted" style={{ padding: '1.5rem', background: '#0a0a0a', borderRadius: '4px', textAlign: 'center' }}>
                    <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>⏳ Waiting for auction rotation to start</p>
                    <p style={{ fontSize: '0.9rem', marginBottom: 0 }}>The admin will start auctions soon. Check back later!</p>
                  </div>
                )
              }

              return null
            })()}
          </>
        )}
      </div>

      {/* Active Auctions */}
      {auctions.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>🔥 Active Auctions Now</h2>
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
                  className="btn btn-danger"
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
                      <button className="btn btn-danger" onClick={() => placeBid(auction.id)}>
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
        </div>
      )}
    </div>
  )
}
