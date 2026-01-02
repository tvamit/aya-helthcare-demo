const axios = require("axios");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const STT_SERVICE_URL = process.env.STT_SERVICE_URL || "http://localhost:5001";

// Fallback: whisper.cpp paths
const WHISPER_PATH = path.resolve(
  "/home/techvoot/ai-tools/whisper.cpp/build/bin/whisper-cli"
);
const MODEL_PATH = path.resolve(
  "/home/techvoot/ai-tools/whisper.cpp/models/ggml-small.bin"
);

const TEMP_DIR = path.resolve(__dirname, "../tmp");
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Convert audio buffer → text using Python Whisper service
 * @param {Buffer} audioBuffer - Audio data (WebM or WAV)
 * @param {string} lang - Language code (hi, en)
 * @returns {Promise<string>} - Transcribed text
 */
async function speechToText(audioBuffer, lang = "en") {
  try {
    console.log("\n🎧 Calling Python STT service...");
    console.log("→ Audio buffer size:", audioBuffer.length, "bytes");
    console.log("→ Language:", lang);
    console.log("→ Service URL:", STT_SERVICE_URL);

    // Convert buffer to base64
    const audioBase64 = audioBuffer.toString("base64");

    const response = await axios.post(
      `${STT_SERVICE_URL}/transcribe`,
      {
        audio: audioBase64,
        lang: lang,
      },
      {
        timeout: 20000, // 20 seconds timeout (optimized)
      }
    );

    if (response.data.success) {
      console.log("✅ Transcription:", response.data.text);
      console.log("→ Detected language:", response.data.language);
      return response.data.text;
    } else {
      throw new Error(response.data.error || "STT service failed");
    }
  } catch (error) {
    console.error("❌ STT Service Error:", error.message);

    // Fallback to old whisper.cpp method if Python service unavailable
    if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
      console.log(
        "⚠️  Python STT service not available, falling back to whisper.cpp"
      );
      return speechToTextFallback(audioBuffer, lang);
    }
    throw error;
  }
}

/**
 * Fallback: Convert audio buffer → text using whisper.cpp
 * @param {Buffer} audioBuffer - Audio data (WebM or WAV)
 * @param {string} lang - Language code (hi, en)
 * @returns {Promise<string>} - Transcribed text
 */
function speechToTextFallback(audioBuffer, lang = "en") {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    const inputPath = path.join(TEMP_DIR, `${id}.webm`);
    const wavPath = path.join(TEMP_DIR, `${id}.wav`);

    console.log("\n🎧 Starting Whisper STT...");
    console.log("→ Audio buffer size:", audioBuffer.length, "bytes");
    console.log("→ Language:", lang);
    console.log("→ Input file:", inputPath);
    console.log("→ Output WAV file:", wavPath);

    try {
      // Save audio buffer to temporary file
      fs.writeFileSync(inputPath, audioBuffer);
      console.log("→ Audio file saved");

      // Convert to WAV using FFmpeg
      console.log("→ Converting to WAV with FFmpeg...");
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        inputPath,
        "-ar",
        "16000", // Sample rate 16kHz
        "-ac",
        "1", // Mono
        "-f",
        "wav", // WAV format
        "-y", // Overwrite output
        wavPath,
      ]);

      let ffmpegError = "";

      ffmpeg.stderr.on("data", (data) => {
        ffmpegError += data.toString();
      });

      ffmpeg.on("close", (code) => {
        // Clean up input file
        try {
          fs.unlinkSync(inputPath);
        } catch (e) {
          console.error("→ Failed to delete input file:", e.message);
        }

        if (code !== 0) {
          console.error("❌ FFmpeg conversion failed:", ffmpegError);
          reject(new Error(`FFmpeg failed with code ${code}`));
          return;
        }

        console.log("✅ Converted to WAV successfully");

        // Now process with Whisper
        processWithWhisper(wavPath, lang, resolve, reject);
      });

      ffmpeg.on("error", (error) => {
        console.error("❌ FFmpeg spawn error:", error);
        try {
          fs.unlinkSync(inputPath);
        } catch (e) {
          // Ignore
        }
        reject(error);
      });
    } catch (error) {
      console.error("❌ Error in speechToText:", error);
      reject(error);
    }
  });
}

/**
 * Process WAV file with Whisper
 */
function processWithWhisper(wavPath, lang, resolve, reject) {
  try {
    const args = [
      "-m",
      MODEL_PATH,
      "-f",
      wavPath,
      "-l",
      lang,
      "--no-timestamps",
      "--no-prints",
    ];

    console.log("→ Spawning Whisper process...");
    console.log("→ Command:", WHISPER_PATH, args.join(" "));

    const whisper = spawn(WHISPER_PATH, args);

    let output = "";
    let errorOutput = "";

    whisper.stdout.on("data", (data) => {
      const text = data.toString();
      output += text;
      console.log("[Whisper stdout]", text.trim());
    });

    whisper.stderr.on("data", (data) => {
      const text = data.toString();
      errorOutput += text;
      console.log("[Whisper stderr]", text.trim());
    });

    whisper.on("close", (code) => {
      console.log("→ Whisper process exited with code:", code);

      // Clean up temp file
      try {
        fs.unlinkSync(wavPath);
        console.log("→ Temp file cleaned up");
      } catch (e) {
        console.error("→ Failed to delete temp file:", e.message);
      }

      if (code === 0) {
        const transcription = output.trim();
        console.log("✅ Transcription:", transcription);
        resolve(transcription);
      } else {
        reject(new Error(`Whisper exited with code ${code}: ${errorOutput}`));
      }
    });

    whisper.on("error", (error) => {
      console.error("❌ Whisper spawn error:", error);

      // Clean up temp file
      try {
        fs.unlinkSync(wavPath);
      } catch (e) {
        // Ignore cleanup errors
      }

      reject(error);
    });
  } catch (error) {
    console.error("❌ Error processing with Whisper:", error);
    reject(error);
  }
}

/**
 * Validate STT service is running
 */
async function validateWhisperSetup() {
  console.log("\n🔍 Validating Python STT service...");

  try {
    const response = await axios.get(`${STT_SERVICE_URL}/health`, {
      timeout: 5000,
    });

    if (response.status === 200) {
      console.log("✅ Python STT service is running");
      if (response.data.model_loaded) {
        console.log("✅ Whisper model loaded");
      } else {
        console.log(
          "⚠️  Whisper model not loaded yet (will load on first request)"
        );
      }
      return true;
    }
  } catch (error) {
    console.error("❌ Python STT service not available:", error.message);
    console.error("   Make sure Python service is running on", STT_SERVICE_URL);
    console.error("   Falling back to whisper.cpp validation...");

    // Fallback validation
    if (!fs.existsSync(WHISPER_PATH)) {
      console.error(`⚠️  Whisper binary not found at: ${WHISPER_PATH}`);
      console.error("   Both Python STT and whisper.cpp are unavailable!");
      return false;
    }
    if (!fs.existsSync(MODEL_PATH)) {
      console.error(`⚠️  Whisper model not found at: ${MODEL_PATH}`);
      console.error("   Both Python STT and whisper.cpp are unavailable!");
      return false;
    }
    console.log("✅ Fallback: whisper.cpp is available");
    return false; // Service not available, but fallback exists
  }
}

module.exports = {
  speechToText,
  validateWhisperSetup,
};
