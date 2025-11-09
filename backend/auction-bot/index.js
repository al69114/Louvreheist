// --- IMPORTS ---
const express = require('express');
const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios'); // <-- Using axios, which is in your package.json

// --- CONFIGURATION (from Environment Variables) ---
const token = process.env.TELEGRAM_TOKEN;
const adminChatId = process.env.ADMIN_CHAT_ID;
const dbUrl = process.env.DATABASE_URL; // From Neon
const PORT = process.env.PORT || 3000;
const apiUrl = process.env.RENDER_EXTERNAL_URL; // Your app's own public URL

// --- 1. STATE MANAGEMENT ---
// This object will hold conversations in memory.
// Key: userId, Value: { step, type, data }
const userStates = {};

// --- 2. DATABASE CONNECTION ---
const pool = new Pool({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

// --- 3. API & KEEP-ALIVE SERVER (EXPRESS) ---
const app = express();
app.use(express.json());

// Keep-alive route for UptimeRobot
app.get('/health', (req, res) => {
  res.status(200).send('Bot and API are alive!');
});

//api end point section to check code validity

// Called by your *main website backend* to validate a code
app.get('/check-code/:code', async (req, res) => {
  const { code } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT request_type FROM requests WHERE code = $1 AND status = $2',
      [code, 'approved']
    );
    
    if (result.rows.length > 0) {
      // Code is valid and approved!
      res.status(200).json({ 
        valid: true, 
        type: result.rows[0].request_type // 'seller' or 'buyer'
      });
    } else {
      // Code does not exist or is not approved
      res.status(404).json({ valid: false, message: 'Invalid or expired code' });
    }
  } catch (err) {
    console.error('API Error /check-code:', err.message);
    res.status(500).json({ valid: false, message: 'Server error' });
  }
});


// --- API ENDPOINTS ---

// NEW: Updated to handle description and photos
app.post('/request-code', async (req, res) => {
  const { userId, username, type, description, photos } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO requests (user_id, username, request_type, description, photos) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [userId, username, type, description, photos || null]
    );
    const newRequestId = result.rows[0].id;
    res.status(201).json({ success: true, requestId: newRequestId });
  } catch (err) {
    console.error('API Error /request-code:', err.message);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// This endpoint is unchanged
app.post('/approve-request', async (req, res) => {
  const { requestId } = req.body;
  const newCode = nanoid(8);
  try {
    const result = await pool.query(
      'UPDATE requests SET status = $1, code = $2 WHERE id = $3 AND status = $4 RETURNING user_id, request_type',
      ['approved', newCode, requestId, 'pending']
    );
    
    if (result.rows.length > 0) {
      const { user_id, request_type } = result.rows[0];
      res.status(200).json({ 
        success: true, 
        code: newCode, 
        userId: user_id,
        type: request_type
      });
    } else {
      res.status(404).json({ success: false, message: 'Request not found' });
    }
  } catch (err) {
    console.error('API Error /approve-request:', err.message);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Start the web server
app.listen(PORT, () => {
  console.log(`API server and keep-alive listening on port ${PORT}`);
});

// --- 4. TELEGRAM BOT LOGIC ---
const bot = new TelegramBot(token, { polling: true });
console.log('Bot started and listening for Telegram messages...');

// NEW: Main message listener to handle conversations
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const text = msg.text;
  const state = userStates[userId];

  // Ignore messages that aren't text or photos in a conversation
  if (!text && !msg.photo) {
    return;
  }

  // --- 4a. Handle Commands ---
  if (text) {
    // '/start' command
    if (text === '/start') {
      return bot.sendMessage(chatId, 'Welcome! Use /request_seller_code or /request_buyer_code to begin.');
    }

    // '/cancel' command: Clears the user's state
    if (text === '/cancel') {
      if (state) {
        delete userStates[userId];
        return bot.sendMessage(chatId, 'Your request has been cancelled.');
      }
      return bot.sendMessage(chatId, 'You have no active request to cancel.');
    }

    // '/request_buyer_code': This is still a simple, one-step request
    if (text === '/request_buyer_code') {
      if (state) return bot.sendMessage(chatId, 'Please /cancel your current request before starting a new one.');
      
      try {
        const username = msg.from.username || msg.from.first_name;
        // Call the API directly
        const response = await axios.post(`${apiUrl}/request-code`, {
          userId: userId,
          username: username,
          type: 'buyer'
        });
        
        const newRequestId = response.data.requestId;
        
        // Notify admin
        bot.sendMessage(adminChatId, `New BUYER request from @${username} (ID: ${newRequestId})`, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Approve', callback_data: `approve:${newRequestId}` },
                { text: '❌ Reject', callback_data: `reject:${newRequestId}` }
              ]
            ]
          }
        });
        
        return bot.sendMessage(chatId, 'Your request for a buyer code has been sent to the admin.');
      } catch (err) {
        console.error('Bot Error /request_buyer_code:', err.message);
        return bot.sendMessage(chatId, 'Sorry, something went wrong.');
      }
    }

    // '/request_seller_code': This command STARTS the conversation
    if (text === '/request_seller_code') {
      if (state) return bot.sendMessage(chatId, 'Please /cancel your current request before starting a new one.');
      
      userStates[userId] = {
        step: 'awaiting_description',
        type: 'seller',
        data: {
          userId: userId,
          username: msg.from.username || msg.from.first_name,
          type: 'seller',
          description: '',
          photos: []
        }
      };
      return bot.sendMessage(chatId, 'OK, you want to sell an item. First, please send me a detailed description (one single text message).');
    }

    // '/done' command for photos
    if (text === '/done' && state && state.step === 'awaiting_photos') {
      return submitForApproval(userId, chatId);
    }
  }

  // --- 4b. Handle Conversation Steps ---
  if (state) {
    // STEP 1: Awaiting Description
    if (state.step === 'awaiting_description') {
      if (!text) return bot.sendMessage(chatId, 'Please send me a text description.');
      
      state.data.description = text;
      state.step = 'awaiting_photos';
      return bot.sendMessage(chatId, 'Great. Now, please send me one or more photos of the item. When you are all done, type /done.');
    }

    // STEP 2: Awaiting Photos
    if (state.step === 'awaiting_photos') {
      if (msg.photo) {
        // Save the largest photo's ID
        const photoFileId = msg.photo[msg.photo.length - 1].file_id;
        state.data.photos.push(photoFileId);
        return bot.sendMessage(chatId, 'Photo saved. Send another, or type /done when finished.');
      }
      
      if (text !== '/done') {
        return bot.sendMessage(chatId, 'Please send photos, or type /done.');
      }
    }
  }
});

