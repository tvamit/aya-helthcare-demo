#!/bin/bash

echo "🎤 Testing TTS Voice Configurations"
echo "===================================="

TTS_URL="http://localhost:5002"

# Function to test voice
test_voice() {
    local name=$1
    local length=$2
    local noise=$3
    local noise_w=$4
    local text=$5
    local lang=$6

    echo ""
    echo "Testing: $name"
    echo "  length_scale: $length"
    echo "  noise_scale: $noise"
    echo "  noise_w: $noise_w"

    # Update config
    curl -s -X POST $TTS_URL/config \
      -H "Content-Type: application/json" \
      -d "{\"length_scale\": $length, \"noise_scale\": $noise, \"noise_w\": $noise_w}" > /dev/null

    # Generate speech
    curl -s -X POST $TTS_URL/synthesize \
      -H "Content-Type: application/json" \
      -d "{\"text\": \"$text\", \"language\": \"$lang\"}" \
      --output "test_${name}.mp3"

    echo "  ✅ Generated: test_${name}.mp3"
}

# Test 1: Natural Human Tone (RECOMMENDED)
test_voice "natural" 0.80 0.6 0.8 \
  "Hello! Welcome to Apollo Hospital. How may I assist you today?" "en"

# Test 2: Emergency Mode (Fast & Clear)
test_voice "emergency" 0.7 0.3 0.5 \
  "Attention! Please proceed to the emergency room immediately." "en"

# Test 3: Elderly Mode (Slow & Clear)
test_voice "elderly" 1.2 0.5 0.7 \
  "Your appointment is scheduled for tomorrow at nine A M. Please arrive 15 minutes early." "en"

# Test 4: Professional (Doctor-like)
test_voice "professional" 0.9 0.667 0.8 \
  "Based on your symptoms, I recommend consulting with a cardiologist." "en"

# Test 5: Hindi Natural
test_voice "hindi_natural" 0.80 0.6 0.8 \
  "नमस्ते! अपोलो अस्पताल में आपका स्वागत है। मैं आपकी कैसे मदद कर सकता हूं?" "hi"

# Test 6: Hindi Emergency
test_voice "hindi_emergency" 0.7 0.4 0.5 \
  "कृपया तुरंत इमरजेंसी रूम में आएं।" "hi"

echo ""
echo "===================================="
echo "✅ All tests complete!"
echo ""
echo "Generated files:"
ls -lh test_*.mp3
echo ""
echo "To play files, use:"
echo "  mpg123 test_natural.mp3"
echo "  or open in your media player"
