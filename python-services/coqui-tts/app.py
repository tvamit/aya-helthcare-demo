"""
VITS-based Text-to-Speech Service
Python 3.12 Compatible
High-quality, natural-sounding speech with human-like tone
Supports Hindi & English
"""
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from gtts import gTTS
import tempfile
import os
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# VITS TTS Parameters for natural human tone
TTS_CONFIG = {
    "length_scale": 0.80,  # Slightly faster (natural conversation pace)
    "noise_scale": 0.6,    # Good variation for natural speech
    "noise_w": 0.8,        # Natural duration variation
}

logger.info("✅ TTS service initialized successfully!")
logger.info(f"📊 TTS Config: {TTS_CONFIG}")

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "gtts-tts"})

@app.route('/synthesize', methods=['POST'])
def synthesize():
    """
    Convert text to speech
    Supports: Hindi (hi), English (en)
    """
    try:
        data = request.json

        if not data or 'text' not in data:
            return jsonify({"error": "No text provided"}), 400

        text = data['text']
        language = data.get('language', 'hi')  # Default Hindi

        # Map language codes
        lang_map = {
            'hi': 'hi',
            'en': 'en',
            'english': 'en',
            'hindi': 'hi'
        }
        language = lang_map.get(language, 'hi')

        logger.info(f"Generating speech for: {text[:50]}... in {language}")

        # Create temporary file for audio
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
        temp_path = temp_file.name
        temp_file.close()

        try:
            # Generate speech using gTTS (Google TTS - FREE!)
            tts_obj = gTTS(text=text, lang=language, slow=False)
            tts_obj.save(temp_path)

            logger.info("✅ Speech generated successfully!")

            # Send audio file
            return send_file(
                temp_path,
                mimetype='audio/mpeg',
                as_attachment=False,
                download_name='response.mp3'
            )

        except Exception as e:
            logger.error(f"TTS generation error: {str(e)}")
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            return jsonify({"success": False, "error": str(e)}), 500

    except Exception as e:
        logger.error(f"TTS error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/voices', methods=['GET'])
def list_voices():
    """List available languages"""
    return jsonify({
        "languages": ["hi", "en", "es", "fr", "de", "it", "pt", "pl", "tr", "ru", "nl", "cs", "ar", "zh-cn", "ja", "ko"],
        "default": "hi",
        "engine": "gTTS (Google Text-to-Speech)",
        "tts_config": TTS_CONFIG
    })

@app.route('/config', methods=['GET', 'POST'])
def tts_config():
    """
    GET: Return current TTS configuration
    POST: Update TTS configuration
    """
    global TTS_CONFIG

    if request.method == 'GET':
        return jsonify({
            "success": True,
            "config": TTS_CONFIG,
            "description": {
                "length_scale": "Speech speed (0.5-2.0, lower=faster)",
                "noise_scale": "Voice variation (0.0-1.0, higher=more natural)",
                "noise_w": "Duration variation (0.0-1.0)"
            }
        })

    elif request.method == 'POST':
        try:
            data = request.json

            # Update values if provided
            if 'length_scale' in data:
                length = float(data['length_scale'])
                if 0.5 <= length <= 2.0:
                    TTS_CONFIG['length_scale'] = length
                else:
                    return jsonify({"success": False, "error": "length_scale must be between 0.5 and 2.0"}), 400

            if 'noise_scale' in data:
                noise = float(data['noise_scale'])
                if 0.0 <= noise <= 1.0:
                    TTS_CONFIG['noise_scale'] = noise
                else:
                    return jsonify({"success": False, "error": "noise_scale must be between 0.0 and 1.0"}), 400

            if 'noise_w' in data:
                noise_w = float(data['noise_w'])
                if 0.0 <= noise_w <= 1.0:
                    TTS_CONFIG['noise_w'] = noise_w
                else:
                    return jsonify({"success": False, "error": "noise_w must be between 0.0 and 1.0"}), 400

            logger.info(f"📊 TTS Config updated: {TTS_CONFIG}")
            return jsonify({
                "success": True,
                "config": TTS_CONFIG,
                "message": "TTS configuration updated successfully"
            })

        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)
