// src/pages/Buyer.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

export default function Buyer() {
  const navigate = useNavigate();
  const location = useLocation();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [buyerId, setBuyerId] = useState('');
  const [token, setToken] = useState('');

  // Multi-screen flow state
  // Default to waiting so links go straight to buyer page (password screen removed)
  const [currentScreen, setCurrentScreen] = useState('waiting'); // password, nameEntry, waiting, bidding, payment
  const [realName, setRealName] = useState('');
  const [codename, setCodename] = useState('');

  // Auction state
  const [activeAuction, setActiveAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(60); // 60 seconds to bid
  const [timerRunning, setTimerRunning] = useState(false);
  const [myBid, setMyBid] = useState(null);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [wonAuction, setWonAuction] = useState(false);
  const [winnerCheckQueued, setWinnerCheckQueued] = useState(false);
  const [settledAuction, setSettledAuction] = useState(null);
  const [lastAuction, setLastAuction] = useState(null);

  // Payment / escrow state
  const [walletAddress, setWalletAddress] = useState('');
  const [paymentHash, setPaymentHash] = useState('');
  const [escrowMonitorId, setEscrowMonitorId] = useState(null);
  const [escrowStatus, setEscrowStatus] = useState(null);
  const [releaseItemKey, setReleaseItemKey] = useState(null);
  const [purchaseKeyPreview, setPurchaseKeyPreview] = useState(null);

  // Poll for active auctions when in waiting screen and sync timer when bidding
  useEffect(() => {
    if (currentScreen === 'waiting' || currentScreen === 'bidding') {
      const interval = setInterval(() => {
        checkForActiveAuction();
      }, 2000); // Check every 2 seconds

      return () => clearInterval(interval);
    }
  }, [currentScreen]);

  // On mount, try to hydrate buyer state from localStorage so dashboard can show personalized info
  useEffect(() => {
    try {
      const token = localStorage.getItem('buyerToken')
      const id = localStorage.getItem('buyerId')
      const storedCodename = localStorage.getItem('buyerCodename') || localStorage.getItem('buyerCodename')

      if (token) setToken(token)
      if (id) setBuyerId(id)
      if (storedCodename) setCodename(storedCodename)

      // ensure we're showing the waiting/dashboard screen by default
      setIsAuthenticated(true)
      setCurrentScreen('waiting')
    } catch (err) {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (location.state?.escrowRedirect) {
      const { auctionId, escrow } = location.state.escrowRedirect;
      setEscrowMonitorId(auctionId);
      setEscrowStatus(escrow);
      setCurrentScreen('escrow');
      navigate('/buyer', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // Bidding timer
  useEffect(() => {
    if (timerRunning && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            setAuctionEnded(true);
            setWinnerCheckQueued(true);
            checkIfWon();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timerRunning, timeRemaining]);

  useEffect(() => {
    if (currentScreen !== 'escrow' || !escrowMonitorId) return;

    const pollStatus = async () => {
      try {
        const response = await axios.get(`/api/escrow/status/${escrowMonitorId}`);
        if (response.data?.status) {
          setEscrowStatus(response.data.status);
          if (response.data.status.status === 'released' && response.data.status.itemKey) {
            setReleaseItemKey(response.data.status.itemKey);
          }
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error('Failed to poll escrow status:', error.message);
        }
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 2500);
    return () => clearInterval(interval);
  }, [currentScreen, escrowMonitorId]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/buyer/login', { password });

      setBuyerId(response.data.buyer.buyerId);
      setToken(response.data.token);
      setCodename(response.data.buyer.codename);
      setIsAuthenticated(true);

      // If codename exists, skip name entry, go to waiting
      if (response.data.buyer.codename) {
        setCurrentScreen('waiting');
        checkForActiveAuction();
      } else {
        setCurrentScreen('nameEntry');
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Invalid password');
    } finally {
      setLoading(false);
    }
  };

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/buyer/setup-profile',
        { realName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCodename(response.data.codename);
      setCurrentScreen('waiting');
      checkForActiveAuction();
    } catch (error) {
      alert('Failed to setup profile: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const checkForActiveAuction = async () => {
    try {
      const response = await axios.get('/api/auction/active');
      if (response.data.auctions && response.data.auctions.length > 0) {
        const auction = response.data.auctions[0];
        const endsAt = auction.ends_at ? new Date(auction.ends_at) : null;
        const now = new Date();
        const remainingSeconds = endsAt ? Math.max(0, Math.floor((endsAt - now) / 1000)) : null;

        if (endsAt && remainingSeconds <= 0) {
          setTimerRunning(false);
          setTimeRemaining(0);
          setAuctionEnded(true);
          if (!winnerCheckQueued) {
            setWinnerCheckQueued(true);
            checkIfWon(auction);
          }
          setActiveAuction(null);
          return;
        } else if (!endsAt) {
          // Auction exists but timer not armed yet; stay in waiting state
          setActiveAuction(null);
          setTimerRunning(false);
          setTimeRemaining(0);
          if (currentScreen !== 'payment' && currentScreen !== 'escrow') {
            setCurrentScreen('waiting');
          }
          return;
        }

        setActiveAuction(auction);
        setLastAuction(auction);
        setCurrentScreen('bidding');
        setAuctionEnded(false);
        setWinnerCheckQueued(false);
        setSettledAuction(null);

        setTimeRemaining(remainingSeconds);
        setTimerRunning(true);
      } else if (activeAuction && !winnerCheckQueued) {
        setTimerRunning(false);
        setAuctionEnded(true);
        setWinnerCheckQueued(true);
        checkIfWon(activeAuction);
      } else {
        setActiveAuction(null);
        setTimerRunning(false);
        setTimeRemaining(0);
        setAuctionEnded(false);
        if (currentScreen !== 'payment' && currentScreen !== 'escrow') {
          setCurrentScreen('waiting');
        }
      }
    } catch (error) {
      console.error('Failed to check for auctions:', error);
      setTimerRunning(false);
      setAuctionEnded(false);
      setSettledAuction(null);
      if (currentScreen !== 'payment' && currentScreen !== 'escrow') {
        setCurrentScreen('waiting');
      }
    }
  };

  const placeBid = async () => {
    if (!bidAmount || !activeAuction) return;

    try {
      const response = await axios.post('/api/auction/bid', {
        auctionId: activeAuction.id,
        bidderId: buyerId,
        bidAmount: parseFloat(bidAmount),
        transactionHash: '0x' + Math.random().toString(16).slice(2)
      });

      setMyBid(parseFloat(bidAmount));
      alert('Bid placed successfully!');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to place bid');
    }
  };

  const checkIfWon = async (auctionOverride) => {
    const auctionContext = auctionOverride || activeAuction;
    const contextToUse = auctionContext || lastAuction;
    if (!contextToUse) {
      setAuctionEnded(false);
      setWinnerCheckQueued(false);
      return;
    }
    // hide stale auction UI while winner is determined
    setActiveAuction(null);
    setTimerRunning(false);
    setTimeRemaining(0);
    if (currentScreen === 'bidding') {
      setCurrentScreen('waiting');
    }
    try {
      const response = await axios.get(`/api/auction/${contextToUse.id}`);
      const auction = response.data.auction;
      setSettledAuction(auction);
      setLastAuction(auction);

      // Check if current user's bid is the highest
      const bidsResponse = await axios.get(`/api/auction/${auctionContext.id}/bids`);
      const bids = bidsResponse.data.bids;

      if (bids.length > 0) {
        const highestBid = bids.reduce((max, bid) => bid.bid_amount > max.bid_amount ? bid : max);
        const myShortId = buyerId ? `${buyerId.substring(0, 12)}...` : null;
        const didWin =
          highestBid.bidder_id === buyerId ||
          (myShortId && highestBid.bidder_id_partial === myShortId);

        setWonAuction(didWin);
        setAuctionEnded(false);
        goToCurrencyForm(contextToUse, didWin);
      } else {
        alert('Auction ended with no bids recorded.');
        setCurrentScreen('waiting');
        setMyBid(null);
        setAuctionEnded(false);
        setSettledAuction(null);
        goToCurrencyForm(contextToUse, false);
        setWinnerCheckQueued(false);
        return;
      }
    } catch (error) {
      console.error('Failed to check auction result:', error);
      setCurrentScreen('waiting');
      setAuctionEnded(false);
      setSettledAuction(null);
      goToCurrencyForm(contextToUse, false);
      setWinnerCheckQueued(false);
      return;
    } finally {
      setWinnerCheckQueued(false);
      setTimerRunning(false);
    }
  };

  const completePayment = async (e) => {
    e.preventDefault();

    if (!walletAddress || !paymentHash) {
      alert('Please fill in all payment details');
      return;
    }

    const paymentAuction = settledAuction || activeAuction;
    if (!paymentAuction) {
      alert('No auction context found. Please refresh the page.');
      return;
    }

    try {
      navigate('/buyer/currency', {
        state: {
          auction: paymentAuction,
          amount: myBid
        }
      });
    } catch (error) {
      alert('Failed to complete payment: ' + (error.response?.data?.error || error.message));
    }
  };

  const copyItemKey = async () => {
    if (!releaseItemKey) return;
    try {
      await navigator.clipboard.writeText(releaseItemKey);
      alert('Item key copied to clipboard.');
    } catch (err) {
      console.warn('Clipboard copy failed:', err);
      alert('Unable to copy automatically. Please copy the key manually.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    setBuyerId('');
    setToken('');
    setCodename('');
    setCurrentScreen('password');
    setActiveAuction(null);
    setMyBid(null);
    setBidAmount('');
    setWalletAddress('');
    setPaymentHash('');
    setEscrowMonitorId(null);
    setEscrowStatus(null);
    setReleaseItemKey(null);
    setPurchaseKeyPreview(null);
    setAuctionEnded(false);
    setWonAuction(false);
    setWinnerCheckQueued(false);
    setSettledAuction(null);
  };

  const goToCurrencyForm = (auctionData, didWin) => {
    const context = auctionData && auctionData.id ? auctionData : lastAuction;
    if (!context) return;
    // Instead of routing to a currency input page, create the internal transaction
    // record immediately (with empty wallet/tx fields). Then show a simple "Auction is done"
    // confirmation screen and allow the user to view completed transactions.

    const createAutoTransaction = async () => {
      try {
        await axios.post('/api/transaction/create', {
          buyerId,
          auctionId: context.id,
          itemName: context.title,
          amount: didWin ? myBid : 0,
          walletAddress: null,
          transactionHash: null,
          currency: 'ETH',
          notes: didWin ? 'Auto-created: winner - awaiting payment details' : 'Auto-created: auction ended, no winning bid from this buyer'
        });
      } catch (error) {
        console.error('Failed to create transaction record:', error);
      }
    };

    // Fire-and-forget creation; show done screen
    createAutoTransaction();
    setCurrentScreen('done');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ========== SCREEN 1: PASSWORD LOGIN ==========
  if (currentScreen === 'password') {
    return (
      <div className="container" style={{ maxWidth: '500px', marginTop: '5rem' }}>
        <div className="card">
          <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>🔐 Buyer Portal Access</h2>
          <p className="text-muted" style={{ marginBottom: '2rem', textAlign: 'center' }}>
            Enter your access code to continue
          </p>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Access Code</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoFocus
              />
            </div>

            <button type="submit" className="btn btn-danger" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Access Portal'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ========== SCREEN 2: NAME ENTRY ==========
  if (currentScreen === 'nameEntry') {
    return (
      <div className="container" style={{ maxWidth: '600px', marginTop: '5rem' }}>
        <div className="card">
          <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>👤 Identity Setup</h2>
          <p className="text-muted" style={{ marginBottom: '2rem', textAlign: 'center' }}>
            Enter your real name. It will be encrypted and you'll receive a unique codename for bidding.
          </p>

          <form onSubmit={handleNameSubmit}>
            <div className="form-group">
              <label>Real Name</label>
              <input
                type="text"
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                placeholder="Enter your full name"
                required
                autoFocus
              />
              <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                🔒 Your name will be encrypted for security. Only you and the platform admin can access it.
              </p>
            </div>

            <button type="submit" className="btn btn-danger" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Generating Codename...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ========== SCREEN 3: WAITING FOR AUCTION ==========
  if (currentScreen === 'waiting') {
    return (
      <div className="container" style={{ maxWidth: '700px', marginTop: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2>Auction Lobby</h2>
            <p className="text-muted">Codename: <code style={{ color: '#00ff41' }}>{codename}</code></p>
          </div>
          <button className="btn" onClick={handleLogout}>Logout</button>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⏳</div>
          <h2 style={{ marginBottom: '1rem' }}>Waiting for Auction to Start</h2>
          <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
            The auction timer has not been activated yet. Please wait for the admin to start the auction countdown timer.
          </p>

          <div className="spinner" style={{ margin: '2rem auto' }}></div>

          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            Checking for active auctions every 2 seconds...
          </p>
        </div>
      </div>
    );
  }

  // ========== SCREEN 4: BIDDING ==========
  if (currentScreen === 'bidding') {
    return (
      <div className="container" style={{ maxWidth: '800px', marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2>🏛️ Live Auction</h2>
            <p className="text-muted">Codename: <code style={{ color: '#00ff41' }}>{codename}</code></p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: timeRemaining <= 10 ? '#ff0055' : '#00ff41', fontFamily: 'monospace' }}>
              {formatTime(timeRemaining)}
            </div>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Time Remaining</p>
          </div>
        </div>

        {activeAuction && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.5rem' }}>{activeAuction.title}</h3>
              <span className="status status-active">LIVE</span>
            </div>

            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
              {activeAuction.description}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: '#0a0a0a', padding: '1rem', borderRadius: '4px' }}>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Starting Price</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{activeAuction.starting_price} ETH</p>
              </div>
              <div style={{ background: '#0a0a0a', padding: '1rem', borderRadius: '4px' }}>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Current Bid</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#00ff41' }}>{activeAuction.current_price} ETH</p>
              </div>
              <div style={{ background: '#0a0a0a', padding: '1rem', borderRadius: '4px' }}>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Reserve Price</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff0055' }}>{activeAuction.reserve_price} ETH</p>
              </div>
            </div>

            {!auctionEnded ? (
              <div>
                <div className="form-group">
                  <label>Your Bid (ETH)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`Minimum: ${activeAuction.current_price + 0.01} ETH`}
                    disabled={!timerRunning}
                  />
                </div>

                {myBid && (
                  <div style={{ background: 'rgba(0, 255, 65, 0.1)', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
                    <p style={{ color: '#00ff41', margin: 0 }}>✓ Your bid: {myBid} ETH</p>
                  </div>
                )}

                <button
                  className="btn btn-danger"
                  style={{ width: '100%' }}
                  onClick={placeBid}
                  disabled={!timerRunning || !bidAmount}
                >
                  Place Bid
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', background: '#0a0a0a', borderRadius: '4px' }}>
                <h3>Auction Ended</h3>
                <p className="text-muted">Determining winner...</p>
                <div className="spinner" style={{ margin: '1rem auto' }}></div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ========== SCREEN 5: PAYMENT ==========
  if (currentScreen === 'payment') {
    const paymentContext = settledAuction || activeAuction;
    return (
      <div className="container" style={{ maxWidth: '600px', marginTop: '3rem' }}>
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ color: '#00ff41' }}>Congratulations!</h2>
            <p className="text-muted">You won the auction!</p>
          </div>

          <div style={{ background: '#0a0a0a', padding: '1.5rem', borderRadius: '4px', marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>{paymentContext?.title || 'Winning Item'}</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="text-muted">Winning Bid:</span>
              <strong style={{ fontSize: '1.2rem', color: '#00ff41' }}>{myBid} ETH</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Codename:</span>
              <code style={{ color: '#888' }}>{codename}</code>
            </div>
          </div>

          <h3 style={{ marginBottom: '1rem' }}>💳 Complete Payment</h3>
          <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
            Please provide your wallet address and transaction hash to complete the purchase.
          </p>

          <form onSubmit={completePayment}>
            <div className="form-group">
              <label>Wallet Address</label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                required
              />
            </div>

            <div className="form-group">
              <label>Transaction Hash</label>
              <input
                type="text"
                value={paymentHash}
                onChange={(e) => setPaymentHash(e.target.value)}
                placeholder="0x..."
                required
              />
              <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Send {myBid} ETH to complete the purchase and enter the transaction hash above.
              </p>
            </div>

            <button type="submit" className="btn btn-danger" style={{ width: '100%' }}>
              Continue to Payment
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ========== SCREEN 6: AUCTION DONE ==========
  if (currentScreen === 'done') {
    const doneContext = settledAuction || lastAuction || activeAuction;
    return (
      <div className="container" style={{ maxWidth: '600px', marginTop: '3rem' }}>
        <div className="card text-center">
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2>Auction Completed</h2>
          <p className="text-muted" style={{ marginBottom: '1rem' }}>
            The auction has finished. A completed transaction record was created and can be viewed on the Completed Transactions page.
          </p>

          {doneContext && (
            <div style={{ background: '#0a0a0a', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>{doneContext.title}</h3>
              <p className="text-muted">Final price: <strong style={{ color: '#00ff41' }}>{myBid || doneContext.current_price || 0} ETH</strong></p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-danger" onClick={() => navigate('/transactions')} style={{ flex: 1 }}>
              View Completed Transactions
            </button>
            <button className="btn" onClick={() => setCurrentScreen('waiting')} style={{ flex: 1 }}>
              Back to Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========== SCREEN 6: ESCROW RELEASE STATUS ==========
  if (currentScreen === 'escrow') {
    const statusLabel = escrowStatus?.status || 'awaiting_release';
    const maskedPurchaseKey = purchaseKeyPreview
      ? `${purchaseKeyPreview.slice(0, 8)}...${purchaseKeyPreview.slice(-4)}`
      : null;

    return (
      <div className="container" style={{ maxWidth: '650px', marginTop: '3rem' }}>
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔐</div>
            <h2>Vault Release In Progress</h2>
            <p className="text-muted">
              Waiting for the physical escrow controller to validate your purchase key.
            </p>
          </div>

          <div style={{ background: '#0a0a0a', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="text-muted">Current Status</span>
              <strong style={{ textTransform: 'capitalize' }}>{statusLabel.replace('_', ' ')}</strong>
            </div>
            {maskedPurchaseKey && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace' }}>
                <span className="text-muted">Purchase Key</span>
                <span>{maskedPurchaseKey}</span>
              </div>
            )}
          </div>

          {releaseItemKey ? (
            <div style={{ background: 'rgba(0, 255, 65, 0.08)', padding: '1.25rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
              <p style={{ marginBottom: '0.5rem', color: '#00ff41', fontWeight: 'bold' }}>Redeem Item Key</p>
              <code style={{ fontSize: '1.1rem', wordBreak: 'break-all', display: 'block', marginBottom: '0.75rem' }}>
                {releaseItemKey}
              </code>
              <button className="btn btn-danger" onClick={copyItemKey} style={{ width: '100%' }}>
                Copy Item Key
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
              <p className="text-muted" style={{ marginBottom: '0.5rem' }}>
                Standing by for confirmation from the vault hardware...
              </p>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                This page refreshes automatically every few seconds.
              </p>
            </div>
          )}

          <button
            className="btn"
            style={{ width: '100%' }}
            disabled={!releaseItemKey}
            onClick={() => navigate('/transactions')}
          >
            {releaseItemKey ? 'View Receipt' : 'Waiting for Release...'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
