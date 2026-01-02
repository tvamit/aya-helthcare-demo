#!/usr/bin/env python3
"""
Unified Python Services Starter
Starts both TTS and STT services in one process using threading
"""

import threading
import time
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Try to use venv if available
venv_path = os.path.join(os.path.dirname(__file__), 'venv')
if os.path.exists(venv_path):
    venv_python = os.path.join(venv_path, 'bin', 'python3')
    if os.path.exists(venv_python):
        print(f'✅ Using virtual environment: {venv_path}')

# Import services
try:
    import tts_service
    import stt_service
except ImportError as e:
    print(f'❌ Error importing services: {e}')
    print('   Make sure tts_service.py and stt_service.py are in the same directory')
    import traceback
    traceback.print_exc()
    sys.exit(1)

def run_tts_service():
    """Run TTS service on port 5002"""
    print('🎙️  Starting TTS Service on port 5002...')
    tts_service.app.run(host='0.0.0.0', port=5002, debug=False, use_reloader=False, threaded=True)

def run_stt_service():
    """Run STT service on port 5001"""
    print('🎧 Starting STT Service on port 5001...')
    stt_service.app.run(host='0.0.0.0', port=5001, debug=False, use_reloader=False, threaded=True)

if __name__ == '__main__':
    print('=' * 60)
    print('🚀 Starting Python Services (TTS + STT)')
    print('=' * 60)
    print('')
    print('Services:')
    print('  📍 TTS Service: http://localhost:5002')
    print('  📍 STT Service: http://localhost:5001')
    print('')
    print('Press Ctrl+C to stop all services')
    print('=' * 60)
    print('')
    
    # Start TTS service in a separate thread
    tts_thread = threading.Thread(target=run_tts_service, daemon=True)
    tts_thread.start()
    
    # Small delay to let TTS service start
    time.sleep(1)
    
    # Start STT service in a separate thread
    stt_thread = threading.Thread(target=run_stt_service, daemon=True)
    stt_thread.start()
    
    # Small delay to let STT service start
    time.sleep(1)
    
    print('✅ Both services started!')
    print('')
    
    try:
        # Keep main thread alive
        while True:
            time.sleep(1)
            # Check if threads are still alive
            if not tts_thread.is_alive():
                print('⚠️  TTS service thread died')
            if not stt_thread.is_alive():
                print('⚠️  STT service thread died')
    except KeyboardInterrupt:
        print('')
        print('=' * 60)
        print('🛑 Stopping all services...')
        print('=' * 60)
        sys.exit(0)

