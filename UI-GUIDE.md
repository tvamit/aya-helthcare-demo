# 🎤 UI Guide - Voice Assistant Kaise Use Karein

## Step-by-Step Voice Interaction

### Step 1: Open Browser
```
http://localhost:8080
```

---

### Step 2: UI Dekho

Aapko ye dikhega:

```
┌────────────────────────────────────────┐
│   🏥 Hospital AI Assistant             │
│   अस्पताल एआई सहायक                  │
└────────────────────────────────────────┘

           [    🎤    ]
        (Blue Circle - 200px)
     Click karein is par ↑

┌────────────────────────────────────────┐
│  Ready to Help                         │
│  माइक बटन दबाएं और सवाल पूछें         │
└────────────────────────────────────────┘
```

---

### Step 3: Microphone Permission

Browser puchega: **"Allow microphone?"**

```
┌─────────────────────────────────────┐
│  localhost:8080 wants to:           │
│  🎤 Use your microphone              │
│                                     │
│     [Block]      [Allow] ← Click    │
└─────────────────────────────────────┘
```

✅ **"Allow" par click karein!**

---

### Step 4: Recording Start

**🎤 Button par click karein:**

UI changes:
```
Before:
   [    🎤    ]  (Blue)

After Click:
   [    ⏹️    ]  (Red - Recording!)

Status shows:
┌────────────────────────────────────────┐
│  Recording...                          │
│  बोलें... सुन रहा हूं 🔴               │
└────────────────────────────────────────┘
```

---

### Step 5: Bolein (Speak!)

**Ab apna sawaal bolein:**

**Hindi:**
- "ICU mein bed available hai kya?"
- "Cardiologist doctor chahiye"
- "Emergency number batao"
- "Hospital ki timing kya hai?"

**English:**
- "Are beds available in ICU?"
- "I need a cardiologist"
- "What is the emergency number?"
- "Hospital timings please"

**Hinglish:**
- "General ward mein bed free hai?"
- "Doctor appointment book karna hai"
- "Lab test kab hota hai?"

---

### Step 6: Stop Recording

**⏹️ Button par phir se click karein**

UI shows:
```
   [    🎤    ]  (Back to blue)

Status:
┌────────────────────────────────────────┐
│  Processing...                         │
│  प्रोसेस हो रहा है... ⏳                │
│  [spinner animation]                   │
└────────────────────────────────────────┘
```

**Backend kya kar raha hai:**
1. 🎤 Audio file receive kar raha
2. 📝 Whisper se text ban raha: "ICU mein bed hai kya?"
3. 🤖 AI soch raha hai aur database check kar raha
4. 💬 Response bana raha: "हां, 3 beds available हैं..."
5. 🔊 Coqui se voice ban raha
6. 📤 Audio bhej raha frontend ko

---

### Step 7: AI Response

**Conversation box mein dikhega:**

```
┌─── Conversation ───────────────────────┐
│                                        │
│  👤 You:                               │
│  ICU mein bed available hai kya?       │
│                                        │
│  🤖 AI:                                │
│  हां, हमारे पास ICU में 3 बेड         │
│  उपलब्ध हैं। ICU वार्ड में बेड नंबर   │
│  ICU-101, मूल्य ₹5000 प्रति दिन।      │
│  क्या आप बुक करना चाहेंगे?            │
│                                        │
└────────────────────────────────────────┘
```

**Aur audio bhi play hoga! 🔊**

Browser automatically AI ki voice play karega!

---

## 🎨 UI Features Explained

### 1. Voice Button States

```
🎤 Blue Circle (Ready)
   ↓ Click
⏹️ Red Circle (Recording)
   ↓ Click
🎤 Blue Circle (Processing...)
   ↓ Wait
🎤 Blue Circle (Ready for next question)
```

### 2. Status Messages

| Status | Meaning |
|--------|---------|
| "Ready to Help" | System tayaar hai |
| "Recording..." | Aapki awaaz record ho rahi |
| "Processing..." | AI soch raha hai |
| "Error" | Kuch galat hua, phir try karein |

### 3. Conversation History

- **Your questions** - Right side, blue background
- **AI responses** - Left side, gray background
- Auto-scroll to latest message
- Shows timestamps

### 4. Clear Chat Button

```
[Clear Chat]  ← Click to reset conversation
```

Saari history delete ho jayegi, fresh start!

### 5. View Stats Button

```
[View Stats]  ← Click to see statistics
```