// NEW: Function to bundle and submit the user's data
async function submitForApproval(userId, chatId) {
  const state = userStates[userId];
  if (!state || state.step !== 'awaiting_photos') return;

  const data = state.data;
  
  try {
    // 1. Save all data to our API
    const response = await axios.post(`${apiUrl}/request-code`, data);
    const newRequestId = response.data.requestId;

    // 2. Notify the user
    bot.sendMessage(chatId, 'Your submission has been sent to the admin for review! I will message you when it is approved.');

    // 3. Send the full bundle to the admin
    bot.sendMessage(adminChatId, `🔔 New SELLER Request! 🔔\nID: ${newRequestId}\nFrom: @${data.username}`);
    bot.sendMessage(adminChatId, `Description:\n\n${data.description}`);

    if (data.photos && data.photos.length > 0) {
      bot.sendMessage(adminChatId, 'Photos:');
      // Create a "media group" to send all photos as a nice album
      const media = data.photos.map(fileId => ({
        type: 'photo',
        media: fileId
      }));
      bot.sendMediaGroup(adminChatId, media);
    }

    // 4. Send the admin the approval buttons
    bot.sendMessage(adminChatId, `Do you want to approve this request? (ID: ${newRequestId})`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Approve', callback_data: `approve:${newRequestId}` },
            { text: '❌ Reject', callback_data: `reject:${newRequestId}` }
          ]
        ]
      }
    });

    // 5. Clean up the user's state
    delete userStates[userId];

  } catch (err) {
    console.error('Bot Error submitForApproval:', err.message);
    bot.sendMessage(chatId, 'Sorry, something went wrong while submitting your request. Please try again later.');
    delete userStates[userId];
  }
}


// --- 5. CALLBACK QUERY (Approval) ---
// This part is mostly unchanged, but I added rejection handling.
bot.on('callback_query', async (callbackQuery) => {
  const msg = callbackQuery.message;
  const [action, requestId] = callbackQuery.data.split(':');

  if (action === 'approve') {
    try {
      // Tell API to approve and get code
      const response = await axios.post(`${apiUrl}/approve-request`, {
        requestId: requestId
      });
      
      const { code, userId, type } = response.data;

      // Notify the original user
      bot.sendMessage(userId, 
        `Your request for a ${type} code was APPROVED! 🎉\n\nYour new code is: \n\n**${code}**\n\nLog in with this link: http://172.20.185.211:3000/seller`,
        { parse_mode: 'Markdown' }
      );

      // Update the admin's message
      bot.editMessageText(`✅ Approved (Code: ${code})`, {
        chat_id: msg.chat.id,
        message_id: msg.message_id
      });

    } catch (err) {
      console.error('Bot Error /approve callback:', err.message);
      bot.editMessageText(`Error approving: ${err.message}`, {
        chat_id: msg.chat.id,
        message_id: msg.message_id
      });
    }
  } 
  
  else if (action === 'reject') {
    // NEW: Handle rejection
    try {
        // You can add logic here to update the DB status to 'rejected'
        // For now, we'll just notify the user.
        
        // We need to get the user's ID from our database
        const dbRes = await pool.query('SELECT user_id FROM requests WHERE id = $1', [requestId]);
        const userId = dbRes.rows[0]?.user_id;

        if (userId) {
            bot.sendMessage(userId, 'Unfortunately, your recent request was not approved by the admin.');
        }

        bot.editMessageText('❌ Request Rejected', {
            chat_id: msg.chat.id,
            message_id: msg.message_id
        });
    } catch (err) {
        console.error('Bot Error /reject callback:', err.message);
        bot.editMessageText('Error rejecting.', {
            chat_id: msg.chat.id,
            message_id: msg.message_id
        });
    }
  }
});

