const { askLLM } = require('./llmService');
const hospitalConfig = require('../config/hospital.config.json');

// Response cache for instant repeat queries
const responseCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Resolve user query using rule-based logic + LLM fallback
 * @param {string} userText - User's spoken text
 * @param {string} lang - Language code (hi or en)
 * @returns {Promise<string>} - Response text
 */
async function resolveUserQuery(userText, lang = 'en') {
  const text = userText.toLowerCase();
  const cacheKey = `${text}_${lang}`;

  // Check cache first (instant response for repeat queries)
  if (responseCache.has(cacheKey)) {
    console.log('\n⚡ Using cached response (instant)');
    return responseCache.get(cacheKey);
  }

  console.log('\n🧠 Resolving user query...');
  console.log('Input:', userText);
  console.log('Language:', lang);

  let response;

  // 🚑 CRITICAL: Emergency detection (highest priority)
  if (isEmergency(text)) {
    console.log('→ Emergency detected! Providing emergency info...');
    response = hospitalConfig.voiceAssistant.emergencyMessage[lang];
    responseCache.set(cacheKey, response);
    return response;
  }

  // ⚡ Fast rule-based responses for common queries
  const quickResponse = getQuickResponse(text, lang);
  if (quickResponse) {
    console.log('→ Quick response matched');
    responseCache.set(cacheKey, quickResponse);
    return quickResponse;
  }

  // 🧠 Complex queries → LLM
  console.log('→ Using LLM for complex query...');
  try {
    const llmResponse = await askLLM(userText, hospitalConfig, lang);
    console.log('→ LLM response received:', llmResponse);
    
    // Cache LLM response
    responseCache.set(cacheKey, llmResponse);
    setTimeout(() => responseCache.delete(cacheKey), CACHE_TTL);
    
    return llmResponse;
  } catch (error) {
    console.error('→ LLM error in aiResolver:', error.message);
    throw error;
  }
}

/**
 * Detect emergency keywords
 */
function isEmergency(text) {
  const emergencyKeywords = [
    'emergency', 'urgent', 'ambulance', 'help', 'critical',
    'accident', 'heart attack', 'unconscious', 'bleeding',
    'aapatkaal', 'zarurat', 'ambulans', 'madad', 'emergency',
    'बीमार', 'गंभीर', 'दुर्घटना'
  ];

  return emergencyKeywords.some(keyword => text.includes(keyword));
}

/**
 * Get quick rule-based responses for common queries
 */