Shows:
```
┌─── Hospital Statistics ────────────────┐
│  🛏️  Beds Available:     12            │
│  👨‍⚕️  Doctors Available:   5             │
│  🚨 Emergency:          24/7           │
└────────────────────────────────────────┘
```

---

## 🔊 Audio Features

### Voice Input:
- ✅ Supports all modern browsers
- ✅ WebM, WAV, MP3 formats
- ✅ Auto-detects Hindi/English
- ✅ No background noise filtering

### Voice Output:
- ✅ Natural Hindi voice (Coqui TTS)
- ✅ Clear pronunciation
- ✅ Auto-play in browser
- ✅ Can pause/resume

---

## 💡 Tips for Best Results

### 1. Speak Clearly
```
✅ GOOD: "ICU mein bed hai kya?"
❌ BAD: "Umm... uh... I-C-U... bed... hmm"
```

### 2. Use Simple Questions
```
✅ GOOD: "Doctor chahiye"
✅ GOOD: "Bed available hai?"
❌ BAD: "Mujhe ek bahut accha doctor chahiye jo experienced ho aur..."
```

### 3. Wait for Response
```
Don't click mic again while "Processing..."
Wait for audio to finish playing
```

### 4. Microphone Position
```
📱 Phone: Hold 15-20cm from mouth
💻 Laptop: Use built-in mic, speak normally
🎧 Headset: Best quality!
```

---

## 🐛 Troubleshooting

### Problem: No Mic Button Shows

**Solution:**
```bash
# Make sure frontend is running
cd frontend
python3 -m http.server 8080

# Access via localhost (not IP)
http://localhost:8080  ✅
http://127.0.0.1:8080  ❌
```

### Problem: Mic Not Working

**Solution:**
1. Check browser permissions
2. Reload page
3. Allow microphone access
4. Try different browser (Chrome recommended)

### Problem: No Voice Response

**Solution:**
```bash
# Check TTS service running
curl http://localhost:5002/health

# Should return: {"status":"healthy"}

# Restart if needed
cd python-services/coqui-tts
python app.py
```

### Problem: Wrong Transcription

**Solution:**
- Speak slower
- Reduce background noise
- Use Hindi or English clearly
- Don't mix too much in one sentence

---

## 📱 Mobile Usage

### Android:
1. Open Chrome browser
2. Go to http://your-server-ip:8080
3. Allow microphone
4. Tap mic button, speak, tap again

### iOS (iPhone/iPad):
1. Open Safari browser
2. Go to http://your-server-ip:8080
3. Allow microphone
4. Tap mic button, speak, tap again

**Note:** Mobile needs HTTPS for production!

---

## 🎯 Complete Example Flow

### Example 1: Check Bed Availability

**You:** 🎤 "ICU mein bed hai kya?"

**AI:** 🔊 "हां, हमारे पास ICU में 3 बेड उपलब्ध हैं..."

**UI Shows:**
```
User: ICU mein bed hai kya?
AI: हां, हमारे पास ICU में 3 बेड उपलब्ध हैं।
    बेड नंबर ICU-101, मूल्य ₹5000 प्रति दिन।
```

### Example 2: Find Doctor

**You:** 🎤 "Cardiologist doctor chahiye"

**AI:** 🔊 "हमारे पास 1 डॉक्टर उपलब्ध हैं..."

**UI Shows:**
```
User: Cardiologist doctor chahiye
AI: हमारे पास 1 डॉक्टर उपलब्ध हैं: डॉ. राजेश गुप्ता
    (Cardiologist), फीस ₹1500। क्या आप अपॉइंटमेंट बुक करना चाहेंगे?
```

### Example 3: Emergency

**You:** 🎤 "Emergency number kya hai?"

**AI:** 🔊 "हमारा इमरजेंसी नंबर है: 108..."

**UI Shows:**
```
User: Emergency number kya hai?
AI: हमारा इमरजेंसी नंबर है: 108। हम 24/7 उपलब्ध हैं।
    कृपया तुरंत संपर्क करें।
```

---

## ✨ Advanced Features

### Voice Commands:
```
"Clear chat" → Clears conversation
"Show stats" → Shows statistics
"Help" → Shows help info
```

### Keyboard Shortcuts:
```
Space → Start/Stop recording
Esc → Cancel recording
Enter → Send (future feature)
```

---

**🎊 Ab jaake try karein! Voice assistant fully ready hai!**

Open: **http://localhost:8080**
Click: **🎤**
Speak: **"ICU mein bed hai kya?"**
Listen: **AI response! 🔊**
