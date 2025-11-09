// In-memory database for hackathon demo (no compilation issues)
const db = {
  users: [],
  auction_items: [],
  bids: [],
  mixer_transactions: [],
  thieves: [], // New: authenticated thieves
  invite_links: [], // New: invite links for thieves
  buyers: [], // New: authenticated buyers
  transactions: [], // New: transaction records
  escrow_records: [],

  _autoIncrement: {
    users: 1,
    auction_items: 1,
    bids: 1,
    mixer_transactions: 1,
    thieves: 1,
    invite_links: 1,
    buyers: 1,
    transactions: 1,
    escrow_records: 1
  },

  prepare(query) {
    const self = this;
    return {
      run(...params) {
        // INSERT operations
        if (query.includes('INSERT INTO users')) {
          const user = {
            id: self._autoIncrement.users++,
            anonymous_id: params[0],
            wallet_address_encrypted: params[1],
            created_at: new Date().toISOString()
          };
          self.users.push(user);
          return { lastInsertRowid: user.id };
        }

        if (query.includes('INSERT INTO auction_items')) {
          const auction = {
            id: self._autoIncrement.auction_items++,
            title: params[0],
            description: params[1],
            item_type: params[2],
            starting_price: params[3],
            reserve_price: params[4],
            seller_id: params[5],
            nft_token_id: params[6],
            nft_contract_address: params[7],
            scan_3d_url: params[8],
            ends_at: params[9],
            current_price: params[10],
            status: 'queued',
            created_at: new Date().toISOString()
          };
          self.auction_items.push(auction);
          return { lastInsertRowid: auction.id };
        }

        if (query.includes('INSERT INTO bids')) {
          const bid = {
            id: self._autoIncrement.bids++,
            auction_id: params[0],
            bidder_id: params[1],
            bid_amount: params[2],
            transaction_hash_encrypted: params[3],
            created_at: new Date().toISOString()
          };
          self.bids.push(bid);
          return { lastInsertRowid: bid.id };
        }

        if (query.includes('INSERT INTO mixer_transactions')) {
          const tx = {
            id: self._autoIncrement.mixer_transactions++,
            input_address_encrypted: params[0],
            output_address_encrypted: params[1],
            amount: params[2],
            currency: params[3],
            mixer_tx_hash: params[4],
            status: params[5],
            created_at: new Date().toISOString(),
            completed_at: null
          };
          self.mixer_transactions.push(tx);
          return { lastInsertRowid: tx.id };
        }

        // INSERT thief
        if (query.includes('INSERT INTO thieves')) {
          const thief = {
            id: self._autoIncrement.thieves++,
            username: params[0],
            password_hash: params[1],
            invite_code: params[2],
            created_at: new Date().toISOString()
          };
          self.thieves.push(thief);
          return { lastInsertRowid: thief.id };
        }

        // INSERT buyer
        if (query.includes('INSERT INTO buyers')) {
          const buyer = {
            id: self._autoIncrement.buyers++,
            username: params[0],
            password_hash: params[1],
            invite_code: params[2],
            real_name_encrypted: null,
            codename: null,
            created_at: new Date().toISOString()
          };
          self.buyers.push(buyer);
          return { lastInsertRowid: buyer.id };
        }

        // INSERT invite_link
        if (query.includes('INSERT INTO invite_links')) {
          const link = {
            id: self._autoIncrement.invite_links++,
            code: params[0],
            password: params[1], // Simple password for thief to use
            used: params[2] || false,
            role: params[3] || 'thief',
            created_at: new Date().toISOString()
          };
          self.invite_links.push(link);
          return { lastInsertRowid: link.id };
        }

        // INSERT transaction
        if (query.includes('INSERT INTO transactions')) {
          const transaction = {
            id: self._autoIncrement.transactions++,
            buyer_id: params[0],
            auction_id: params[1],
            item_name: params[2],
            amount: params[3],
            wallet_address: params[4],
            transaction_hash: params[5],
            status: params[6] || 'confirmed',
            created_at: params[7] || new Date().toISOString()
          };
          self.transactions.push(transaction);
          return { lastInsertRowid: transaction.id };
        }

        // UPDATE operations
        if (query.includes('UPDATE auction_items SET current_price')) {
          const auction = self.auction_items.find(a => a.id === params[1]);
          if (auction) auction.current_price = params[0];
        }

        if (query.includes('UPDATE auction_items SET status')) {
          const auction = self.auction_items.find(a => a.id === params[1]);
          if (auction) auction.status = params[0];
        }

        if (query.includes('UPDATE auction_items SET ends_at')) {
          const auction = self.auction_items.find(a => a.id === params[1]);
          if (auction) auction.ends_at = params[0];
        }

        if (query.includes('UPDATE mixer_transactions')) {
          const tx = self.mixer_transactions.find(t => t.id === params[0]);
          if (tx) {
            tx.status = 'completed';
            tx.completed_at = new Date().toISOString();
          }
        }

        if (query.includes('UPDATE invite_links SET used')) {
          const link = self.invite_links.find(l => l.code === params[1]);
          if (link) link.used = true;
        }

        if (query.includes('UPDATE buyers SET real_name_encrypted')) {
          const buyer = self.buyers.find(b => b.id === params[2]);
          if (buyer) {
            buyer.real_name_encrypted = params[0];
            buyer.codename = params[1];
          }
        }

        return {};
      },

      get(...params) {
        // SELECT single row
        if (query.includes('FROM users WHERE anonymous_id')) {
          return self.users.find(u => u.anonymous_id === params[0]) || null;
        }

        if (query.includes('FROM auction_items WHERE id')) {
          return self.auction_items.find(a => a.id === params[0]) || null;
        }

        if (query.includes('FROM thieves WHERE username')) {
          return self.thieves.find(t => t.username === params[0]) || null;
        }

        if (query.includes('FROM thieves WHERE id')) {
          return self.thieves.find(t => t.id === params[0]) || null;
        }

        if (query.includes('FROM buyers WHERE invite_code')) {
          return self.buyers.find(b => b.invite_code === params[0]) || null;
        }

        if (query.includes('FROM buyers WHERE id')) {
          return self.buyers.find(b => b.id === params[0]) || null;
        }

        if (query.includes('FROM invite_links WHERE code')) {
          return self.invite_links.find(l => l.code === params[0]) || null;
        }

        if (query.includes('FROM invite_links WHERE password')) {
          return self.invite_links.find(l => l.password === params[0]) || null;
        }

        if (query.includes('COUNT(*) as count FROM bids WHERE auction_id')) {
          return { count: self.bids.filter(b => b.auction_id === params[0]).length };
        }

        if (query.includes('FROM mixer_transactions WHERE id')) {
          return self.mixer_transactions.find(t => t.id === params[0]) || null;
        }

        if (query.includes('COUNT(*) as count FROM mixer_transactions')) {
          return { count: self.mixer_transactions.length };
        }

        if (query.includes('SUM(amount) as total FROM mixer_transactions')) {
          const total = self.mixer_transactions.reduce((sum, t) => sum + t.amount, 0);
          return { total };
        }

        return null;
      },

      all(...params) {
        // SELECT multiple rows
        if (query.includes('FROM auction_items WHERE status')) {
          return self.auction_items.filter(a => a.status === 'active');
        }

        if (query.includes('FROM auction_items WHERE seller_id')) {
          return self.auction_items.filter(a => a.seller_id === params[0]);
        }

        if (query.includes('FROM auction_items')) {
          return self.auction_items;
        }

        if (query.includes('FROM bids WHERE auction_id')) {
          return self.bids.filter(b => b.auction_id === params[0]).map(b => ({
            id: b.id,
            bidder_id_partial: b.bidder_id.substring(0, 12) + '...',
            bid_amount: b.bid_amount,
            created_at: b.created_at
          }));
        }

        if (query.includes('FROM invite_links WHERE role')) {
          return self.invite_links.filter(l => l.role === params[0]);
        }

        if (query.includes('FROM invite_links')) {
          return self.invite_links;
        }

        if (query.includes('FROM buyers')) {
          return self.buyers;
        }

        return [];
      }
    };
  }
};

function initializeDatabase() {
  console.log('✅ In-memory database initialized');
}

module.exports = {
  db,
  initializeDatabase
};
