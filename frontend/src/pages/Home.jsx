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
          Welcome to XCRO
        </h1>
        <p style={{ fontSize: '1.3rem', color: '#888' }}>
          Platform for black market auctions. beware of lies
        </p>
      </div>

     

      <div className="grid mt-2">
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
            🎯 Our Mission
          </h3>
          <p style={{ color: '#888', lineHeight: '1.8' }}>
            Contribute to the black market economy and improve lives of those who break the law by providing a secure, anonymous auction platform
          </p>
        </div>

       

        
      </div>

      

  
     
    </div>
  )
}
