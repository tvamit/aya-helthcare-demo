const { generateWelcomeAudio, streamTTS } = require("./ttsService");
const { resolveUserQuery } = require("./aiResolver");
const { speechToText } = require("./sttService");
const messages = require("../config/messages.json");

// Store connected clients
const clients = new Set();

/**
 * Handle new WebSocket connection
 * @param {WebSocket} ws - WebSocket connection instance
 */
async function handleConnection(ws) {
  console.log("\n========================================");
  console.log(`📞 ${messages.status.newConnection}`);
  console.log("========================================");
  console.log("Time:", new Date().toLocaleString());
  console.log("Total clients:", clients.size + 1);

  clients.add(ws);

  // Wait a moment to ensure connection is fully established
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Generate and send welcome audio
  try {
    const lang = "en"; // Default language, can be made configurable
    console.log("\n🎙️  Starting welcome audio generation...");
    console.log("Language:", lang);
    console.log("Message:", messages.welcome[lang]);

    const audioUrl = await generateWelcomeAudio(messages.welcome[lang], lang);

    console.log("\n📤 Sending welcome message to client...");
    console.log("Audio URL:", audioUrl);

    const welcomeMessage = {
      type: "WELCOME_AUDIO",
      url: audioUrl,
      lang: lang,
    };

    console.log("Message payload:", JSON.stringify(welcomeMessage, null, 2));

    // Check if connection is still open before sending
    if (ws.readyState === 1) {
      // 1 = OPEN
      ws.send(JSON.stringify(welcomeMessage));
      console.log(`✅ ${messages.status.messageSent}!`);
    } else {
      console.log("⚠️  Connection closed before welcome message could be sent");
    }

    console.log("========================================\n");
  } catch (error) {
    console.error("\n❌ WELCOME AUDIO ERROR:");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("========================================\n");
    // Continue without welcome audio if generation fails
  }

  // Handle incoming messages
  ws.on("message", (message) => {
    handleMessage(ws, message);
  });

  // Handle disconnection
  ws.on("close", () => {
    console.log(`📴 ${messages.status.callEnded}`);
    clients.delete(ws);
  });

  // Handle errors
  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    clients.delete(ws);
  });
}

/**
 * Handle incoming WebSocket messages
 * @param {WebSocket} ws - WebSocket connection instance
 * @param {*} message - Received message (binary or string)
 */
async function handleMessage(ws, message) {
  console.log("\n========================================");
  console.log("📩 handleMessage CALLED");
  console.log("========================================");
  console.log("Message type:", typeof message);
  console.log("Message is Buffer?", Buffer.isBuffer(message));
  console.log("Message length:", message.length);

  // Check if message is binary (audio data) or text (JSON)
  if (typeof message === "string") {
    console.log("→ Message is STRING type");
    try {
      const data = JSON.parse(message);
      console.log("→ Successfully parsed JSON");
      console.log("→ Data:", JSON.stringify(data, null, 2));
      console.log("→ Data type field:", data.type);

      // Handle text-based user query (from "Ask AI" button with Web Speech API)
      if (data.type === "USER_QUERY") {
        console.log(
          "✅ USER_QUERY detected! (Text-based query from browser STT)"
        );
        await handleUserQuery(ws, data);
      } else {
        console.log("⚠️  Message type is NOT USER_QUERY:", data.type);
      }
    } catch (e) {
      console.log("❌ Failed to parse JSON:", e.message);
      console.log("→ Raw message:", message);
    }
  } else {
    // Binary audio data - Process with Whisper STT
    console.log("→ Message is BINARY (Buffer) type - VOICE AUDIO");
    console.log("→ Received audio:", message.length, "bytes");

    // Check minimum audio size (500 bytes - allows short questions)
    if (message.length < 500) {
      console.log("⚠️  Audio too small (<500 bytes), ignoring");
      return;
    }

    try {
      // Convert voice to text using Whisper
      console.log("→ Converting speech to text with Whisper...");
      const lang = "en"; // Default language, can be made configurable per client
      const transcribedText = await speechToText(message, lang);

      console.log("✅ Transcription complete:", transcribedText);

      // Process the transcribed text as a query
      if (transcribedText && transcribedText.trim().length > 0) {
        const queryData = {
          text: transcribedText,
          lang: lang,
        };
        await handleUserQuery(ws, queryData);
      } else {
        console.log("⚠️  Empty transcription, ignoring");

        // Send feedback to client
        const errorMessage = {
          type: "AI_RESPONSE",
          text:
            lang === "hi"
              ? "क्षमा करें, मुझे कुछ सुनाई नहीं दिया। कृपया दोबारा बोलें।"
              : "Sorry, I didn't hear anything. Please speak again.",
          error: true,
        };

        if (ws.readyState === 1) {
          ws.send(JSON.stringify(errorMessage));
        }
      }
    } catch (error) {
      console.error("❌ Error processing voice audio:", error.message);
      console.error("→ Error stack:", error.stack);

      // Send error response to client
      const errorMessage = {
        type: "AI_RESPONSE",
        text:
          "hi" === "hi"
            ? "क्षमा करें, मैं आपकी आवाज़ नहीं समझ पाई। कृपया दोबारा बोलें।"
            : "Sorry, I couldn't understand your voice. Please try again.",
        error: true,
      };

      if (ws.readyState === 1) {
        ws.send(JSON.stringify(errorMessage));
      }
    }
  }
  console.log("========================================\n");
}

