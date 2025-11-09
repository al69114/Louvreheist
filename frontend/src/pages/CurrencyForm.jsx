import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

export default function CurrencyForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state;
  const storedContext = !locationState && sessionStorage.getItem('currencyFormContext')
    ? JSON.parse(sessionStorage.getItem('currencyFormContext'))
    : null;
  const { auction, buyerId, didWin } = locationState || storedContext || {};
  const [wallet, setWallet] = useState('');
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState((locationState && locationState.currency) || storedContext?.currency || 'ETH');
  const [submitting, setSubmitting] = useState(false);

  if (!auction || !buyerId) {
    return (
      <div className="container" style={{ marginTop: '4rem' }}>
        <div className="card text-center">
          <h2>Missing Auction Context</h2>
          <p className="text-muted">Return to the buyer portal to continue.</p>
          <button className="btn" onClick={() => navigate('/buyer')}>
            Back
          </button>
        </div>
      </div>
    );
  }

  const amount = (locationState && locationState.amount) || storedContext?.amount || auction.current_price || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('/api/transaction/create', {
        buyerId,
        auctionId: auction.id,
        itemName: auction.title,
        amount,
        walletAddress: wallet,
        transactionHash: null,
        currency,
        notes
      });
      sessionStorage.removeItem('currencyFormContext');
      navigate('/buyer', { replace: true, state: { escrowRedirect: { auctionId: auction.id } } });
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to submit payment details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '700px', marginTop: '3rem' }}>
      <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>✍️ Payment Details</h2>
          <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
            Enter the destination address or account for your payout.
          </p>

        <form onSubmit={handleSubmit}>
          {didWin === false ? (
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ marginBottom: '0.25rem' }}>You did not win this auction</h3>
              <p className="text-muted">No payment details are required. Return to the buyer portal.</p>
              <button className="btn" onClick={() => navigate('/buyer')} style={{ marginTop: '0.75rem' }}>
                Back to Lobby
              </button>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>Preferred Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="ETH">Ethereum (ETH)</option>
                  <option value="BTC">Bitcoin (BTC)</option>
                  <option value="USD">USD (Wire Transfer)</option>
                  <option value="XMR">Monero (XMR)</option>
                </select>
              </div>

              <div style={{ background: '#0a0a0a', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Amount</span>
                  <strong style={{ color: '#00ff41' }}>{amount} {currency}</strong>
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Wallet / Account Address</label>
            <input
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="0x..., bc1..., or banking instructions"
              required
            />
          </div>

          <div className="form-group">
            <label>Notes for Administrator</label>
            <textarea
              rows="4"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any extra instructions"
            />
          </div>

          <button type="submit" className="btn btn-danger" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Continue to Escrow Release'}
          </button>
        </form>
      </div>
    </div>
  );
}
