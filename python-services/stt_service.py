from flask import Flask, request, jsonify
import whisper
import base64
import tempfile
import os
import subprocess
from pathlib import Path

app = Flask(__name__)

# Load Whisper model once at startup
model = None

def load_model():
    """Load Whisper model (lazy loading)"""
    global model
    if model is None:
        print('📥 Loading Whisper model (base)...')
        try:
            model = whisper.load_model("base")  # Good balance of speed/accuracy
            print('✅ Whisper model loaded')
        except Exception as e:
            print(f'❌ Error loading Whisper model: {e}')
            raise
    return model

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """Transcribe audio using OpenAI Whisper"""
    try:
        data = request.json
        audio_base64 = data.get('audio')
        lang = data.get('lang', 'en')  # 'hi' or 'en' or None for auto-detect
        
        if not audio_base64:
            return jsonify({'success': False, 'error': 'Audio data is required'}), 400
        
        print(f'\n🎧 Transcribing audio...')
        print(f'→ Language: {lang}')
        print(f'→ Audio data size: {len(audio_base64)} base64 chars')
        
        # Decode base64 audio
        try:
            audio_bytes = base64.b64decode(audio_base64)
            print(f'→ Decoded audio size: {len(audio_bytes)} bytes')
        except Exception as e:
            return jsonify({'success': False, 'error': f'Invalid base64 audio: {str(e)}'}), 400
        
        # Save to temporary file
        tmp_path = None
        wav_path = None
        
        try:
            # Create temp file with .webm extension
            with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as tmp_file:
                tmp_file.write(audio_bytes)
                tmp_path = tmp_file.name
            
            print(f'→ Saved to temp file: {tmp_path}')
            
            # Convert WebM to WAV using FFmpeg (if needed)
            wav_path = tmp_path.replace('.webm', '.wav')
            print(f'→ Converting to WAV: {wav_path}')
            
            ffmpeg_result = subprocess.run([
                'ffmpeg', '-i', tmp_path,
                '-ar', '16000',  # Sample rate 16kHz
                '-ac', '1',      # Mono
                '-f', 'wav',     # Format
                '-y',            # Overwrite
                wav_path
            ], capture_output=True, text=True)
            
            if ffmpeg_result.returncode != 0:
                raise Exception(f'FFmpeg conversion failed: {ffmpeg_result.stderr}')
            
            print('✅ Converted to WAV successfully')
            
            # Load model
            whisper_model = load_model()
            
            # Transcribe with Whisper
            # If lang is None, Whisper will auto-detect
            print('→ Transcribing with Whisper...')
            result = whisper_model.transcribe(
                wav_path,
                language=lang if lang in ['hi', 'en'] else None,
                task='transcribe',
                fp16=False  # Use fp32 for better compatibility
            )
            
            transcription = result['text'].strip()
            detected_lang = result.get('language', lang)
            
            print(f'✅ Transcription: {transcription}')
            print(f'→ Detected language: {detected_lang}')
            
            return jsonify({
                'success': True,
                'text': transcription,
                'language': detected_lang
            })
        finally:
            # Clean up temp files
            for file_path in [tmp_path, wav_path]:
                if file_path and os.path.exists(file_path):
                    try:
                        os.unlink(file_path)
                        print(f'→ Cleaned up: {file_path}')
                    except Exception as e:
                        print(f'⚠️  Failed to clean up {file_path}: {e}')
                
    except Exception as e:
        print(f'❌ Transcription error: {str(e)}')
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        # Try to load model if not loaded
        load_model()
        return jsonify({'status': 'ok', 'service': 'stt', 'model_loaded': model is not None}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'service': 'stt', 'error': str(e)}), 500

if __name__ == '__main__':
    print('🎧 Starting Python STT Service on port 5001...')
    # Pre-load model on startup
    try:
        load_model()
    except Exception as e:
        print(f'⚠️  Warning: Could not pre-load model: {e}')
        print('   Model will be loaded on first request')
    app.run(host='0.0.0.0', port=5001, debug=False)


