const fs = require('fs');
const PIPER_CONFIG = require('../config/piper.config');
const messages = require('../config/messages.json');

/**
 * Validates that Piper TTS is properly installed and configured
 * @throws {Error} If validation fails
 */
function validatePiperSetup() {
  console.log(`🔍 ${messages.status.validating}`);

  // Check if Piper binary exists
  if (!fs.existsSync(PIPER_CONFIG.piperBinary)) {
    console.error(`❌ ${messages.errors.piperNotFound}`);
    console.error(`   Path: ${PIPER_CONFIG.piperBinary}`);
    process.exit(1);
  }

  // Check if models exist
  const missingModels = [];
  for (const [lang, modelPath] of Object.entries(PIPER_CONFIG.modelPaths)) {
    if (!fs.existsSync(modelPath)) {
      missingModels.push(`${lang}: ${modelPath}`);
    }
  }

  if (missingModels.length > 0) {
    console.error(`❌ ${messages.errors.modelsNotFound}`);
    missingModels.forEach(model => console.error(`   - ${model}`));
    process.exit(1);
  }

  console.log(`✅ ${messages.status.piperFound}`);
  console.log(`✅ ${messages.status.modelsFound}`);
  console.log(`✅ ${messages.status.ttsReady}\n`);
}

module.exports = { validatePiperSetup };
