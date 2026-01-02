export const HOSPITAL_KNOWLEDGE = {
  hospitalInfo: {
    name: "Apollo Multispecialty Hospital",
    location: "Sector 26, Delhi NCR",
    established: "1995",
    beds: 500,
    accreditation: "NABH & JCI Accredited",
    emergency: "24/7 Available",
    contactNumber: "1860-500-1066",
    email: "info@apollohospital.com",
  },

  departments: [
    {
      name: "Cardiology",
      hindiName: "हृदय रोग विभाग",
      description: "Heart diseases, bypass surgery, angioplasty",
      services: ["ECG", "2D Echo", "Angiography", "Bypass Surgery", "Pacemaker"],
      floorNumber: 3,
      opd: "Mon-Sat: 9 AM - 5 PM",
    },
    {
      name: "Neurology",
      hindiName: "मस्तिष्क रोग विभाग",
      description: "Brain & nervous system disorders",
      services: ["MRI", "CT Scan", "EEG", "Stroke Treatment", "Epilepsy Care"],
      floorNumber: 4,
      opd: "Mon-Sat: 9 AM - 5 PM",
    },
    {
      name: "Orthopedics",
      hindiName: "हड्डी रोग विभाग",
      description: "Bone, joint and muscle problems",
      services: [
        "Joint Replacement",
        "Fracture Treatment",
        "Arthroscopy",
        "Spine Surgery",
      ],
      floorNumber: 2,
      opd: "Mon-Sat: 10 AM - 6 PM",
    },
    {
      name: "Pediatrics",
      hindiName: "बाल रोग विभाग",
      description: "Child healthcare up to 18 years",
      services: ["Vaccination", "Growth Monitoring", "NICU", "Child Surgery"],
      floorNumber: 1,
      opd: "Mon-Sat: 8 AM - 6 PM, Sun: 9 AM - 1 PM",
    },
    {
      name: "Gynecology & Obstetrics",
      hindiName: "प्रसूति एवं स्त्री रोग",
      description: "Women's health, pregnancy & delivery",
      services: [
        "Normal Delivery",
        "C-Section",
        "High-Risk Pregnancy",
        "IVF",
        "Gynec Surgery",
      ],
      floorNumber: 5,
      opd: "Mon-Sat: 9 AM - 5 PM",
    },
    {
      name: "Gastroenterology",
      hindiName: "पाचन तंत्र विभाग",
      description: "Stomach, liver, intestine problems",
      services: [
        "Endoscopy",
        "Colonoscopy",
        "Liver Treatment",
        "Gastric Surgery",
      ],
      floorNumber: 3,
      opd: "Mon-Fri: 10 AM - 4 PM",
    },
    {
      name: "Pulmonology",
      hindiName: "फेफड़ों के रोग विभाग",
      description: "Lung & respiratory diseases",
      services: [
        "Asthma Treatment",
        "TB Care",
        "Sleep Study",
        "Bronchoscopy",
      ],
      floorNumber: 4,
      opd: "Mon-Sat: 9 AM - 5 PM",
    },
    {
      name: "Nephrology",
      hindiName: "गुर्दे रोग विभाग",
      description: "Kidney diseases & dialysis",
      services: ["Dialysis", "Kidney Transplant", "Stone Treatment"],
      floorNumber: 2,
      opd: "Mon-Sat: 9 AM - 5 PM",
    },
    {
      name: "Oncology",
      hindiName: "कैंसर विभाग",
      description: "Cancer diagnosis and treatment",
      services: [
        "Chemotherapy",
        "Radiation Therapy",
        "Cancer Surgery",
        "Immunotherapy",
      ],
      floorNumber: 6,
      opd: "Mon-Fri: 10 AM - 4 PM",
    },
    {
      name: "Emergency & Trauma",
      hindiName: "आपातकालीन विभाग",
      description: "24/7 Emergency services",
      services: [
        "Accident Care",
        "Trauma Surgery",
        "Critical Care",
        "Ambulance Service",
      ],
      floorNumber: "Ground Floor",
      opd: "24/7",
    },
  ],

  doctors: [
    {
      name: "Dr. Rajesh Kumar",
      specialization: "Cardiologist",
      experience: "25 years",
      qualifications: "MBBS, MD, DM (Cardiology)",
      languages: ["Hindi", "English"],
      consultationFee: 1500,
      timings: "Mon, Wed, Fri: 10 AM - 2 PM",
      nextAvailableSlot: "Tomorrow 11 AM",
    },
    {
      name: "Dr. Priya Sharma",
      specialization: "Gynecologist",
      experience: "18 years",
      qualifications: "MBBS, MS (OBG)",
      languages: ["Hindi", "English"],
      consultationFee: 1200,
      timings: "Mon-Sat: 9 AM - 5 PM",
      nextAvailableSlot: "Today 3 PM",
    },
    {
      name: "Dr. Amit Patel",
      specialization: "Orthopedic Surgeon",
      experience: "20 years",
      qualifications: "MBBS, MS (Ortho)",
      languages: ["Hindi", "English", "Gujarati"],
      consultationFee: 1000,
      timings: "Tue, Thu, Sat: 11 AM - 5 PM",
      nextAvailableSlot: "Today 4 PM",
    },
    {
      name: "Dr. Sneha Reddy",
      specialization: "Pediatrician",
      experience: "15 years",
      qualifications: "MBBS, MD (Pediatrics)",
      languages: ["Hindi", "English", "Telugu"],
      consultationFee: 800,
      timings: "Mon-Sat: 8 AM - 2 PM",
      nextAvailableSlot: "Tomorrow 9 AM",
    },
    {
      name: "Dr. Vikram Singh",
      specialization: "Neurologist",
      experience: "22 years",
      qualifications: "MBBS, MD, DM (Neurology)",
      languages: ["Hindi", "English"],
      consultationFee: 1500,
      timings: "Mon, Wed, Fri: 2 PM - 6 PM",
      nextAvailableSlot: "Tomorrow 3 PM",
    },
    {
      name: "Dr. Anjali Gupta",
      specialization: "Dermatologist",
      experience: "12 years",
      qualifications: "MBBS, MD (Dermatology)",
      languages: ["Hindi", "English"],
      consultationFee: 900,
      timings: "Tue, Thu, Sat: 10 AM - 4 PM",
      nextAvailableSlot: "Today 2 PM",
    },
    {
      name: "Dr. Suresh Menon",
      specialization: "Gastroenterologist",
      experience: "19 years",
      qualifications: "MBBS, MD, DM (Gastro)",
      languages: ["Hindi", "English", "Malayalam"],
      consultationFee: 1300,
      timings: "Mon-Fri: 11 AM - 3 PM",
      nextAvailableSlot: "Tomorrow 12 PM",
    },
    {
      name: "Dr. Kavita Desai",
      specialization: "Oncologist",
      experience: "16 years",
      qualifications: "MBBS, MD (Oncology)",
      languages: ["Hindi", "English"],
      consultationFee: 1800,
      timings: "Mon, Wed, Fri: 10 AM - 2 PM",
      nextAvailableSlot: "Day after tomorrow 11 AM",
    },
  ],

  facilities: [
    {
      name: "ICU (Intensive Care Unit)",
      hindiName: "गहन चिकित्सा कक्ष",
      beds: 50,
      pricePerDay: 5000,
      features: [
        "24/7 Monitoring",
        "Ventilator Support",
        "Specialist Doctors",
      ],
    },
    {
      name: "General Ward",
      hindiName: "सामान्य वार्ड",
      beds: 200,
      pricePerDay: 1500,
      features: ["AC Rooms", "Nursing Care", "TV"],
    },
    {
      name: "Private Rooms",
      hindiName: "निजी कमरे",
      beds: 150,
      pricePerDay: 3000,
      features: ["AC", "Attached Bathroom", "TV", "Sofa for Attendant"],
    },
    {
      name: "Deluxe Rooms",
      hindiName: "डीलक्स कमरे",
      beds: 80,
      pricePerDay: 5000,
      features: ["Premium AC", "Mini Fridge", "Sofa Bed", "Premium Meals"],
    },
    {
      name: "NICU (Neonatal ICU)",
      hindiName: "नवजात गहन चिकित्सा कक्ष",
      beds: 20,
      pricePerDay: 7000,
      features: ["Incubators", "24/7 Pediatrician", "Advanced Monitoring"],
    },
  ],

  services: [
    {
      name: "Pharmacy",
      hindiName: "दवाखाना",
      timing: "24/7",
      location: "Ground Floor",
      description: "All medicines available, Home delivery also",
    },
    {
      name: "Diagnostic Lab",
      hindiName: "जांच केंद्र",
      timing: "24/7",
      location: "Ground Floor",
      description:
        "Blood test, X-Ray, CT, MRI, Ultrasound - Same day reports",
      services: [
        "Blood Tests (CBC, Sugar, Thyroid)",
        "X-Ray",
        "CT Scan",
        "MRI",
        "Ultrasound",
        "ECG",
      ],
    },
    {
      name: "Ambulance Service",
      hindiName: "एम्बुलेंस सेवा",
      timing: "24/7",
      contactNumber: "1860-500-1066",
      description: "Advanced & Basic Life Support ambulances",
      charges: "₹1000-3000 depending on distance",
    },
    {
      name: "Blood Bank",
      hindiName: "रक्त बैंक",
      timing: "24/7",
      location: "Basement",
      description: "All blood groups available",
    },
    {
      name: "Cafeteria",
      hindiName: "कैंटीन",
      timing: "6 AM - 10 PM",
      location: "Ground Floor",
      description: "Hygienic food for patients and visitors",
    },
    {
      name: "ATM",
      timing: "24/7",
      location: "Ground Floor",
    },
  ],

  policies: {
    visitingHours: {
      general: "11 AM - 1 PM, 5 PM - 7 PM",
      icu: "30 minutes twice a day (11 AM, 5 PM)",
      nicu: "Only parents, 30 minutes twice a day",
    },
    admission: {
      process:
        "1. Doctor consultation, 2. Admission form, 3. Advance payment, 4. Room allotment",
      documentsRequired: [
        "Aadhar Card",
        "Insurance card (if applicable)",
        "Previous medical records",
      ],
      advancePayment: "₹10,000 minimum for general ward",
    },
    insurance: {
      accepted: [
        "Cashless: Star Health, ICICI Lombard, HDFC Ergo, New India",
        "Reimbursement: All major insurances",
      ],
      process: "Bring insurance card, We handle approval",
    },
    emergencyProtocol:
      "No waiting, Immediate treatment, Payment later for critical cases",
  },

  medicalGuidance: {
    symptoms: {
      chestPain: {
        hindi: "सीने में दर्द",
        urgency: "HIGH - तुरंत Emergency में जाएं",
        advice:
          "यह heart attack हो सकता है। तुरंत emergency room में जाएं। एस्प्रिन लें अगर डॉक्टर ने पहले बताया हो।",
        department: "Cardiology / Emergency",
      },
      fever: {
        hindi: "बुखार",
        urgency: "MEDIUM",
        advice:
          "3 दिन से ज्यादा बुखार हो तो डॉक्टर से मिलें। Paracetamol ले सकते हैं। पानी ज्यादा पीएं।",
        department: "General Physician",
      },
      headache: {
        hindi: "सिरदर्द",
        urgency: "MEDIUM",
        advice:
          "अगर sudden severe headache हो, उल्टी के साथ या vision problem हो तो तुरंत emergency जाएं। Normal headache के लिए आराम करें।",
        department: "Neurology (if severe)",
      },
      stomachAche: {
        hindi: "पेट दर्द",
        urgency: "MEDIUM",
        advice:
          "Severe pain with vomiting तो emergency। Normal pain में हल्का खाना खाएं, पानी पीएं।",
        department: "Gastroenterology",
      },
      breathingProblem: {
        hindi: "सांस लेने में परेशानी",
        urgency: "HIGH - तुरंत Emergency",
        advice:
          "यह serious हो सकता है। तुरंत emergency जाएं। Asthma patients अपना inhaler use करें।",
        department: "Pulmonology / Emergency",
      },
      cough: {
        hindi: "खांसी",
        urgency: "LOW",
        advice:
          "2 हफ्ते से ज्यादा खांसी या blood आए तो doctor से मिलें। Warm water पीएं।",
        department: "Pulmonology",
      },
      diabetes: {
        hindi: "डायबिटीज लक्षण",
        urgency: "MEDIUM",
        advice:
          "बार-बार पेशाब, प्यास लगना, वजन कम होना - ये diabetes के signs हैं। Blood sugar test करवाएं।",
        department: "Endocrinology / General Physician",
      },
      injury: {
        hindi: "चोट",
        urgency: "MEDIUM to HIGH",
        advice:
          "Fracture suspect हो या bleeding ज्यादा हो तो emergency। Minor cuts को clean करें और bandage लगाएं।",
        department: "Orthopedics / Emergency",
      },
    },

    commonQuestions: {
      covidTest: {
        question: "COVID test kaise karwayein?",
        answer:
          "Ground floor diagnostic lab में जाएं। RT-PCR ₹500, Rapid Antigen ₹300। Report 6-24 घंटे में।",
      },
      vaccinations: {
        question: "Vaccination available hai?",
        answer:
          "Haan, Pediatrics department में child vaccinations। Adults के लिए COVID, Flu shots available। Prior appointment लें।",
      },
      healthCheckup: {
        question: "Full body checkup package?",
        answer:
          "Basic package ₹2500 (Blood tests, X-ray, ECG)। Comprehensive package ₹5000 (includes CT scan, consultations)। Monday-Saturday 8 AM-12 PM.",
      },
      reportTiming: {
        question: "Reports kab milenge?",
        answer:
          "Blood test: Same day। X-ray: 2 hours। CT/MRI: Next day। Emergency cases में faster।",
      },
    },
  },

  bookingProcess: {
    appointment: {
      steps: [
        "1. Call 1860-500-1066 या website पर जाएं",
        "2. Department और doctor choose करें",
        "3. Available slots में से select करें",
        "4. Patient details भरें",
        "5. Confirmation SMS आएगा",
      ],
      cancellation:
        "24 घंटे पहले cancel करें तो full refund। Otherwise 50% charges।",
      onlineBooking: "www.apollohospital.com/book-appointment",
    },
    bedBooking: {
      steps: [
        "1. Doctor consultation जरूरी है पहले",
        "2. Admission form भरें reception पर",
        "3. Advance payment करें (₹10,000 minimum)",
        "4. Room allotment होगा availability के हिसाब से",
      ],
    },
  },

  emergencyNumbers: {
    mainReception: "1860-500-1066",
    ambulance: "1860-500-1066 (Press 1)",
    emergency: "1860-500-1066 (Press 2)",
    pharmacy: "1860-500-1067",
    diagnostics: "1860-500-1068",
  },

  covidProtocol: {
    visitorPolicy: "Maximum 1 visitor per patient",
    maskMandatory: "Yes, for everyone",
    sanitization: "Regular sanitization, sanitizers at all entry points",
    testingFacility: "RT-PCR and Rapid Antigen available 24/7",
  },
};
