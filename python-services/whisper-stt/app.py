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
import re

app = Flask(__name__)
CORS(app)  # Enable CORS for Node.js backend

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load Whisper model (Using 'small' for better accuracy while maintaining reasonable speed)
# Options: tiny (fastest, least accurate), base, small (balanced), medium, large-v3 (best accuracy, slowest)
logger.info("Loading Whisper model (small)...")
model = whisper.load_model("small")  # Good balance of speed and accuracy
logger.info("Whisper model loaded successfully!")

def fix_common_transcription_errors(text: str) -> str:
    """
    Fix common Whisper transcription errors
    """
    # Common misheard phrases (case-insensitive)
    corrections = {
        # Date/time phrases
        r'\b2\s*day\s+mourning\b': 'today morning',
        r'\b2\s*day\b': 'today',
        r'\bto\s*day\b': 'today',
        r'\bto\s*morrow\b': 'tomorrow',
        r'\b2\s*morrow\b': 'tomorrow',
        r'\bthis\s+mourning\b': 'this morning',
        r'\bthis\s+afternoon\b': 'this afternoon',
        r'\bthis\s+evening\b': 'this evening',
        r'\bto\s*night\b': 'tonight',

        # Time expressions
        r'\btan\s*[ea]m\b': '10 am',
        r'\bten\s*[ea]m\b': '10 am',
        r'\b10\s*[ea]m\b': '10 am',
        r'\btan\s*pm\b': '10 pm',
        r'\bten\s*pm\b': '10 pm',
        r'\bnine\s*[ea]m\b': '9 am',
        r'\bnine\s*pm\b': '9 pm',
        r'\beleven\s*[ea]m\b': '11 am',
        r'\beleven\s*pm\b': '11 pm',

        # Morning/afternoon/evening
        r'\bmourning\b': 'morning',
        r'\bmorning\s+ten\s*[ea]m\b': 'morning 10 am',
        r'\bmorning\s+tan\s*[ea]m\b': 'morning 10 am',
        r'\bmorning\s+nine\s*[ea]m\b': 'morning 9 am',

        # Morning/afternoon/evening without am/pm (assume morning = am, afternoon/evening = pm)
        r'\bmorning\s+10\b': 'morning 10 am',
        r'\bmorning\s+ten\b': 'morning 10 am',
        r'\bmorning\s+9\b': 'morning 9 am',
        r'\bmorning\s+nine\b': 'morning 9 am',
        r'\bmorning\s+11\b': 'morning 11 am',
        r'\bmorning\s+eleven\b': 'morning 11 am',
        r'\bmorning\s+8\b': 'morning 8 am',
        r'\bmorning\s+eight\b': 'morning 8 am',
        r'\bafternoon\s+2\b': 'afternoon 2 pm',
        r'\bafternoon\s+two\b': 'afternoon 2 pm',
        r'\bafternoon\s+3\b': 'afternoon 3 pm',
        r'\bafternoon\s+three\b': 'afternoon 3 pm',
        r'\bafternoon\s+4\b': 'afternoon 4 pm',
        r'\bafternoon\s+four\b': 'afternoon 4 pm',
        r'\bevening\s+5\b': 'evening 5 pm',
        r'\bevening\s+five\b': 'evening 5 pm',
        r'\bevening\s+6\b': 'evening 6 pm',
        r'\bevening\s+six\b': 'evening 6 pm',
    }

    fixed_text = text
    for pattern, replacement in corrections.items():
        fixed_text = re.sub(pattern, replacement, fixed_text, flags=re.IGNORECASE)

    return fixed_text

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "whisper-stt"})

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """
    Transcribe audio to text
    Supports: Hindi, English, and 97+ other languages
    Auto-detects language if not specified
    """
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400

        audio_file = request.files['audio']
        language = request.form.get('language', None)  # Auto-detect if not specified

        # Save temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp:
            audio_file.save(temp.name)
            temp_path = temp.name

        try:
            # Transcribe with Whisper
            if language:
                logger.info(f"Transcribing audio in language: {language}")
                result = model.transcribe(
                    temp_path,
                    language=language,
                    task='transcribe',
                    fp16=False  # Use fp16=True if GPU available
                )
            else:
                logger.info("Transcribing audio with auto language detection")
                result = model.transcribe(
                    temp_path,
                    task='transcribe',
                    fp16=False  # Use fp16=True if GPU available
                )

            # Fix common transcription errors
            transcribed_text = result['text'].strip()
            fixed_text = fix_common_transcription_errors(transcribed_text)

            if fixed_text != transcribed_text:
                logger.info(f"Original: {transcribed_text}")
                logger.info(f"Fixed: {fixed_text} (detected language: {result['language']})")
            else:
                logger.info(f"Transcription: {fixed_text} (detected language: {result['language']})")

            return jsonify({
                "success": True,
                "text": fixed_text,
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
