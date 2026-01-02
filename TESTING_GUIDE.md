# 🏥 Apollo Hospital AI Assistant - Testing Guide

## 🎯 Features Overview

Your AI assistant can now handle:
- ✅ **Any hospital-related question** (departments, doctors, facilities, services)
- ✅ **Medical symptom guidance** (chest pain, fever, headache, etc.)
- ✅ **Multilingual support** (Auto-detect Hindi/English and respond accordingly)
- ✅ **Real-time database queries** (current bed availability, doctor availability)
- ✅ **Static knowledge base** (hospital info, policies, booking process)
- ✅ **Smart routing** (Database vs Knowledge-based queries)

---

## 🧪 Test Cases

### 1. Medical Symptom Queries (Hindi & English)

#### Test Case 1.1: Chest Pain (EMERGENCY)
```json
// Hindi
{
  "query": "मुझे सीने में दर्द हो रहा है, मैं क्या करूं?"
}

// English
{
  "query": "I have chest pain, what should I do?"
}

Expected Response:
- Urgency: HIGH - तुरंत Emergency में जाएं
- Medical advice about heart attack possibility
- Emergency contact number
```

#### Test Case 1.2: Fever
```json
{
  "query": "3 din se bukhar hai, kya karun?"
}

Expected Response:
- Medical advice about when to see doctor
- Which department to visit (General Physician)
- Home remedies suggestion
```

#### Test Case 1.3: Breathing Problem
```json
{
  "query": "sans lene me dikkat ho rahi hai"
}

Expected Response:
- Urgency: HIGH - Emergency immediately
- Pulmonology department info
- Emergency contact
```

---

### 2. Doctor Queries

#### Test Case 2.1: Specific Specialist
```json
// Hindi
{
  "query": "Cardiologist doctor available hai kya?"
}

// English
{
  "query": "Do you have cardiologist doctors available?"
}

Expected Response:
- Dr. Rajesh Kumar details
- Timings: Mon, Wed, Fri: 10 AM - 2 PM
- Consultation fee: ₹1500
- Next available slot
```

#### Test Case 2.2: Pediatrician
```json
{
  "query": "बच्चे के लिए doctor chahiye"
}

Expected Response:
- Dr. Sneha Reddy (Pediatrician)
- Experience, qualifications
- Timings and fees
- Floor number and contact
```

#### Test Case 2.3: All Doctors Info
```json
{
  "query": "Hospital me kitne doctor hai aur kis specialist ke?"
}

Expected Response:
- List of all 8 doctors
- Their specializations
- Brief timing info
```

---

### 3. Department & Services

#### Test Case 3.1: Department Info
```json
{
  "query": "Cardiology department kahan hai?"
}

Expected Response:
- Floor number: 3
- Services: ECG, 2D Echo, Angiography, Bypass Surgery
- OPD timings: Mon-Sat 9 AM - 5 PM
```

#### Test Case 3.2: Emergency Services
```json
{
  "query": "Emergency service 24 ghante available hai kya?"
}

Expected Response:
- Yes, 24/7 available
- Ground floor location
- Services: Accident care, trauma surgery, critical care
- Emergency number
```

#### Test Case 3.3: Lab Services
```json
{
  "query": "Blood test karwana hai, kab mil jayega report?"
}

Expected Response:
- Lab timings: 24/7
- Blood test: Same day
- Location: Ground floor
- Services available
```

---

### 4. Bed & Room Availability

#### Test Case 4.1: ICU Bed Availability (DATABASE QUERY)
```json
{
  "query": "ICU me abhi kitne bed khali hai?"
}

Expected Response:
- Real-time count from database
- ICU bed details: 50 total, ₹5000/day
- Features: 24/7 monitoring, ventilator support
```

#### Test Case 4.2: General Ward
```json
{
  "query": "General ward me room available hai?"
}

Expected Response:
- Real-time availability
- Price: ₹1500/day
- Features: AC rooms, nursing care, TV
```

#### Test Case 4.3: Room Types
```json
{
  "query": "Hospital me kaun kaun se room types hai?"
}

Expected Response:
- ICU, General Ward, Private, Deluxe, NICU
- Price range
- Features of each type
```

---

### 5. Booking & Admission

#### Test Case 5.1: Appointment Booking
```json
{
  "query": "Appointment kaise book kare?"
}

Expected Response:
- Step-by-step booking process
- Contact number: 1860-500-1066
- Online booking: www.apollohospital.com/book-appointment
- Cancellation policy
```

#### Test Case 5.2: Hospital Admission
```json
{
  "query": "Hospital me admit hona hai, kya process hai?"
}

Expected Response:
- 4-step admission process
- Documents required (Aadhar, insurance card)
- Advance payment: ₹10,000 minimum
```

---

### 6. Facilities & Timings

#### Test Case 6.1: Pharmacy
```json
{
  "query": "Pharmacy timing kya hai?"
}

Expected Response:
- 24/7 available
- Ground floor
- Home delivery available
```

