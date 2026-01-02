from flask import Flask, request, jsonify
import subprocess
import os
import time
import re
from pathlib import Path

app = Flask(__name__)

# Configuration
PIPER_PATH = '/home/techvoot/ai-tools/piper'
MODELS = {
    'hi': '/home/techvoot/ai-tools/piper/hi_IN-priyamvada-medium.onnx',
    'en': '/home/techvoot/ai-tools/piper/en_US-amy-medium.onnx'
}

def split_into_sentences(text, lang='en'):
    """Split text into sentences for chunked TTS"""
    if not text or not text.strip():
        return []
    
    # Clean up text
    text = text.strip()
    
    if lang == 'hi':
        # Hindi sentence endings: ।, ?, !
        # Split by sentence endings but keep the punctuation
        # Pattern: split on sentence endings (।, !, ?) optionally followed by space
        sentences = re.split(r'([।!?]+)\s*', text)
        result = []
        current = ''
        for part in sentences:
            if part.strip():
                current += part
                # Check if this part is a sentence ending
                if re.match(r'^[।!?]+$', part.strip()):
                    if current.strip():
                        result.append(current.strip())
                    current = ''
        if current.strip():
            result.append(current.strip())
        return [s for s in result if s.strip()]
    else:
        # English: split by . ! ? followed by space or end of string
        # Pattern: sentence ending punctuation followed by space or end
        sentences = re.split(r'([.!?]+)\s+', text)
        result = []
        current = ''
        
        for i, part in enumerate(sentences):
            if part.strip():
                current += part
                # If this part is only punctuation, it's a sentence ending
                if re.match(r'^[.!?]+$', part.strip()):
                    if current.strip():
                        result.append(current.strip())
                    current = ''
        
        # Add remaining text if any
        if current.strip():
            result.append(current.strip())
        
        # Fallback: if no sentences found (no punctuation), return whole text
        if not result:
            result = [text]
        
        return [s for s in result if s.strip()]

@app.route('/synthesize', methods=['POST'])
def synthesize():
    """Generate full audio (backward compatibility)"""
    try:
        data = request.json
        text = data.get('text')
        lang = data.get('lang', 'en')
        output_dir = data.get('output_dir')
        
        if not text:
            return jsonify({'success': False, 'error': 'Text is required'}), 400
        
        if lang not in MODELS:
            return jsonify({'success': False, 'error': f'Unsupported language: {lang}'}), 400
        
        timestamp = int(time.time() * 1000)
        output_file = os.path.join(output_dir, f'welcome_{timestamp}.wav')
        model_path = MODELS[lang]
        piper_binary = os.path.join(PIPER_PATH, 'build', 'piper')
        
        if not os.path.exists(piper_binary):
            return jsonify({'success': False, 'error': f'Piper binary not found: {piper_binary}'}), 500
        
        if not os.path.exists(model_path):
            return jsonify({'success': False, 'error': f'Model not found: {model_path}'}), 500
        
        process = subprocess.Popen(
            [
                piper_binary,
                '--model', model_path,
                '--length_scale', '0.80',
                '--noise_scale', '0.7',
                '--noise_w', '0.8',
                '--output_file', output_file
            ],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=PIPER_PATH,
            env={**os.environ, 'ESPEAK_DATA_PATH': '/usr/lib/x86_64-linux-gnu/espeak-ng-data'}
        )
        
        stdout, stderr = process.communicate(input=text)
        
        if process.returncode != 0:
            return jsonify({
                'success': False,
                'error': f'Piper failed: {stderr}'
            }), 500
        
        audio_url = f'/welcome_{timestamp}.wav'
        
        return jsonify({
            'success': True,
            'url': audio_url,
            'file_path': output_file
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/synthesize_chunk', methods=['POST'])
def synthesize_chunk():
    """Generate TTS for a single sentence/chunk"""
    try:
        data = request.json
        text = data.get('text')
        lang = data.get('lang', 'en')
        output_dir = data.get('output_dir')
        chunk_id = data.get('chunk_id', 0)
        
        if not text or not text.strip():
            return jsonify({'success': False, 'error': 'Text is required'}), 400
        
        if lang not in MODELS:
            return jsonify({'success': False, 'error': f'Unsupported language: {lang}'}), 400
        
        timestamp = int(time.time() * 1000)
        output_file = os.path.join(output_dir, f'chunk_{chunk_id}_{timestamp}.wav')
        model_path = MODELS[lang]
        piper_binary = os.path.join(PIPER_PATH, 'build', 'piper')
        
        if not os.path.exists(piper_binary):
            return jsonify({'success': False, 'error': f'Piper binary not found: {piper_binary}'}), 500
        
        if not os.path.exists(model_path):
            return jsonify({'success': False, 'error': f'Model not found: {model_path}'}), 500
        
        process = subprocess.Popen(
            [
                piper_binary,
                '--model', model_path,
                '--length_scale', '0.80',
                '--noise_scale', '0.7',
                '--noise_w', '0.8',
                '--output_file', output_file
            ],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=PIPER_PATH,
            env={**os.environ, 'ESPEAK_DATA_PATH': '/usr/lib/x86_64-linux-gnu/espeak-ng-data'}
        )
        
        stdout, stderr = process.communicate(input=text)
        
        if process.returncode != 0:
            return jsonify({
                'success': False,
                'error': f'Piper failed: {stderr}'
            }), 500
        
        audio_url = f'/chunk_{chunk_id}_{timestamp}.wav'
        
        return jsonify({
            'success': True,
            'url': audio_url,
            'file_path': output_file,
            'chunk_id': chunk_id,
            'text': text
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/split_sentences', methods=['POST'])
def split_sentences():
    """Split text into sentences for chunking"""
    try:
        data = request.json
        text = data.get('text')
        lang = data.get('lang', 'en')
        
        if not text:
            return jsonify({'success': False, 'error': 'Text is required'}), 400
        
        sentences = split_into_sentences(text, lang)
        
        return jsonify({
            'success': True,
            'sentences': sentences,
            'count': len(sentences)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'tts'}), 200

if __name__ == '__main__':
    print('🎙️  Starting Python TTS Service on port 5002...')
    app.run(host='0.0.0.0', port=5002, debug=False)

