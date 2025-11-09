import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Auctions from './pages/Auctions'
import Transactions from './pages/completedTransactions'
import Admin from './pages/Admin'
import ThiefLogin from './pages/ThiefLogin'
import ThiefDashboard from './pages/ThiefDashboard'
import axios from 'axios'
import vaultLogo from '/images/xlogo.png'
import Buyer from './pages/Buyer'
import CurrencyForm from './pages/CurrencyForm'
import LiveFeed from './pages/LiveFeed'
import Seller from './pages/seller'



function Header({ anonymousId, setAnonymousId }) {
  const location = useLocation()

  const createSession = async () => {
    try {
      const response = await axios.post('/api/user/anonymous', {})
      setAnonymousId(response.data.anonymousId)
      localStorage.setItem('anonymousId', response.data.anonymousId)
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem('anonymousId')
    if (saved) {
      setAnonymousId(saved)
    } else {
      createSession()
    }
  }, [])

  // Hide header for thief portal pages
  if (location.pathname.startsWith('/thief/')) {
    return (
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <h1>🕵️ XCRO - THIEF PORTAL</h1>
            <div className="onion-badge">🧅 shadow7x2k9mq4.onion</div>
          </div>
        </div>
      </header>
    )
  }

  // Seller portal header
  if (location.pathname.startsWith('/seller')) {
    return (
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <h1>💼 XCRO - SELLER PORTAL</h1>
            <div className="onion-badge">⚠️ xcr0dark.onion</div>
          </div>
        </div>
      </header>
    )
  }

  // Buyer portal header
  if (location.pathname.startsWith('/buyer')) {
    return (
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <h1>🛒 XCRO - BUYER PORTAL</h1>
            <div className="onion-badge">🔐 buyerdark.onion</div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <Link to="/" className="logo-link">
            <img src={vaultLogo} alt="Vault Logo" className="navbar-logo" />
            <h1>CRO</h1>
          </Link>
          <div className="onion-badge">Admin Portal</div>
        </div>


        <nav className="nav">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link
            to="/auctions"
            className={`nav-link ${location.pathname === '/auctions' ? 'active' : ''}`}
          >
            Auctions
          </Link>
          
          <Link
            to="/transactions"
            className={`nav-link ${location.pathname === '/transactions' ? 'active' : ''}`}
          >
            Transactions
          </Link>
         
          <Link
            to="/admin"
            className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
          >
            👑 Admin
          </Link>
          {anonymousId && (
            <div className="nav-link" style={{ borderColor: '#00ff41' }}>
              ID: {anonymousId.substring(0, 12)}...
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}

function App() {
  const [anonymousId, setAnonymousId] = useState(null)

  return (
    <Router>
      <div className="app">
        <Header anonymousId={anonymousId} setAnonymousId={setAnonymousId} />
        <Routes>
          {/* Admin Portal Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/auctions" element={<Auctions anonymousId={anonymousId} />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/livefeed" element={<LiveFeed />} />

          {/* Thief Portal Routes */}
          <Route path="/thief/login" element={<ThiefLogin />} />
          <Route path="/thief/register" element={<ThiefLogin />} />
          <Route path="/thief/dashboard" element={<ThiefDashboard />} />

          {/* Buyer Portal Route */}
          <Route path="/buyer" element={<Buyer />} />
          <Route path="/buyer/currency" element={<CurrencyForm />} />

          {/* Seller Portal Route */}
          <Route path="/seller" element={<Seller />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