#### Test Case 6.2: Visiting Hours
```json
{
  "query": "Patient ko milne ka time kya hai?"
}

Expected Response:
- General ward: 11 AM-1 PM, 5 PM-7 PM
- ICU: 30 min twice (11 AM, 5 PM)
- NICU: Parents only, 30 min twice
```

#### Test Case 6.3: Ambulance Service
```json
{
  "query": "Ambulance chahiye emergency me"
}

Expected Response:
- 24/7 available
- Contact: 1860-500-1066 (Press 1)
- Charges: ₹1000-3000
- Advanced & Basic Life Support
```

---

### 7. Insurance & Payment

#### Test Case 7.1: Insurance Acceptance
```json
{
  "query": "Kya aap insurance accept karte ho?"
}

Expected Response:
- Cashless: Star Health, ICICI Lombard, HDFC Ergo, New India
- Reimbursement: All major insurances
- Process details
```

---

### 8. General Hospital Info

#### Test Case 8.1: Hospital Overview
```json
{
  "query": "Hospital ke bare me batao"
}

Expected Response:
- Name: Apollo Multispecialty Hospital
- Location: Sector 26, Delhi NCR
- Established: 1995
- Total beds: 500
- Accreditation: NABH & JCI
- Contact details
```

#### Test Case 8.2: COVID Protocol
```json
{
  "query": "COVID test available hai?"
}

Expected Response:
- RT-PCR: ₹500, Rapid Antigen: ₹300
- Report timing: 6-24 hours
- Ground floor diagnostic lab
- COVID protocol (mask mandatory, 1 visitor limit)
```

---

### 9. Complex Queries

#### Test Case 9.1: Multi-part Query
```json
{
  "query": "Muje pet dard hai, kaunsa doctor dikhau aur fees kitni hai?"
}

Expected Response:
- Medical advice for stomach pain
- Department: Gastroenterology
- Dr. Suresh Menon details
- Fees: ₹1300
- Services: Endoscopy, colonoscopy available
```

#### Test Case 9.2: Comparison Query
```json
{
  "query": "Private room aur deluxe room me kya difference hai?"
}

Expected Response:
- Private: ₹3000/day, AC, bathroom, TV, sofa
- Deluxe: ₹5000/day, premium AC, mini fridge, sofa bed, premium meals
- Feature comparison
```

---

## 🔄 Language Detection Tests

### Auto-detection
```json
// Pure Hindi
{"query": "मुझे डॉक्टर चाहिए"}
→ Response in Hindi

// Pure English
{"query": "I need a doctor"}
→ Response in English

// Hinglish
{"query": "Doctor available hai kya?"}
→ Response in Hinglish (detected as Hindi due to "hai" and "kya")
```

---

## 🎯 Smart Routing Tests

### Database Queries (Real-time)
These queries will fetch live data from database:
- "Abhi kitne bed khali hai?"
- "Currently doctor available hai?"
- "Right now ICU me bed hai?"

### Knowledge-based Queries (Static)
These use the knowledge base:
- "Hospital ki timing kya hai?"
- "Cardiologist doctor kaun hai?"
- "Pharmacy kahan hai?"
- "Appointment kaise book kare?"

---

## 🚀 How to Test

### 1. Using cURL
```bash
curl -X POST http://localhost:3000/ai/text-query \
  -H "Content-Type: application/json" \
  -d '{"query": "मुझे सीने में दर्द हो रहा है"}'
```

### 2. Using Postman
```
POST http://localhost:3000/ai/text-query
Body (JSON):
{
  "query": "ICU me abhi bed available hai kya?"
}
```

### 3. Using Voice (Complete Flow)
```bash
# Record audio or upload audio file
curl -X POST http://localhost:3000/ai/voice-query \
  -F "audio=@recording.wav"

# Response will be audio file with headers containing transcription and text response
```

---

## 📊 Expected Behavior

### ✅ Correct Responses Should Have:
1. **Accurate information** from knowledge base or database
2. **Language consistency** (query language = response language)
3. **Specific details** (floor numbers, prices, timings)
4. **Empathetic tone** for medical queries
5. **Emergency urgency** clearly stated for critical symptoms
6. **Contact numbers** when relevant

### ❌ Edge Cases to Check:
1. Ambiguous queries: Should ask for clarification
2. Out-of-scope queries: Should politely redirect to reception
3. Multiple symptoms: Should prioritize most urgent
4. Database connection failure: Should gracefully fallback to knowledge base

---

## 🎓 Training Examples for Better Results

If you want to add more capabilities, update `hospital-knowledge.ts`:

```typescript
// Add new department
departments: [
  ...existing,
  {
    name: "Dermatology",
    hindiName: "त्वचा रोग विभाग",
    // ... details
  }
]

// Add new symptom guidance
medicalGuidance: {
  symptoms: {
    ...existing,
    skinRash: {
      hindi: "त्वचा पर दाने",
      urgency: "LOW",
      advice: "...",
      department: "Dermatology"
    }
  }
}
```

---

## 📞 Support

For issues or questions:
- Emergency: 1860-500-1066
- Email: info@apollohospital.com
- Reception: Contact main reception

---

**Note:** This AI assistant is a demo. For actual medical emergencies, always call emergency services or visit the hospital immediately.
