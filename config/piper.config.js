const path = require('path');

// Piper TTS configuration
const PIPER_CONFIG = {
  piperPath: '/home/techvoot/ai-tools/piper',
  espeakDataPath: '/usr/lib/x86_64-linux-gnu/espeak-ng-data',

  models: {
    hi: 'hi_IN-priyamvada-medium.onnx',
    en: 'en_US-amy-medium.onnx'
  },

  audioSettings: {
    lengthScale: 0.80,
    noiseScale: 0.7,
    noiseW: 0.8
  },

  fileCleanupDelay: 30000 // 30 seconds
};

// Derived paths
PIPER_CONFIG.piperBinary = path.join(PIPER_CONFIG.piperPath, 'build', 'piper');
PIPER_CONFIG.modelPaths = {
  hi: path.join(PIPER_CONFIG.piperPath, PIPER_CONFIG.models.hi),
  en: path.join(PIPER_CONFIG.piperPath, PIPER_CONFIG.models.en)
};

module.exports = PIPER_CONFIG;