/**
 * Handle user voice query with AI
 * @param {WebSocket} ws - WebSocket connection
 * @param {object} data - Query data {text, lang}
 */
async function handleUserQuery(ws, data) {
  const { text, lang = "en" } = data;

  console.log("\n========================================");
  console.log("🎤 USER QUERY RECEIVED");
  console.log("========================================");
  console.log("Query:", text);
  console.log("Language:", lang);
  console.log("WebSocket state:", ws.readyState);

  try {
    // Get AI response
    console.log("\n→ Step 1: Resolving query with AI...");
    const responseText = await resolveUserQuery(text, lang);

    console.log("\n→ Step 2: AI Response received:");
    console.log("Response:", responseText);
    console.log("Response length:", responseText.length);

    // Send initial response text immediately (user sees it)
    if (ws.readyState === 1) {
      ws.send(
        JSON.stringify({
          type: "AI_RESPONSE_START",
          text: responseText,
          lang: lang,
        })
      );
      console.log("→ Sent AI_RESPONSE_START to client");
    }

    // Stream TTS in chunks for better user experience
    console.log("\n→ Step 3: Streaming TTS audio chunks...");

    let totalChunks = 0;
    await streamTTS(
      responseText,
      lang,
      async (chunkId, audioUrl, chunkText) => {
        totalChunks = chunkId + 1;
        if (ws.readyState === 1) {
          // Send each chunk as it's ready
          ws.send(
            JSON.stringify({
              type: "AI_RESPONSE_CHUNK",
              chunkId: chunkId,
              url: audioUrl,
              text: chunkText,
              isLast: false, // Will be set to true for last chunk
            })
          );
          console.log(
            `→ Sent chunk ${chunkId}: ${chunkText.substring(0, 50)}...`
          );
        }
      }
    );

    // Send completion message
    if (ws.readyState === 1) {
      ws.send(
        JSON.stringify({
          type: "AI_RESPONSE_END",
          totalChunks: totalChunks,
        })
      );
      console.log(`✅ All ${totalChunks} chunks sent to client!`);
      console.log("========================================\n");
    } else {
      console.error("⚠️  WebSocket not open. State:", ws.readyState);
    }
  } catch (error) {
    console.error("\n========================================");
    console.error("❌ ERROR HANDLING USER QUERY");
    console.error("========================================");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("========================================\n");

    // Send error response
    const errorMessage = {
      type: "AI_RESPONSE",
      text:
        lang === "hi"
          ? "क्षमा करें, मुझे समस्या हो रही है। कृपया दोबारा प्रयास करें।"
          : "Sorry, I'm having trouble. Please try again.",
      error: true,
    };

    if (ws.readyState === 1) {
      ws.send(JSON.stringify(errorMessage));
      console.log("→ Error message sent to client");
    }
  }
}

module.exports = { handleConnection };
