"""
Whisper Speech-to-Text Service
Latest Version - 2026
Supports Hindi & English
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import tempfile
import os
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS for Node.js backend

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load Whisper model (Latest - base model for speed, use 'large-v3' for best accuracy)
logger.info("Loading Whisper model...")
model = whisper.load_model("base")  # Options: tiny, base, small, medium, large-v3
logger.info("Whisper model loaded successfully!")

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "whisper-stt"})

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """
    Transcribe audio to text
    Supports: Hindi, English, and 97+ other languages
    """
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400

        audio_file = request.files['audio']
        language = request.form.get('language', 'hi')  # Default Hindi

        # Save temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp:
            audio_file.save(temp.name)
            temp_path = temp.name

        try:
            # Transcribe with Whisper
            logger.info(f"Transcribing audio in language: {language}")
            result = model.transcribe(
                temp_path,
                language=language,
                task='transcribe',
                fp16=False  # Use fp16=True if GPU available
            )

            logger.info(f"Transcription: {result['text']}")

            return jsonify({
                "success": True,
                "text": result['text'].strip(),
                "language": result['language'],
                "segments": len(result.get('segments', []))
            })

        finally:
            # Cleanup temp file
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
