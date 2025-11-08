import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function Admin() {
  const [inviteLinks, setInviteLinks] = useState([])
  const [newLink, setNewLink] = useState(null)
  const [buyerInviteLinks, setBuyerInviteLinks] = useState([])
  const [newBuyerLink, setNewBuyerLink] = useState(null)
  const [allAuctions, setAllAuctions] = useState([])

  useEffect(() => {
    fetchInvites()
    fetchBuyerInvites()
    fetchAllAuctions()
  }, [])

  const fetchInvites = async () => {
    try {
      const response = await axios.get('/api/thief/admin/invites')
      setInviteLinks(response.data.links)
    } catch (error) {
      console.error('Failed to fetch invites:', error)
    }
  }

  const fetchBuyerInvites = async () => {
    try {
      const response = await axios.get('/api/buyer/admin/invites')
      setBuyerInviteLinks(response.data.links)
    } catch (error) {
      console.error('Failed to fetch buyer invites:', error)
    }
  }

  const fetchAllAuctions = async () => {
    try {
      const response = await axios.get('/api/auction/admin/all')
      setAllAuctions(response.data.auctions)
    } catch (error) {
      console.error('Failed to fetch auctions:', error)
    }
  }

  const generateInviteLink = async () => {
    try {
      const response = await axios.post('/api/thief/admin/create-invite')
      setNewLink(response.data)
      fetchInvites()

      // Auto-clear after 5 seconds
      setTimeout(() => setNewLink(null), 10000)
    } catch (error) {
      alert('Failed to generate invite link')
    }
  }

  const generateBuyerInviteLink = async () => {
    try {
      const response = await axios.post('/api/buyer/admin/create-invite')
      setNewBuyerLink(response.data)
      fetchBuyerInvites()

      // Auto-clear after 10 seconds
      setTimeout(() => setNewBuyerLink(null), 10000)
    } catch (error) {
      alert('Failed to generate buyer invite link')
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem' }}>🛠️ Admin Portal</h1>

      <div className="card mb-2" style={{ background: 'linear-gradient(135deg, #ff0055 0%, #cc0044 100%)' }}>
        <h3 style={{ marginBottom: '1rem', color: 'white' }}>⚠️ Admin Dashboard</h3>
        <p style={{ color: 'white', marginBottom: 0 }}>
          This is the admin view. You can see ALL auctions from all thieves and generate invite links.
        </p>
      </div>

      {/* Generate Invite Links */}
      <div className="card mb-2">
        <h2 style={{ marginBottom: '1rem' }}>🔗 Generate Seller Invite Links</h2>
        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
          Create unique invite links for new thieves to join the platform.
        </p>

        <button className="btn btn-danger" onClick={generateInviteLink}>
          + Generate New Invite Link
        </button>

        {newLink && (
          <div className="card mt-2" style={{ background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.1) 0%, rgba(0, 200, 50, 0.05) 100%)', border: '2px solid #00ff41' }}>
            <h4 style={{ marginBottom: '1rem', color: '#00ff41' }}>✅ New Invite Link Generated!</h4>

            <div style={{ background: '#0a0a0a', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
              <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                Password (Save this!):
              </p>
              <code style={{ color: '#ff0055', fontSize: '1.2rem', wordBreak: 'break-all', fontWeight: 'bold' }}>
                {newLink.password}
              </code>
            </div>

            <div style={{ background: '#0a0a0a', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
              <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                Full URL:
              </p>
              <code style={{ color: '#00ff41', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                {window.location.origin}{newLink.inviteLink}
              </code>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn btn-danger"
                onClick={() => copyToClipboard(newLink.password)}
              >
                📋 Copy Password
              </button>
              <button
                className="btn"
                onClick={() => copyToClipboard(`${window.location.origin}${newLink.inviteLink}`)}
              >
                📋 Copy Link
              </button>
              <button
                className="btn"
                onClick={() => copyToClipboard(newLink.code)}
              >
                📋 Copy Code
              </button>
            </div>
          </div>
        )}
      </div>

      {/* All Invite Links */}
      <div className="card mb-2">
        <h3 style={{ marginBottom: '1rem' }}>All Invite Links ({inviteLinks.length})</h3>

        {inviteLinks.length === 0 ? (
          <p className="text-muted">No invite links generated yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #333' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Password</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Code</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Created</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {inviteLinks.map(link => (
                  <tr key={link.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <code style={{ color: '#ff0055', fontSize: '0.9rem', fontWeight: 'bold' }}>{link.password}</code>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <code style={{ color: '#00ff41', fontSize: '0.85rem' }}>{link.code}</code>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {link.used ? (
                        <span className="status status-completed">Used</span>
                      ) : (
                        <span className="status status-active">Available</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#888' }}>
                      {new Date(link.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <button
                        className="btn"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', marginRight: '0.5rem' }}
                        onClick={() => copyToClipboard(link.password)}
                      >
                        Copy Password
                      </button>
                      {!link.used && (
                        <button
                          className="btn"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                          onClick={() => copyToClipboard(`${window.location.origin}/thief/register?code=${link.code}`)}
                        >
                          Copy Link
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Buyer Invite Links */}
      <div className="card mb-2">
        <h2 style={{ marginBottom: '1rem' }}>🛒 Generate Buyer Invite Links</h2>
        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
          Create unique invite links for new buyers to join the platform.
        </p>

        <button className="btn btn-danger" onClick={generateBuyerInviteLink}>
          + Generate New Buyer Invite
        </button>

        {newBuyerLink && (
          <div className="card mt-2" style={{ background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.1) 0%, rgba(0, 200, 50, 0.05) 100%)', border: '2px solid #00ff41' }}>
            <h4 style={{ marginBottom: '1rem', color: '#00ff41' }}>✅ New Buyer Invite Generated!</h4>

            <div style={{ background: '#0a0a0a', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
              <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                Password (Save this!):
              </p>
              <code style={{ color: '#ff0055', fontSize: '1.2rem', wordBreak: 'break-all', fontWeight: 'bold' }}>
                {newBuyerLink.password}
              </code>
            </div>

            <div style={{ background: '#0a0a0a', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
              <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                Full URL:
              </p>
              <code style={{ color: '#00ff41', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                {window.location.origin}/buyer
              </code>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn btn-danger"
                onClick={() => copyToClipboard(newBuyerLink.password)}
              >
                📋 Copy Password
              </button>
              <button
                className="btn"
                onClick={() => copyToClipboard(`${window.location.origin}/buyer`)}
              >
                📋 Copy Link
              </button>
            </div>
          </div>
        )}
      </div>

      {/* All Buyer Invite Links */}
      <div className="card mb-2">
        <h3 style={{ marginBottom: '1rem' }}>All Buyer Invite Links ({buyerInviteLinks.length})</h3>

        {buyerInviteLinks.length === 0 ? (
          <p className="text-muted">No buyer invite links generated yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #333' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Password</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Code</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Created</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {buyerInviteLinks.map(link => (
                  <tr key={link.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <code style={{ color: '#ff0055', fontSize: '0.9rem', fontWeight: 'bold' }}>{link.password}</code>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <code style={{ color: '#00ff41', fontSize: '0.85rem' }}>{link.code}</code>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {link.used ? (
                        <span className="status status-completed">Used</span>
                      ) : (
                        <span className="status status-active">Available</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#888' }}>
                      {new Date(link.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <button
                        className="btn"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', marginRight: '0.5rem' }}
                        onClick={() => copyToClipboard(link.password)}
                      >
                        Copy Password
                      </button>
                      {!link.used && (
                        <button
                          className="btn"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                          onClick={() => copyToClipboard(`${window.location.origin}/buyer`)}
                        >
                          Copy Link
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* All Auctions */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>All Auctions ({allAuctions.length})</h3>
        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
          View all auctions from all thieves across the platform.
        </p>

        {allAuctions.length === 0 ? (
          <p className="text-muted">No auctions created yet.</p>
        ) : (
          <div className="grid">
            {allAuctions.map(auction => (
              <div key={auction.id} className="card" style={{ background: '#141414' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '1.1rem' }}>{auction.title}</h4>
                  <span className="status status-active">{auction.status}</span>
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
