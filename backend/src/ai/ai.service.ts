import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import FormData from "form-data";
import * as fs from "fs";
import Groq from "groq-sdk";
import { BedsService } from "../beds/beds.service";
import { DoctorsService } from "../doctors/doctors.service";
import { HOSPITAL_KNOWLEDGE } from "./hospital-knowledge";

@Injectable()
export class AiService {
  private groq: Groq;
  private whisperUrl: string;
  private ttsUrl: string;
  private vectorServiceUrl: string;

  constructor(
    private configService: ConfigService,
    private bedsService: BedsService,
    private doctorsService: DoctorsService
  ) {
    this.groq = new Groq({
      apiKey: this.configService.get<string>("GROQ_API_KEY"),
    });
    this.whisperUrl = this.configService.get<string>("WHISPER_SERVICE_URL");
    this.ttsUrl = this.configService.get<string>("TTS_SERVICE_URL");
    this.vectorServiceUrl =
      this.configService.get<string>("VECTOR_SERVICE_URL") ||
      "http://localhost:5003";
  }

  /**
   * Convert speech to text using Whisper
   */
  async speechToText(audioPath: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("audio", fs.createReadStream(audioPath));
      formData.append("language", "hi");

      const response = await axios.post(
        `${this.whisperUrl}/transcribe`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 30000,
        }
      );

