"""
gTTS Text-to-Speech Service
Python 3.12 Compatible - FREE
Supports Hindi & English with Google TTS
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

logger.info("✅ gTTS service initialized successfully!")

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
        "engine": "gTTS (Google Text-to-Speech)"
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)
