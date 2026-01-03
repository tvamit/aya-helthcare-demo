# TTS Configuration Guide

## Current Settings (Optimized for Natural Human Tone)

```python
length_scale = 0.80   # Slightly faster (natural conversation pace)
noise_scale = 0.6     # Good variation for natural speech
noise_w = 0.8         # Natural duration variation
```

## What These Parameters Do

### 1. **length_scale** (Speech Speed)
- **Range**: 0.5 to 2.0
- **Default**: 1.0 (normal speed)
- **Current**: 0.80 (slightly faster, more natural)

```
0.5  = 2x faster (very fast, for urgent announcements)
0.8  = Natural conversation pace ⭐ RECOMMENDED
1.0  = Normal speed
1.2  = Slower (good for elderly patients)
2.0  = Half speed (very slow)
```

### 2. **noise_scale** (Voice Variation/Naturalness)
- **Range**: 0.0 to 1.0
- **Default**: 0.667
- **Current**: 0.6 (natural variation)

```
0.0  = Robotic, no variation
0.3  = Clear, consistent (announcements)
0.6  = Natural conversation ⭐ RECOMMENDED
0.8  = Very expressive
1.0  = Maximum variation (might sound unstable)
```

### 3. **noise_w** (Duration Variation)
- **Range**: 0.0 to 1.0
- **Default**: 0.8
- **Current**: 0.8 (natural rhythm)

```
0.0  = Mechanical rhythm
0.5  = Consistent timing
0.8  = Natural rhythm ⭐ RECOMMENDED
1.0  = Maximum variation
```

## Use Cases & Recommended Settings

### Hospital Reception (Current Settings) ⭐
**Best for: General patient interactions**
```json
{
  "length_scale": 0.80,
  "noise_scale": 0.6,
  "noise_w": 0.8
}
```

### Emergency Announcements
**Best for: Urgent, clear communication**
```json
{
  "length_scale": 0.7,
  "noise_scale": 0.3,
  "noise_w": 0.5
}
```

### Elderly Patients
**Best for: Slower, clearer speech**
```json
{
  "length_scale": 1.2,
  "noise_scale": 0.5,
  "noise_w": 0.7
}
```

### Professional Consultation
**Best for: Doctor-like tone**
```json
{
  "length_scale": 0.9,
  "noise_scale": 0.667,
  "noise_w": 0.8
}
```

### Quick Information
**Best for: Fast information delivery**
```json
{
  "length_scale": 0.6,
  "noise_scale": 0.4,
  "noise_w": 0.6
}
```

## API Endpoints

### Get Current Config
```bash
curl http://localhost:5002/config
```

### Update Config
```bash
curl -X POST http://localhost:5002/config \
  -H "Content-Type: application/json" \
  -d '{
    "length_scale": 0.80,
    "noise_scale": 0.6,
    "noise_w": 0.8
  }'
```

### Set Fast Mode (Emergencies)
```bash
curl -X POST http://localhost:5002/config \
  -H "Content-Type: application/json" \
  -d '{
    "length_scale": 0.7,
    "noise_scale": 0.3
  }'
```

### Set Slow Mode (Elderly)
```bash
curl -X POST http://localhost:5002/config \
  -H "Content-Type: application/json" \
  -d '{
    "length_scale": 1.2,
    "noise_scale": 0.5
  }'
```

## Testing Different Configurations

### Test Script (test_voice.sh)
```bash
#!/bin/bash

# Test normal speech
curl -X POST http://localhost:5002/config -H "Content-Type: application/json" \
  -d '{"length_scale": 0.80, "noise_scale": 0.6, "noise_w": 0.8}'

curl -X POST http://localhost:5002/synthesize -H "Content-Type: application/json" \
  -d '{"text": "Hello, how can I help you today?", "language": "en"}' \
  --output test_normal.mp3

# Test fast speech
curl -X POST http://localhost:5002/config -H "Content-Type: application/json" \
  -d '{"length_scale": 0.6, "noise_scale": 0.4}'

curl -X POST http://localhost:5002/synthesize -H "Content-Type: application/json" \
  -d '{"text": "Emergency! Please proceed to the ICU immediately.", "language": "en"}' \
  --output test_fast.mp3

# Test slow speech
curl -X POST http://localhost:5002/config -H "Content-Type: application/json" \
  -d '{"length_scale": 1.2, "noise_scale": 0.5}'

curl -X POST http://localhost:5002/synthesize -H "Content-Type: application/json" \
  -d '{"text": "Your appointment is scheduled for tomorrow at 9 AM.", "language": "en"}' \
  --output test_slow.mp3
```

## Integration with Backend

The TTS service is already integrated. To use different settings for specific scenarios, you can call the config endpoint before synthesis in your NestJS backend:

```typescript
// ai.service.ts

async textToSpeech(text: string, config?: TTSConfig): Promise<any> {
  // Update config if provided
  if (config) {
    await axios.post(`${this.ttsUrl}/config`, config);
  }

  // Synthesize speech
  const response = await axios.post(`${this.ttsUrl}/synthesize`, {
    text,
    language: 'hi'
  }, {
    responseType: 'stream'
  });

  return response.data;
}
```

## Fine-Tuning Tips

1. **For most natural speech**: Keep `noise_scale` between 0.5-0.7
2. **For conversation**: Use `length_scale` 0.75-0.85
3. **For stability**: Keep `noise_w` at 0.7-0.8
4. **Avoid extremes**: Don't go below 0.5 length_scale or above 1.2
5. **Test thoroughly**: Always test with your actual use case

## Performance Impact

- ✅ **No performance impact** - These parameters only affect audio quality, not processing speed
- ✅ **Real-time safe** - All values work in real-time scenarios
- ✅ **Memory efficient** - No additional memory usage

## Current Production Settings

Your hospital AI is configured with **optimal natural human tone**:
- **Speed**: 0.80 (natural conversation pace)
- **Variation**: 0.6 (realistic human variation)
- **Rhythm**: 0.8 (natural speech rhythm)

These settings have been tested and optimized for hospital patient interactions! 🏥✨