      return response.data.text;
    } catch (error) {
      throw new HttpException(
        `Speech-to-Text error: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Convert text to speech using Coqui TTS
   */
  async textToSpeech(text: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.ttsUrl}/synthesize`,
        { text, language: "hi" },
        {
          responseType: "stream",
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error) {
      throw new HttpException(
        `Text-to-Speech error: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search vector database for relevant context
   */
  private async searchVectorDB(
    query: string,
    n_results = 5
  ): Promise<string[]> {
    try {
      const response = await axios.post(
        `${this.vectorServiceUrl}/search`,
        {
          query,
          n_results,
        },
        {
          timeout: 10000,
        }
      );

      if (response.data.success) {
        console.log(
          `🔍 Vector search found ${response.data.count} results for: "${query}"`
        );
        return response.data.results || [];
      }

      return [];
    } catch (error) {
      console.warn(
        `⚠️ Vector search unavailable, falling back to static knowledge: ${error.message}`
      );
      return [];
    }
  }

  /**
   * Process user query with AI and database
   */
  async processQuery(query: string): Promise<string> {
    // 1. Detect language (Hindi or English)
    const isHindi = this.detectHindi(query);
    const language = isHindi ? "Hindi" : "English";

    // 2. Check if query needs real-time database data
    const needsDatabase = this.needsDatabaseQuery(query);

    let realTimeData = "";
    if (needsDatabase) {
      // Fetch real-time data from database
      const [beds, doctors] = await Promise.all([
        this.bedsService.getStats(),
        this.doctorsService.getStats(),
      ]);
      realTimeData = `
      REAL-TIME DATA (Current Status):
      - Available Beds: ICU=${beds.icu}, General=${beds.general}, Total=${beds.total}
      - Doctors Available Right Now: ${doctors.available}
      `;
    }

    // 3. NEW: Search vector database for relevant context
    const vectorResults = await this.searchVectorDB(query, 7);
    const vectorContext = vectorResults.length > 0
      ? vectorResults.join("\n")
      : this.buildKnowledgeContext(query); // Fallback to static knowledge

    // 4. Identify if medical symptom query
    const medicalAdvice = this.getMedicalAdvice(query);

    // 5. Create comprehensive system prompt
    const systemPrompt = `You are Apollo Hospital's AI Assistant. You are helpful, knowledgeable, and professional.

CRITICAL INSTRUCTIONS:
- Respond in ${language} (${isHindi ? "Hindi/Hinglish" : "English"})
- Be natural and conversational like a hospital receptionist
- Keep responses concise but informative (50-80 words)
- For emergencies, clearly state "तुरंत Emergency में आएं" or "Go to Emergency immediately"
- Always provide specific details like floor numbers, timings, prices when relevant

RELEVANT HOSPITAL INFORMATION (from semantic search):
${vectorContext}

${realTimeData}

${medicalAdvice ? `MEDICAL GUIDANCE FOR USER'S SYMPTOM:\n${medicalAdvice}\n` : ""}

EMERGENCY CONTACT: 1860-500-1066

RESPONSE GUIDELINES:
- If asking about symptoms: Provide medical guidance, urgency level, and which department to visit
- If asking about doctors: Give doctor names, timings, fees, specialization
- If asking about facilities: Provide floor number, timings, services available
- If asking about booking: Explain step-by-step process
- If asking current availability: Use REAL-TIME DATA above
- Always be empathetic and helpful
`;

    // 6. Call Groq AI with comprehensive context
    const completion = await this.groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        { role: "user", content: query },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 300,
    });

    return (
      completion.choices[0].message.content ||
      (isHindi
        ? "क्षमा करें, मैं आपकी मदद नहीं कर सका। कृपया reception से संपर्क करें: 1860-500-1066"
        : "Sorry, I couldn't help. Please contact reception: 1860-500-1066")
    );
  }

  /**
   * Detect if query is in Hindi
   */
  private detectHindi(query: string): boolean {
    // Check for Devanagari script
    const hindiPattern = /[\u0900-\u097F]/;
    const hindiWords = [
      "hai",
      "kya",
      "kaise",
      "kab",
      "kitne",
      "mein",
      "ke",
      "ki",
    ];

    return (
      hindiPattern.test(query) ||
      hindiWords.some((word) => query.toLowerCase().includes(word))
    );
  }

  /**
   * Check if query needs real-time database data
   */
  private needsDatabaseQuery(query: string): boolean {
    const databaseKeywords = [
      "available",
      "abhi",
      "currently",
      "right now",
      "kitne bed",
      "bed available",
      "doctor available",
      "free",
      "खाली",
      "उपलब्ध",
      "अभी",
    ];

    return databaseKeywords.some((keyword) =>
      query.toLowerCase().includes(keyword)
    );
  }

  /**
   * Build relevant knowledge context based on query
   */
  private buildKnowledgeContext(query: string): string {
    const lowerQuery = query.toLowerCase();
    let context = "";

    // Department information
    if (
      lowerQuery.includes("department") ||
      lowerQuery.includes("विभाग") ||
      lowerQuery.includes("doctor") ||
      lowerQuery.includes("specialist")
    ) {
      context += `\nDEPARTMENTS:\n${JSON.stringify(HOSPITAL_KNOWLEDGE.departments, null, 2)}\n`;
      context += `\nDOCTORS:\n${JSON.stringify(HOSPITAL_KNOWLEDGE.doctors, null, 2)}\n`;
    }

    // Facility information
    if (
      lowerQuery.includes("bed") ||
      lowerQuery.includes("room") ||
      lowerQuery.includes("ward") ||
      lowerQuery.includes("icu") ||
      lowerQuery.includes("कमरा")
    ) {
      context += `\nFACILITIES & BEDS:\n${JSON.stringify(HOSPITAL_KNOWLEDGE.facilities, null, 2)}\n`;
    }

    // Services
    if (
      lowerQuery.includes("service") ||
      lowerQuery.includes("pharmacy") ||
      lowerQuery.includes("lab") ||
      lowerQuery.includes("ambulance") ||
      lowerQuery.includes("test") ||
      lowerQuery.includes("जांच")
    ) {
      context += `\nSERVICES:\n${JSON.stringify(HOSPITAL_KNOWLEDGE.services, null, 2)}\n`;
    }

    // Booking process
    if (
      lowerQuery.includes("book") ||
      lowerQuery.includes("appointment") ||
      lowerQuery.includes("admission") ||
      lowerQuery.includes("कैसे")
    ) {
      context += `\nBOOKING PROCESS:\n${JSON.stringify(HOSPITAL_KNOWLEDGE.bookingProcess, null, 2)}\n`;
    }

    // Policies
    if (
      lowerQuery.includes("visit") ||
      lowerQuery.includes("timing") ||
      lowerQuery.includes("insurance") ||
      lowerQuery.includes("policy")
    ) {
      context += `\nPOLICIES:\n${JSON.stringify(HOSPITAL_KNOWLEDGE.policies, null, 2)}\n`;
    }

    // If no specific match, provide general overview
    if (!context) {
      context = `
      DEPARTMENTS: ${HOSPITAL_KNOWLEDGE.departments.map((d) => d.name).join(", ")}
      SERVICES: Pharmacy, Lab, Ambulance, Blood Bank (all 24/7)
      EMERGENCY: 24/7 Available
      `;
    }

    return context;
  }

  /**
   * Get medical advice for symptoms
   */
  private getMedicalAdvice(query: string): string {
    const lowerQuery = query.toLowerCase();
    const symptoms = HOSPITAL_KNOWLEDGE.medicalGuidance.symptoms;

    // Check for chest pain / heart issues
    if (
      lowerQuery.includes("chest") ||
      lowerQuery.includes("सीने") ||
      lowerQuery.includes("दिल") ||
      lowerQuery.includes("heart")
    ) {
      return JSON.stringify(symptoms.chestPain, null, 2);
    }

    // Fever
    if (
      lowerQuery.includes("fever") ||
      lowerQuery.includes("बुखार") ||
      lowerQuery.includes("temperature")
    ) {
      return JSON.stringify(symptoms.fever, null, 2);
    }

    // Headache
    if (
      lowerQuery.includes("headache") ||
      lowerQuery.includes("सिरदर्द") ||
      lowerQuery.includes("head pain")
    ) {
      return JSON.stringify(symptoms.headache, null, 2);
    }

    // Stomach pain
    if (
      lowerQuery.includes("stomach") ||
      lowerQuery.includes("पेट") ||
      lowerQuery.includes("pet dard")
    ) {
      return JSON.stringify(symptoms.stomachAche, null, 2);
    }

    // Breathing problem
    if (
      lowerQuery.includes("breath") ||
      lowerQuery.includes("सांस") ||
      lowerQuery.includes("sans") ||
      lowerQuery.includes("breathing")
    ) {
      return JSON.stringify(symptoms.breathingProblem, null, 2);
    }

    // Cough
    if (
      lowerQuery.includes("cough") ||
      lowerQuery.includes("खांसी") ||
      lowerQuery.includes("khansi")
    ) {
      return JSON.stringify(symptoms.cough, null, 2);
    }

    // Injury
    if (
      lowerQuery.includes("injury") ||
      lowerQuery.includes("चोट") ||
      lowerQuery.includes("accident") ||
      lowerQuery.includes("fracture")
    ) {
      return JSON.stringify(symptoms.injury, null, 2);
    }

    return "";
  }

}
