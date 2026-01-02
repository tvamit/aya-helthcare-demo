const axios = require('axios');
const path = require('path');

const TTS_SERVICE_URL = process.env.TTS_SERVICE_URL || 'http://localhost:5002';
const OUTPUT_DIR = path.join(__dirname, '..', 'public');

/**
 * Generate audio file using Python TTS service (full text - backward compatibility)
 * @param {string} text - Text to convert to speech
 * @param {string} lang - Language code (hi or en)
 * @returns {Promise<string>} - URL path to generated audio file
 */
async function generateWelcomeAudio(text, lang = 'en') {
  try {
    console.log(`🎙️  Calling Python TTS service...`);
    console.log(`   Language: ${lang}`);
    console.log(`   Text length: ${text.length} characters`);

    const response = await axios.post(`${TTS_SERVICE_URL}/synthesize`, {
      text: text,
      lang: lang,
      output_dir: OUTPUT_DIR
    }, {
      timeout: 30000 // 30 seconds timeout
    });

    if (response.data.success) {
      console.log(`✅ Audio generated: ${response.data.url}`);
      return response.data.url;
    } else {
      throw new Error(response.data.error || 'TTS service failed');
    }
  } catch (error) {
    console.error('❌ TTS Service Error:', error.message);
    // Fallback to old method if Python service is not available
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('⚠️  Python TTS service not available, falling back to direct Piper call');
      return generateWelcomeAudioFallback(text, lang);
    }
    throw error;
  }
}

/**
 * Fallback: Generate audio using direct Piper call (old method)
 */
function generateWelcomeAudioFallback(text, lang = 'en') {
  const { spawn } = require('child_process');
  const fs = require('fs');
  const PIPER_CONFIG = require('../config/piper.config');
  const messages = require('../config/messages.json');

  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const outputFile = path.join(__dirname, '..', 'public', `welcome_${timestamp}.wav`);
    const model = PIPER_CONFIG.modelPaths[lang];

    if (!model) {
      return reject(new Error(`${messages.errors.unsupportedLanguage}: ${lang}`));
    }

    console.log(`🎙️  ${messages.status.generatingAudio} (fallback mode)`);
    console.log(`   Language: ${lang}`);

    const piper = spawn(PIPER_CONFIG.piperBinary, [
      '--model', model,
      '--length_scale', PIPER_CONFIG.audioSettings.lengthScale.toString(),
      '--noise_scale', PIPER_CONFIG.audioSettings.noiseScale.toString(),
      '--noise_w', PIPER_CONFIG.audioSettings.noiseW.toString(),
      '--output_file', outputFile
    ], {
      cwd: PIPER_CONFIG.piperPath,
      env: {
        ...process.env,
        ESPEAK_DATA_PATH: PIPER_CONFIG.espeakDataPath
      }
    });

    piper.stdin.write(text);
    piper.stdin.end();

    let errorOutput = '';

    piper.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    piper.on('close', (code) => {
      if (code !== 0) {
        console.error('❌ Piper error:', errorOutput);
        return reject(new Error(`Piper exited with code ${code}`));
      }

      const audioUrl = `/welcome_${timestamp}.wav`;
      console.log(`✅ ${messages.status.audioGenerated}: ${audioUrl}`);

      setTimeout(() => {
        fs.unlink(outputFile, (err) => {
          if (err) console.error('Error cleaning up audio file:', err);
          else console.log(`🗑️  ${messages.status.cleanedUp}: ${audioUrl}`);
        });
      }, PIPER_CONFIG.fileCleanupDelay);

      resolve(audioUrl);
    });

    piper.on('error', (error) => {
      console.error('❌ Failed to spawn Piper:', error);
      reject(error);
    });
  });
}

/**
 * Stream TTS: Split text into sentences and generate audio chunks
 * @param {string} text - Full response text
 * @param {string} lang - Language code
 * @param {Function} onChunkReady - Callback when each chunk is ready (chunkId, audioUrl, text)
 * @returns {Promise<void>}
 */
async function streamTTS(text, lang, onChunkReady) {
  try {
    console.log(`🎙️  Streaming TTS for text (${text.length} chars)...`);
    
    // Step 1: Split into sentences
    const splitResponse = await axios.post(`${TTS_SERVICE_URL}/split_sentences`, {
      text: text,
      lang: lang
    }, {
      timeout: 5000
    });

    if (!splitResponse.data.success) {
      throw new Error('Failed to split sentences');
    }

    const sentences = splitResponse.data.sentences;
    console.log(`→ Split into ${sentences.length} sentences`);

    if (sentences.length === 0) {
      throw new Error('No sentences found in text');
    }

    // Step 2: Generate TTS for each sentence
    const generateChunk = async (sentence, chunkId) => {
      const response = await axios.post(`${TTS_SERVICE_URL}/synthesize_chunk`, {
        text: sentence,
        lang: lang,
        output_dir: OUTPUT_DIR,
        chunk_id: chunkId
      }, {
        timeout: 20000
      });

      if (response.data.success) {
        return {
          chunkId: chunkId,
          url: response.data.url,
          text: sentence
        };
      } else {
        throw new Error(response.data.error);
      }
    };

    // Generate first chunk immediately (user hears it right away)
    console.log('→ Generating first chunk immediately...');
    const firstChunk = await generateChunk(sentences[0], 0);
    await onChunkReady(firstChunk.chunkId, firstChunk.url, firstChunk.text);
    console.log(`✅ First chunk ready: ${firstChunk.url}`);

    // Generate remaining chunks in parallel (faster)
    if (sentences.length > 1) {
      console.log(`→ Generating remaining ${sentences.length - 1} chunks in parallel...`);
      const remainingPromises = sentences.slice(1).map((sentence, index) => 
        generateChunk(sentence, index + 1)
      );

      // Process chunks as they complete (stream them)
      for (const promise of remainingPromises) {
        const chunk = await promise;
        await onChunkReady(chunk.chunkId, chunk.url, chunk.text);
        console.log(`✅ Chunk ${chunk.chunkId} ready: ${chunk.url}`);
      }
    }

    console.log('✅ All TTS chunks generated');
  } catch (error) {
    console.error('❌ Stream TTS Error:', error.message);
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('⚠️  Python TTS service not available, using fallback');
      // Fallback: generate full audio
      const fullAudioUrl = await generateWelcomeAudioFallback(text, lang);
      await onChunkReady(0, fullAudioUrl, text);
    } else {
      throw error;
    }
  }
}

module.exports = { 
  generateWelcomeAudio,
  streamTTS 
};
