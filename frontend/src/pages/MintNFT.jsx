import React, { useState } from 'react'
import axios from 'axios'

export default function MintNFT({ anonymousId }) {
  const [formData, setFormData] = useState({
    itemName: '',
    scan3dUrl: '',
    description: ''
  })
  const [minting, setMinting] = useState(false)
  const [mintResult, setMintResult] = useState(null)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const mintNFT = async (e) => {
    e.preventDefault()
    setMinting(true)

    try {
      const response = await axios.post('/api/nft/mint', {
        itemName: formData.itemName,
        scan3dUrl: formData.scan3dUrl,
        metadata: {
          description: formData.description,
          attributes: []
        },
        minterAddress: anonymousId
      })

      setMintResult(response.data)
      setFormData({ itemName: '', scan3dUrl: '', description: '' })
    } catch (error) {
      alert('Failed to mint NFT: ' + error.message)
    } finally {
      setMinting(false)
    }
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem' }}> Mint Bragging Rights NFT</h1>

      <div className="card mb-2" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)' }}>
        <h3 style={{ marginBottom: '1rem', color: '#00ff41' }}>
          What are "Bragging Rights" NFTs?
        </h3>
        <p style={{ color: '#888', lineHeight: '1.8', marginBottom: '1rem' }}>
          Traditional stolen goods can be traced and recovered. Our solution is revolutionary:
        </p>
        <ol style={{ color: '#888', lineHeight: '2', paddingLeft: '2rem' }}>
          <li>Take a high-resolution 3D scan of the stolen item</li>
          <li>Destroy the physical original (eliminating evidence)</li>
          <li>Mint the 3D scan as a 1-of-1 NFT on the blockchain</li>
          <li>Sell the digital "bragging rights" to collectors</li>
        </ol>
        <p style={{ color: '#888', lineHeight: '1.8', marginTop: '1rem' }}>
          The buyer owns proof they possess the digital twin of the most infamous stolen artifact
          in history - without the physical liability.
        </p>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1.5rem' }}>Create Your NFT</h3>

        <form onSubmit={mintNFT}>
          <div className="form-group">
            <label>Item Name *</label>
            <input
              name="itemName"
              value={formData.itemName}
              onChange={handleChange}
              required
              placeholder="e.g., Crown of Louis XV"
            />
          </div>

          <div className="form-group">
            <label>3D Scan URL (IPFS/Arweave) *</label>
            <input
              name="scan3dUrl"
              value={formData.scan3dUrl}
              onChange={handleChange}
              required
              placeholder="ipfs://Qm... or https://arweave.net/..."
            />
            <small className="text-muted" style={{ fontSize: '0.85rem' }}>
              Upload your 3D scan to IPFS or Arweave first
            </small>
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              required
              placeholder="Detailed description of the item and its history..."
            ></textarea>
          </div>

          <div className="card" style={{ background: '#0a0a0a', marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>
              Destruction Proof
            </h4>
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>
              A cryptographic hash will be generated to prove the original was destroyed.
              This hash will be permanently stored on-chain with your NFT.
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-danger"
            disabled={minting || !anonymousId}
            style={{ width: '100%' }}
          >
            {minting ? 'Minting...' : '🚀 Mint NFT'}
          </button>

          {!anonymousId && (
            <p className="text-muted" style={{ marginTop: '1rem', textAlign: 'center' }}>
              Waiting for anonymous session...
            </p>
          )}
        </form>
      </div>

      {mintResult && (
        <div className="card mt-2" style={{ background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.1) 0%, rgba(0, 200, 50, 0.05) 100%)', border: '2px solid #00ff41' }}>
          <h3 style={{ marginBottom: '1rem', color: '#00ff41' }}>
            ✅ NFT Minted Successfully!
          </h3>

          <div style={{ background: '#0a0a0a', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
            <p className="text-muted" style={{ marginBottom: '0.5rem' }}>Token ID:</p>
            <code style={{ color: '#00ff41', fontSize: '1.2rem' }}>{mintResult.tokenId}</code>
          </div>

          <div style={{ background: '#0a0a0a', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
            <p className="text-muted" style={{ marginBottom: '0.5rem' }}>Contract Address:</p>
            <code style={{ color: '#00ff41', fontSize: '0.9rem', wordBreak: 'break-all' }}>
              {mintResult.contractAddress}
            </code>
          </div>

          <div style={{ background: '#0a0a0a', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
            <p className="text-muted" style={{ marginBottom: '0.5rem' }}>Transaction Hash:</p>
            <code style={{ color: '#00ff41', fontSize: '0.9rem', wordBreak: 'break-all' }}>
              {mintResult.transactionHash}
            </code>
          </div>

          <div style={{ background: '#0a0a0a', padding: '1rem', borderRadius: '4px' }}>
            <p className="text-muted" style={{ marginBottom: '0.5rem' }}>Network:</p>
            <code style={{ color: '#00ff41', textTransform: 'uppercase' }}>{mintResult.network}</code>
          </div>

          <p className="text-muted" style={{ marginTop: '1rem', textAlign: 'center' }}>
            Your NFT is now ready to be listed on the auction!
          </p>
        </div>
      )}
    </div>
  )
}
