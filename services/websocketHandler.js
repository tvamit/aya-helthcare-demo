const { generateWelcomeAudio } = require('./ttsService');
const messages = require('../config/messages.json');

// Store connected clients
const clients = new Set();

/**
 * Handle new WebSocket connection
 * @param {WebSocket} ws - WebSocket connection instance
 */
async function handleConnection(ws) {
  console.log('\n========================================');
  console.log(`📞 ${messages.status.newConnection}`);
  console.log('========================================');
  console.log('Time:', new Date().toLocaleString());
  console.log('Total clients:', clients.size + 1);

  clients.add(ws);

  // Wait a moment to ensure connection is fully established
  await new Promise(resolve => setTimeout(resolve, 100));

  // Generate and send welcome audio
  try {
    const lang = 'hi'; // Default language, can be made configurable
    console.log('\n🎙️  Starting welcome audio generation...');
    console.log('Language:', lang);
    console.log('Message:', messages.welcome[lang]);

    const audioUrl = await generateWelcomeAudio(messages.welcome[lang], lang);

    console.log('\n📤 Sending welcome message to client...');
    console.log('Audio URL:', audioUrl);

    const welcomeMessage = {
      type: 'WELCOME_AUDIO',
      url: audioUrl,
      lang: lang
    };

    console.log('Message payload:', JSON.stringify(welcomeMessage, null, 2));

    // Check if connection is still open before sending
    if (ws.readyState === 1) { // 1 = OPEN
      ws.send(JSON.stringify(welcomeMessage));
      console.log(`✅ ${messages.status.messageSent}!`);
    } else {
      console.log('⚠️  Connection closed before welcome message could be sent');
    }

    console.log('========================================\n');
  } catch (error) {
    console.error('\n❌ WELCOME AUDIO ERROR:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('========================================\n');
    // Continue without welcome audio if generation fails
  }

  // Handle incoming messages
  ws.on('message', (message) => {
    handleMessage(ws, message);
  });

  // Handle disconnection
  ws.on('close', () => {
    console.log(`📴 ${messages.status.callEnded}`);
    clients.delete(ws);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
}

/**
 * Handle incoming WebSocket messages
 * @param {WebSocket} ws - WebSocket connection instance
 * @param {*} message - Received message (binary or string)
 */
function handleMessage(ws, message) {
  // Check if message is binary (audio data) or text (JSON)
  if (typeof message === 'string') {
    try {
      const data = JSON.parse(message);
      console.log('Received JSON message:', data);
      // Handle any future text-based messages here
    } catch (e) {
      console.log('Received non-JSON text message');
    }
  } else {
    // Binary audio data
    console.log('Received audio chunk:', message.length, 'bytes');

    // Broadcast audio to all other connected clients
    clients.forEach((client) => {
      if (client !== ws && client.readyState === 1) { // 1 = OPEN
        client.send(message);
      }
    });
  }
}

module.exports = { handleConnection };