function getQuickResponse(text, lang) {
  const responses = {
    // OPD / Outpatient Department
    opd: {
      en: `OPD is open from ${hospitalConfig.availability.opd.hours}, ${hospitalConfig.availability.opd.days}. How can I help you book an appointment?`,
      hi: `ओपीडी ${hospitalConfig.availability.opd.hours} तक खुली रहती है, ${hospitalConfig.availability.opd.days}। क्या मैं अपॉइंटमेंट बुक करने में मदद कर सकती हूँ?`
    },

    // ICU
    icu: {
      en: `Our ICU has ${hospitalConfig.capacity.departments.icu} beds with 24x7 monitoring and ${hospitalConfig.capacity.ventilators} ventilators available.`,
      hi: `हमारे आईसीयू में ${hospitalConfig.capacity.departments.icu} बेड हैं, 24x7 निगरानी और ${hospitalConfig.capacity.ventilators} वेंटिलेटर उपलब्ध हैं।`
    },

    // Visiting hours
    visiting: {
      en: `Visiting hours are ${hospitalConfig.availability.visitingHours.morning} (morning) and ${hospitalConfig.availability.visitingHours.evening} (evening).`,
      hi: `मिलने का समय सुबह ${hospitalConfig.availability.visitingHours.morning} और शाम ${hospitalConfig.availability.visitingHours.evening} है।`
    },

    // Pharmacy
    pharmacy: {
      en: `Our pharmacy is open ${hospitalConfig.availability.pharmacy} on the ${hospitalConfig.floors.ground.join(', ')}.`,
      hi: `हमारी फार्मेसी ${hospitalConfig.availability.pharmacy} खुली रहती है, ${hospitalConfig.floors.ground.join(', ')} पर।`
    },

    // Ambulance
    ambulance: {
      en: `Ambulance service is available ${hospitalConfig.availability.ambulance}. Please call ${hospitalConfig.hospital.contact.emergency} for immediate assistance.`,
      hi: `एम्बुलेंस सेवा ${hospitalConfig.availability.ambulance} उपलब्ध है। कृपया तुरंत सहायता के लिए ${hospitalConfig.hospital.contact.emergency} पर कॉल करें।`
    },

    // Beds availability
    beds: {
      en: `We have ${hospitalConfig.capacity.totalBeds} total beds including ICU, general ward, maternity, and private rooms.`,
      hi: `हमारे पास ${hospitalConfig.capacity.totalBeds} कुल बेड हैं जिनमें आईसीयू, सामान्य वार्ड, मातृत्व और निजी कमरे शामिल हैं।`
    },

    // Location
    location: {
      en: `We are located at ${hospitalConfig.hospital.location.address}. ${hospitalConfig.hospital.location.city}, ${hospitalConfig.hospital.location.state}.`,
      hi: `हम ${hospitalConfig.hospital.location.address} पर स्थित हैं। ${hospitalConfig.hospital.location.city}, ${hospitalConfig.hospital.location.state}।`
    },

    // Contact
    contact: {
      en: `You can reach us at ${hospitalConfig.hospital.contact.phone}. For emergencies, call ${hospitalConfig.hospital.contact.emergency}.`,
      hi: `आप हमें ${hospitalConfig.hospital.contact.phone} पर संपर्क कर सकते हैं। आपातकाल के लिए ${hospitalConfig.hospital.contact.emergency} पर कॉल करें।`
    },

    // Departments
    departments: {
      en: `We have ${hospitalConfig.departments.length} departments including ${hospitalConfig.departments.slice(0, 5).join(', ')}, and more.`,
      hi: `हमारे पास ${hospitalConfig.departments.length} विभाग हैं जिनमें ${hospitalConfig.departments.slice(0, 5).join(', ')} और अन्य शामिल हैं।`
    }
  };

  // Match keywords to responses
  if (text.includes('opd') || text.includes('outpatient')) {
    return responses.opd[lang];
  }

  if (text.includes('icu') || text.includes('intensive care')) {
    return responses.icu[lang];
  }

  if (text.includes('visit') || text.includes('milne')) {
    return responses.visiting[lang];
  }

  if (text.includes('pharmacy') || text.includes('medicine') || text.includes('दवा')) {
    return responses.pharmacy[lang];
  }

  if (text.includes('ambulance') || text.includes('ambulans')) {
    return responses.ambulance[lang];
  }

  if (text.includes('bed') || text.includes('बेड')) {
    return responses.beds[lang];
  }

  if (text.includes('location') || text.includes('address') || text.includes('कहाँ')) {
    return responses.location[lang];
  }

  if (text.includes('contact') || text.includes('phone') || text.includes('number')) {
    return responses.contact[lang];
  }

  if (text.includes('department') || text.includes('विभाग')) {
    return responses.departments[lang];
  }

  // No quick match found
  return null;
}

/**
 * Check if query is after OPD hours
 */
function isAfterOpdHours() {
  const now = new Date();
  const hours = now.getHours();

  // OPD hours: 9 AM (9) to 8 PM (20)
  return hours < 9 || hours >= 20;
}

/**
 * Pre-warm cache with common queries for instant responses
 */
function prewarmCache() {
  const commonQueries = [
    { text: 'opd hours', lang: 'en' },
    { text: 'visiting hours', lang: 'en' },
    { text: 'emergency', lang: 'en' },
    { text: 'pharmacy', lang: 'en' },
    { text: 'icu', lang: 'en' },
    { text: 'location', lang: 'en' },
    { text: 'contact', lang: 'en' },
    { text: 'departments', lang: 'en' },
    { text: 'beds', lang: 'en' },
    { text: 'ambulance', lang: 'en' },
    // Hindi queries
    { text: 'ओपीडी', lang: 'hi' },
    { text: 'एम्बुलेंस', lang: 'hi' },
    { text: 'फार्मेसी', lang: 'hi' },
  ];
  
  let prewarmedCount = 0;
  commonQueries.forEach(({ text, lang }) => {
    const response = getQuickResponse(text.toLowerCase(), lang);
    if (response) {
      const cacheKey = `${text.toLowerCase()}_${lang}`;
      responseCache.set(cacheKey, response);
      prewarmedCount++;
    }
  });
  
  // Also cache emergency messages
  responseCache.set('emergency_en', hospitalConfig.voiceAssistant.emergencyMessage.en);
  responseCache.set('emergency_hi', hospitalConfig.voiceAssistant.emergencyMessage.hi);
  prewarmedCount += 2;
  
  console.log(`✅ Pre-warmed cache with ${prewarmedCount} common responses`);
}

// Pre-warm cache on module load
prewarmCache();

module.exports = {
  resolveUserQuery,
  isEmergency,
  isAfterOpdHours,
  prewarmCache
};
