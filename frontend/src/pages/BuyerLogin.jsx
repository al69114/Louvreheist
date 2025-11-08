import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function BuyerLogin() {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post('/api/buyer/login', {
        password: password
      })

      // Save token and buyer info
      localStorage.setItem('buyerToken', response.data.token)
      localStorage.setItem('buyerId', response.data.buyer.buyerId)
      localStorage.setItem('buyerPassword', password)
      if (response?.data?.buyer?.codename) {
        localStorage.setItem('buyerCodename', response.data.buyer.codename)
      }

      // Redirect to dashboard
      navigate('/buyer/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div style={{ maxWidth: '500px', margin: '4rem auto' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)', border: '2px solid #00ff41' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            🛍️ Buyer Portal
          </h1>

          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <p className="text-muted" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
              Enter the password provided by your admin to access the buyer dashboard.
            </p>
          </div>

          {error && (
            <div style={{ background: 'rgba(255, 0, 85, 0.2)', border: '1px solid #ff0055', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', textAlign: 'center' }}>
              <p className="text-accent" style={{ margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'block' }}>
                🔑 Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="e.g., shadow-mint-2845"
                autoComplete="current-password"
                style={{
                  fontFamily: 'monospace',
                  fontSize: '1.1rem',
                  padding: '1rem',
                  textAlign: 'center',
                  letterSpacing: '0.05em'
                }}
              />
              <small className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.75rem', display: 'block', textAlign: 'center' }}>
                First time? Your password will create your account automatically.
              </small>
            </div>

            <button
              type="submit"
              className="btn btn-danger"
              disabled={loading}
              style={{ width: '100%', fontSize: '1.1rem', padding: '1rem' }}
            >
              {loading ? '⚡ Logging in...' : '🚀 Access Buyer Dashboard'}
            </button>
          </form>
        </div>

        <div className="card mt-2" style={{ background: '#0a0a0a' }}>
          <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>
            🔒 Buyer Portal Features
          </h4>
          <ul style={{ color: '#888', lineHeight: '2' }}>
            <li>✓ Unique password authentication</li>
            <li>✓ View private buyer dashboard</li>
            <li>✓ Auto-account creation on first login</li>
          </ul>
        </div>

        <div className="card mt-2" style={{ background: 'rgba(255, 165, 0, 0.1)', border: '1px solid #ffa500' }}>
          <p style={{ color: '#ffa500', fontSize: '0.9rem', margin: 0 }}>
            💡 Don't have a password? Contact your admin for an invite.
          </p>
        </div>
      </div>
    </div>
  )
}
