const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
require('dotenv').config()

const client = new Client();

// Store for tracking messages and orders
const messageTracker = {
  processedMessages: new Set(),
  activeOrders: new Map(),
  
  // Check if message was already processed
  isProcessed: function(messageId) {
    return this.processedMessages.has(messageId);
  },
  
  // Mark message as processed
  markProcessed: function(messageId) {
    this.processedMessages.add(messageId);
  },
  
  // Add new order
  addOrder: function(phoneNumber, orderDetails) {
    this.activeOrders.set(phoneNumber, {
      details: orderDetails,
      timestamp: new Date(),
      status: 'pending'
    });
  },
  
  // Check if user has active order
  hasActiveOrder: function(phoneNumber) {
    return this.activeOrders.has(phoneNumber);
  },
  
  // Get order details
  getOrder: function(phoneNumber) {
    return this.activeOrders.get(phoneNumber);
  }
};

client.on('qr', (qr) => {
  console.log('QR code received');
  qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
  console.log('Client is ready!');
});

client.initialize();

client.on('message', message => {
  // Skip if message was already processed
  if (messageTracker.isProcessed(message.id.id)) {
    console.log('\n⚠️ Duplicate message detected, skipping...');
    return;
  }

  // Enhanced terminal logging
  console.log('\n📱 New Message Received:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`👤 From: ${message.from}`);
  console.log(`📝 Message: ${message.body}`);
  console.log(`⏰ Time: ${new Date().toLocaleString()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const reply = generateAutoReply(message);
  message.reply(reply);
  
  // Mark message as processed
  messageTracker.markProcessed(message.id.id);
});

function generateAutoReply(message) {
  const phoneNumber = message.from;
  const messageText = message.body.toLowerCase();
  
  // Check if the message contains order-related keywords
  const orderKeywords = ['americano', 'cappuccino', 'hot', 'iced'];
  const hasOrder = orderKeywords.some(keyword => messageText.includes(keyword));

  // If user has active order, send appropriate message
  if (messageTracker.hasActiveOrder(phoneNumber)) {
    const order = messageTracker.getOrder(phoneNumber);
    return `⚠️ You already have an active order:

${order.details}

Please wait for your current order to be completed before placing a new one. 😊`;
  }

  if (hasOrder) {
    // Format the order confirmation message
    const orderMessage = `Hi! 👋 Thanks for your order:

${message.body}

Total: RM12

💳 Kindly make payment to:
•⁠  ⁠TnG: 0167405900
or  
•⁠  ⁠Bank Transfer: 
MAYBANK
PANG KOK CHUNG
164360679076

Once payment is received, we'll start brewing your drinks ☕  
You can collect them at the 1st floor lobby collection corner. We'll notify you once it's ready! 😊`;

    // Add order to tracker
    messageTracker.addOrder(phoneNumber, message.body);
    
    return orderMessage;
  } else {
    // Default menu message
    return `☕️ RED COFFEE 
📍Untuk penduduk Residen Jubilee sahaja

Order je dari rumah 😍
Pick up kat Lobby Collection Corner 🛎️

—

🔥 Fresh brew setiap hari
😋 Sedap, mudah & jimat masa!
🚫 Tak perlu turun jauh atau tunggu rider!

—

🌟 Promo Menu
Americano – Hot RM5
Cappuccino – Hot RM6

—`;
  }
}