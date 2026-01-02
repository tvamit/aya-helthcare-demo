const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const PIPER_CONFIG = require('../config/piper.config');
const messages = require('../config/messages.json');

/**
 * Generate audio file using Piper TTS
 * @param {string} text - Text to convert to speech
 * @param {string} lang - Language code (hi or en)
 * @returns {Promise<string>} - URL path to generated audio file
 */
function generateWelcomeAudio(text, lang = 'hi') {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const outputFile = path.join(__dirname, '..', 'public', `welcome_${timestamp}.wav`);
    const model = PIPER_CONFIG.modelPaths[lang];

    if (!model) {
      return reject(new Error(`${messages.errors.unsupportedLanguage}: ${lang}`));
    }

    console.log(`🎙️  ${messages.status.generatingAudio}`);
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

      // Return relative URL path for the client
      const audioUrl = `/welcome_${timestamp}.wav`;
      console.log(`✅ ${messages.status.audioGenerated}: ${audioUrl}`);

      // Schedule file cleanup
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

module.exports = { generateWelcomeAudio };
