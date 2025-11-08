import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Home() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/mixer/stats')
      setStats(response.data.stats)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  return (
    <div className="container">
      <div className="text-center mb-2">
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          Welcome to The Shadow Mint
        </h1>
        <p style={{ fontSize: '1.3rem', color: '#888' }}>
          The world's first anonymous e-fencing platform for high-value items
        </p>
      </div>

      <div className="card" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)', border: '2px solid #00ff41' }}>
        <h2 style={{ marginBottom: '1rem', color: '#ff0055' }}>⚠️ DISCLAIMER</h2>
        <p style={{ lineHeight: '1.8', color: '#00cc33' }}>
          This is a <strong>hackathon project for educational purposes only</strong>.
          The Shadow Mint demonstrates blockchain technology, encryption, and privacy concepts
          in the context of the Louvre Heist challenge. No actual illegal activity is endorsed or supported.
        </p>
      </div>

      <div className="grid mt-2">
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
            🎯 Our Mission
          </h3>
          <p style={{ color: '#888', lineHeight: '1.8' }}>
            You can't sell crown jewels on eBay. The Shadow Mint provides a secure,
            anonymous platform for high-value transactions using cutting-edge blockchain
            technology and cryptographic privacy.
          </p>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
            🔐 Key Features
          </h3>
          <ul style={{ color: '#888', lineHeight: '2' }}>
            <li>✓ Anonymous Tor-style platform</li>
            <li>✓ NFT "Bragging Rights" tokens</li>
            <li>✓ Crypto mixer for untraceable payments</li>
            <li>✓ End-to-end encryption</li>
          </ul>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
            💰 Crypto Mixer Stats
          </h3>
          {stats ? (
            <div style={{ color: '#888', lineHeight: '2' }}>
              <p>Total Transactions: <strong style={{ color: '#00ff41' }}>{stats.totalMixed}</strong></p>
              <p>Total Volume: <strong style={{ color: '#00ff41' }}>{stats.totalVolume.toFixed(4)} ETH</strong></p>
              <p>Active Mixes: <strong style={{ color: '#ffa500' }}>{stats.activeMixes}</strong></p>
              <p>Completed: <strong style={{ color: '#00c8ff' }}>{stats.completedMixes}</strong></p>
            </div>
          ) : (
            <div className="spinner"></div>
          )}
        </div>
      </div>

      <div className="card mt-2" style={{ background: '#1a1a1a' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
           The "Bragging Rights" Concept
        </h3>
        <p style={{ color: '#888', lineHeight: '1.8', marginBottom: '1rem' }}>
          Traditional stolen goods can be tracked. Our solution? <strong style={{ color: '#00ff41' }}>
          Destroy the original and mint the 3D scan as an NFT</strong>.
        </p>
        <p style={{ color: '#888', lineHeight: '1.8' }}>
          Buyers receive a unique 1-of-1 NFT containing a high-resolution 3D scan of the destroyed item,
          along with a cryptographic proof of destruction. They own the <em>bragging rights</em> to
          the most infamous heist in history - without the physical evidence.
        </p>
      </div>

      <div className="card mt-2" style={{ textAlign: 'center', background: 'rgba(255, 0, 85, 0.1)' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem', color: '#ff0055' }}>
          🚀 Get Started
        </h3>
        <p style={{ color: '#888', marginBottom: '1rem' }}>
          Browse active auctions, mint your own NFT, or use our crypto mixer for anonymous payments
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => window.location.href = '/auctions'}>
            Browse Auctions
          </button>
          <button className="btn btn-danger" onClick={() => window.location.href = '/mint'}>
            Mint NFT
          </button>
        </div>
      </div>
    </div>
  )
}
