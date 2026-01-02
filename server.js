require('dotenv').config();
const express = require('express');
const WebSocket = require('ws');

// Import modules
const { validatePiperSetup } = require('./services/piperValidator');
const { validateWhisperSetup } = require('./services/sttService');
const { handleConnection } = require('./services/websocketHandler');
const messages = require('./config/messages.json');

const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files (HTML client)
app.use(express.static('public'));

// Validate Piper and Whisper setup before starting server
validatePiperSetup();
validateWhisperSetup();

// Create HTTP server
const server = app.listen(PORT, () => {
  console.log(`🚀 ${messages.status.serverRunning} http://localhost:${PORT}`);
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Handle WebSocket connections
wss.on('connection', handleConnection);

console.log(`🎧 ${messages.status.wsReady}`);
