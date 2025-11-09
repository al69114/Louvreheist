import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function ThiefLogin() {
  const navigate = useNavigate()
  
  // We only need one piece of state: the code from the bot
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Call the endpoint we built in server.js
      const response = await axios.post('/api/login-with-code', { code: code })

      // 2. Save the token and user info from the server's response
      // This matches the response from your server.js:
      // { success: true, token, thief: { id: ..., thiefId: ... } }
      localStorage.setItem('thiefToken', response.data.token)
      localStorage.setItem('thiefUsername', response.data.thief.thiefId) // thiefId is the username
      localStorage.setItem('thiefId', response.data.thief.id)

      // 3. Redirect to the dashboard
      navigate('/thief/dashboard')

    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred')
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
          <p className="text-muted" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            Enter your access code from the bot.
          </p>

          {error && (
            <div style={{ background: 'rgba(255, 0, 85, 0.2)', border: '1px solid #ff0055', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
              <p className="text-accent">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Access Code</label>
              <input
                type="password" // Use 'password' type to hide the code
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                placeholder="Enter your code"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn btn-danger"
              disabled={loading}
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              {loading ? 'Verifying...' : 'Access Portal'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}