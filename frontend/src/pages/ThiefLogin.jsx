import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function ThiefLogin() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const inviteCode = searchParams.get('code')

  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validInvite, setValidInvite] = useState(false)

  useEffect(() => {
    // If there's an invite code, verify it and switch to register mode
    if (inviteCode) {
      verifyInviteCode()
    }
  }, [inviteCode])

  const verifyInviteCode = async () => {
    try {
      const response = await axios.get(`/api/thief/verify-invite/${inviteCode}`)
      if (response.data.valid) {
        setValidInvite(true)
        setMode('register')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid invite code')
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const endpoint = mode === 'login' ? '/api/thief/login' : '/api/thief/register'
      const payload = mode === 'register'
        ? { ...formData, inviteCode }
        : formData

      const response = await axios.post(endpoint, payload)

      // Save token
      localStorage.setItem('thiefToken', response.data.token)
      localStorage.setItem('thiefUsername', response.data.thief.username)
      localStorage.setItem('thiefId', response.data.thief.id)

      // Redirect to dashboard
      navigate('/thief/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div style={{ maxWidth: '500px', margin: '4rem auto' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)', border: '2px solid #00ff41' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>
            🕵️ Thief Portal
          </h1>

          {inviteCode && (
            <div style={{ background: '#0a0a0a', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                Invite Code:
              </p>
              <code style={{ color: '#00ff41' }}>{inviteCode}</code>
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(255, 0, 85, 0.2)', border: '1px solid #ff0055', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
              <p className="text-accent">{error}</p>
            </div>
          )}

          {!inviteCode && mode === 'register' && (
            <div style={{ background: 'rgba(255, 165, 0, 0.2)', border: '1px solid #ffa500', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
              <p style={{ color: '#ffa500', margin: 0 }}>
                You need an invite code to register. Contact your admin for an invite link.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Enter username"
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className={mode === 'register' ? 'btn btn-danger' : 'btn'}
              disabled={loading || (mode === 'register' && !inviteCode)}
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              {loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </form>

          {!inviteCode && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              {mode === 'login' ? (
                <p className="text-muted">
                  Have an invite code?{' '}
                  <button
                    className="btn"
                    style={{ display: 'inline', padding: '0.25rem 0.75rem', fontSize: '0.9rem' }}
                    onClick={() => setMode('register')}
                  >
                    Register
                  </button>
                </p>
              ) : (
                <p className="text-muted">
                  Already have an account?{' '}
                  <button
                    className="btn"
                    style={{ display: 'inline', padding: '0.25rem 0.75rem', fontSize: '0.9rem' }}
                    onClick={() => setMode('login')}
                  >
                    Login
                  </button>
                </p>
              )}
            </div>
          )}
        </div>

        <div className="card mt-2" style={{ background: '#0a0a0a' }}>
          <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>
            🔒 Thief Portal Features
          </h4>
          <ul style={{ color: '#888', lineHeight: '2' }}>
            <li>✓ Secure authentication</li>
            <li>✓ View only YOUR auctions</li>
            <li>✓ Create new listings</li>
            <li>✓ Track bids on your items</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
