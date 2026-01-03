import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import FormData from "form-data";
import * as fs from "fs";
import * as path from "path";
import Groq from "groq-sdk";
import { BedsService } from "../beds/beds.service";
import { DoctorsService } from "../doctors/doctors.service";
import { AppointmentsService } from "../appointments/appointments.service";
import { VectorStoreService } from "./vector-store.service";
import { HOSPITAL_KNOWLEDGE } from "./hospital-knowledge";

// Booking session interface
interface BookingSession {
  sessionId: string;
  state:
    | "collecting_info"
    | "checking_availability"
    | "suggesting_alternatives"
    | "confirming"
    | "completed";
  bookingInitiated: boolean;
  lastAskedField?: string;
  patientName?: string;
  patientAge?: number;
  patientPhone?: string;
  appointmentDate?: Date;
  appointmentTime?: string;
  doctorId?: number;
  department?: string;
  problem?: string;
  conversationHistory: Array<{ role: string; content: string }>;
  lastUpdated: Date;
  preferredLanguage?: "en" | "hi"; // Track user's preferred language
}

@Injectable()
export class AiService {
  private groq: Groq;
  private whisperUrl: string;
  private ttsUrl: string;
  private vectorServiceUrl: string;
  private bookingSessions: Map<string, BookingSession> = new Map();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  // In-memory storage
  private doctorsData: any[] = [];
  private appointments: Map<number, any> = new Map();
  private nextAppointmentId: number = 1;

  constructor(
    private configService: ConfigService,
    private bedsService: BedsService,
    private doctorsService: DoctorsService,
    private appointmentsService: AppointmentsService,
    private vectorStoreService: VectorStoreService
  ) {
    this.groq = new Groq({
      apiKey: this.configService.get<string>("GROQ_API_KEY"),
    });
    this.whisperUrl = this.configService.get<string>("WHISPER_SERVICE_URL");
    this.ttsUrl = this.configService.get<string>("TTS_SERVICE_URL");
    this.vectorServiceUrl =
      this.configService.get<string>("VECTOR_SERVICE_URL") ||
      "http://localhost:5003";

    // Load doctors from static JSON file
    this.loadDoctorsData();
  }

  /**
   * Load doctors data from static JSON file
   */
  private loadDoctorsData(): void {
    try {
      const doctorsFilePath = path.join(__dirname, "../data/doctors-data.json");
      const doctorsFileContent = fs.readFileSync(doctorsFilePath, "utf-8");
      const doctorsData = JSON.parse(doctorsFileContent);
      this.doctorsData = doctorsData.doctors || [];
      console.log(
        `✅ Loaded ${this.doctorsData.length} doctors from static data`
      );
    } catch (error) {
      console.error("❌ Error loading doctors data:", error);
      // Fallback to empty array if file doesn't exist
      this.doctorsData = [];
    }
  }

  /**
   * Get preferred language for a session
   */
  getPreferredLanguage(sessionId: string): "en" | "hi" | undefined {
    const session = this.bookingSessions.get(sessionId);
    return session?.preferredLanguage;
  }

  /**
   * Convert speech to text using Whisper
   * Returns both transcription and detected language
   */
  async speechToText(
    audioPath: string,
    preferredLanguage?: "en" | "hi"
  ): Promise<{ text: string; language: string }> {
    try {
      const formData = new FormData();
      formData.append("audio", fs.createReadStream(audioPath));

      // If we have a preferred language from session, use it for consistency
      if (preferredLanguage) {
        formData.append("language", preferredLanguage);
      }
      // Otherwise, let Whisper auto-detect

      const response = await axios.post(
        `${this.whisperUrl}/transcribe`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 30000,
        }
      );

      return {
        text: response.data.text,
        language: response.data.language,
      };
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
      // Use local vector store for semantic search
      const documents = await this.vectorStoreService.similaritySearch(
        query,
        n_results
      );

      if (documents.length > 0) {
        console.log(
          `🔍 Local vector search found ${documents.length} results for: "${query}"`
        );
        // Return just the content of each document
        return documents.map((doc) => doc.content);
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
   * Find doctor by ID (in-memory)
   */
  private findDoctorById(id: number): any {
    return this.doctorsData.find((d) => d.id === id) || null;
  }

  /**
   * Find doctor by name (in-memory)
   */
  private findDoctorByName(name: string): any {
    const cleanName = name.replace(/^(dr\.?\s*|doctor\s*)/i, "").trim();
    return (
      this.doctorsData.find((d) => {
        const doctorName = d.name.replace(/^(dr\.?\s*|doctor\s*)/i, "").trim();
        return (
          doctorName.toLowerCase().includes(cleanName.toLowerCase()) ||
          cleanName.toLowerCase().includes(doctorName.toLowerCase())
        );
      }) || null
    );
  }

  /**
   * Find doctors by specialization (in-memory)
   */
  private findBySpecialization(specialization: string): any[] {
    return this.doctorsData.filter(
      (d) => d.specialization === specialization && d.available === true
    );
  }

  /**
   * Suggest doctor by problem (in-memory)
   */
  private suggestDoctorByProblem(problem: string): {
    specialization: string;
    doctors: any[];
  } {
    const lowerProblem = problem.toLowerCase();
    const specializationMap: { [key: string]: string } = {
      chest: "Cardiologist",
      heart: "Cardiologist",
      दिल: "Cardiologist",
      सीने: "Cardiologist",
      head: "Neurologist",
      headache: "Neurologist",
      सिरदर्द: "Neurologist",
      brain: "Neurologist",
      bone: "Orthopedic",
      fracture: "Orthopedic",
      joint: "Orthopedic",
      child: "Pediatrician",
      baby: "Pediatrician",
      बच्चा: "Pediatrician",
      tooth: "Dentist",
      dental: "Dentist",
      दांत: "Dentist",
      ear: "ENT",
      nose: "ENT",
      throat: "ENT",
      skin: "Dermatologist",
      rash: "Dermatologist",
      त्वचा: "Dermatologist",
    };

    let suggestedSpecialization = "General Physician";

    for (const [keyword, specialization] of Object.entries(specializationMap)) {
      if (lowerProblem.includes(keyword)) {
        suggestedSpecialization = specialization;
        break;
      }
    }

    const doctors = this.findBySpecialization(suggestedSpecialization);

    return {
      specialization: suggestedSpecialization,
      doctors:
        doctors.length > 0
          ? doctors
          : this.doctorsData.filter((d) => d.available === true),
    };
  }

  /**
   * Check doctor availability (in-memory)
   */
  private checkDoctorAvailabilityInMemory(
    doctorId: number,
    date: Date,
    time: string
  ): { available: boolean; reason?: string } {
    const doctor = this.findDoctorById(doctorId);

    if (!doctor || !doctor.available) {
      return { available: false, reason: "Doctor is currently unavailable" };
    }

    // Check doctor's schedule
    const appointmentDate = new Date(date);
    const dayName = appointmentDate.toLocaleDateString("en-US", {
      weekday: "long",
    });
    const doctorSchedule = doctor.schedule || [];

    const daySchedule = doctorSchedule.find((s: any) => s.day === dayName);
    if (!daySchedule) {
      return { available: false, reason: "Doctor does not work on this day" };
    }

    // Check if time is within doctor's working hours
    const requestedTime = time.split(":").map(Number);
    const requestedMinutes = requestedTime[0] * 60 + (requestedTime[1] || 0);

    const [startHours, startMinutes] = daySchedule.startTime
      .split(":")
      .map(Number);
    const [endHours, endMinutes] = daySchedule.endTime.split(":").map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    if (
      requestedMinutes < startTotalMinutes ||
      requestedMinutes >= endTotalMinutes
    ) {
      return {
        available: false,
        reason: `Doctor is available from ${daySchedule.startTime} to ${daySchedule.endTime}`,
      };
    }

    // Check for existing appointments at same time (in-memory)
    const dateStr = date.toISOString().split("T")[0];
    for (const appointment of this.appointments.values()) {
      if (
        appointment.doctorId === doctorId &&
        appointment.appointmentDate === dateStr &&
        appointment.appointmentTime === time &&
        appointment.status === "Scheduled"
      ) {
        return { available: false, reason: "Time slot is already booked" };
      }
    }

    return { available: true };
  }

  /**
   * Find next available day for a doctor from a given date
   */
  private findNextAvailableDay(doctor: any, fromDate: Date): string | null {
    if (!doctor || !doctor.schedule || doctor.schedule.length === 0) {
      return null;
    }

    const dayOrder = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const workingDays = doctor.schedule.map((s: any) => s.day);

    // Start from tomorrow
    const searchDate = new Date(fromDate);
    searchDate.setDate(searchDate.getDate() + 1);

    // Search for next 14 days
    for (let i = 0; i < 14; i++) {
      const dayName = dayOrder[searchDate.getDay()];
      if (workingDays.includes(dayName)) {
        // Format date nicely
        const options: Intl.DateTimeFormatOptions = {
          weekday: "long",
          month: "long",
          day: "numeric",
        };
        return searchDate.toLocaleDateString("en-US", options);
      }
      searchDate.setDate(searchDate.getDate() + 1);
    }

    return null;
  }

  /**
   * Find alternative times for a doctor (in-memory)
   */
  private findAlternativeTimesInMemory(doctorId: number, date: Date): string[] {
    const doctor = this.findDoctorById(doctorId);
    if (!doctor || !doctor.schedule) {
      return [];
    }

    const appointmentDate = new Date(date);
    const dayName = appointmentDate.toLocaleDateString("en-US", {
      weekday: "long",
    });
    const daySchedule = doctor.schedule.find((s: any) => s.day === dayName);

    if (!daySchedule) {
      return [];
    }

    // Generate 30-minute time slots
    const [startHours, startMinutes] = daySchedule.startTime
      .split(":")
      .map(Number);
    const [endHours, endMinutes] = daySchedule.endTime.split(":").map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    const availableSlots: string[] = [];
    const dateStr = date.toISOString().split("T")[0];

    // Get existing appointments for this doctor and date
    const existingAppointments = Array.from(this.appointments.values()).filter(
      (apt: any) =>
        apt.doctorId === doctorId &&
        apt.appointmentDate === dateStr &&
        apt.status === "Scheduled"
    );

    const bookedTimes = new Set(
      existingAppointments.map((apt: any) => apt.appointmentTime)
    );

    // Generate slots
    for (
      let minutes = startTotalMinutes;
      minutes < endTotalMinutes;
      minutes += 30
    ) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const timeSlot = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`;

      if (!bookedTimes.has(timeSlot)) {
        availableSlots.push(timeSlot);
      }
    }

    return availableSlots.slice(0, 5);
  }

  /**
   * Find alternative doctors (in-memory)
   */
  private findAlternativeDoctorsInMemory(
    originalDoctorId: number,
    date: Date,
    time: string
  ): any[] {
    const originalDoctor = this.findDoctorById(originalDoctorId);
    if (!originalDoctor) {
      return [];
    }

    // Find other available doctors in same specialization
    const alternativeDoctors = this.findBySpecialization(
      originalDoctor.specialization
    );

    const availableAlternatives: any[] = [];

    for (const doctor of alternativeDoctors) {
      if (doctor.id === originalDoctorId) continue;

      const availability = this.checkDoctorAvailabilityInMemory(
        doctor.id,
        date,
        time
      );

      if (availability.available) {
        availableAlternatives.push({
          doctor,
          availableTime: time,
        });
      }
    }

    return availableAlternatives.slice(0, 3);
  }

  /**
   * Create appointment in memory
   */
  private createAppointmentInMemory(data: {
    patientName: string;
    patientAge?: number;
    patientPhone: string;
    doctorId: number;
    appointmentDate: string;
    appointmentTime: string;
    reason?: string;
    status?: string;
  }): any {
    const appointment = {
      id: this.nextAppointmentId++,
      ...data,
      status: data.status || "Scheduled",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.appointments.set(appointment.id, appointment);
    return appointment;
  }

  /**
   * Get or create booking session
   */
  private getBookingSession(sessionId: string): BookingSession {
    if (!this.bookingSessions.has(sessionId)) {
      this.bookingSessions.set(sessionId, {
        sessionId,
        state: "collecting_info",
        bookingInitiated: false,
        conversationHistory: [],
        lastUpdated: new Date(),
      });
    }
    return this.bookingSessions.get(sessionId)!;
  }

  /**
   * Clean up expired sessions
   */
  private cleanupSessions(): void {
    const now = new Date();
    for (const [sessionId, session] of this.bookingSessions.entries()) {
      if (
        now.getTime() - session.lastUpdated.getTime() >
        this.SESSION_TIMEOUT
      ) {
        this.bookingSessions.delete(sessionId);
      }
    }
  }

  /**
   * Reset/clear a booking session for a user
   */
  resetSession(sessionId: string): void {
    if (this.bookingSessions.has(sessionId)) {
      this.bookingSessions.delete(sessionId);
    }
  }

  /**
   * Format date in clear, unambiguous format: "Monday, January 5"
   */
  private formatDateClearly(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Detect booking intent from query
   */
  private isBookingIntent(query: string): boolean {
    const bookingKeywords = [
      "appointment",
      "book",
      "booking",
      "schedule",
      "appointment चाहिए",
      "appointment book",
      "बुक करना",
      "डॉक्टर मिलेगा",
      "consultation",
    ];
    return bookingKeywords.some((keyword) =>
      query.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * Extract department from query based on keywords
   */
  private extractDepartmentFromQuery(query: string): string | null {
    const lowerQuery = query.toLowerCase();
    const departmentMap: { [key: string]: string } = {
      dental: "Dentist",
      dentist: "Dentist",
      tooth: "Dentist",
      teeth: "Dentist",
      दांत: "Dentist",
      cardiology: "Cardiologist",
      cardiac: "Cardiologist",
      heart: "Cardiologist",
      chest: "Cardiologist",
      दिल: "Cardiologist",
      सीने: "Cardiologist",
      neurology: "Neurologist",
      neurological: "Neurologist",
      brain: "Neurologist",
      head: "Neurologist",
      headache: "Neurologist",
      सिरदर्द: "Neurologist",
      orthopedic: "Orthopedic",
      bone: "Orthopedic",
      fracture: "Orthopedic",
      joint: "Orthopedic",
      pediatric: "Pediatrician",
      pediatrician: "Pediatrician",
      child: "Pediatrician",
      baby: "Pediatrician",
      बच्चा: "Pediatrician",
      ent: "ENT",
      ear: "ENT",
      nose: "ENT",
      throat: "ENT",
      dermatology: "Dermatologist",
      dermatologist: "Dermatologist",
      skin: "Dermatologist",
      rash: "Dermatologist",
      त्वचा: "Dermatologist",
    };

    for (const [keyword, department] of Object.entries(departmentMap)) {
      if (lowerQuery.includes(keyword)) {
        return department;
      }
    }

    return null;
  }

  /**
   * Get next missing field to ask based on priority
   * Priority: doctor/department/problem → date → time → name → age → phone
   */
  private getNextMissingField(session: BookingSession): string | null {
    // Priority 1: Doctor/Department/Problem
    if (!session.doctorId && !session.department && !session.problem) {
      return "doctor/department/problem";
    }

    // Priority 2: Date
    if (!session.appointmentDate) {
      return "date";
    }

    // Priority 3: Time
    if (!session.appointmentTime) {
      return "time";
    }

    // Priority 4: Name
    if (!session.patientName) {
      return "name";
    }

    // Priority 5: Age
    if (!session.patientAge) {
      return "age";
    }

    // Priority 6: Phone
    if (!session.patientPhone) {
      return "phone";
    }

    return null;
  }

  /**
   * Format doctor schedule for display
   */
  private formatDoctorSchedule(doctor: any, isHindi: boolean = false): string {
    if (!doctor || !doctor.schedule || doctor.schedule.length === 0) {
      return isHindi
        ? `${doctor?.name || "डॉक्टर"} की schedule उपलब्ध नहीं है।`
        : `${doctor?.name || "Doctor"} schedule is not available.`;
    }

    // Group schedule by same time slots
    const scheduleMap = new Map<string, string[]>();

    for (const slot of doctor.schedule) {
      const timeKey = `${slot.startTime}-${slot.endTime}`;
      if (!scheduleMap.has(timeKey)) {
        scheduleMap.set(timeKey, []);
      }
      scheduleMap.get(timeKey)!.push(slot.day);
    }

    // Format each group
    const scheduleParts: string[] = [];

    for (const [timeKey, days] of scheduleMap.entries()) {
      const [startTime, endTime] = timeKey.split("-");

      // Format time for display (HH:MM -> H:MM AM/PM)
      const formatTime = (timeStr: string): string => {
        const [hours, minutes] = timeStr.split(":").map(Number);
        const hours12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        const ampm = hours >= 12 ? "PM" : "AM";
        return `${hours12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
      };

      const formattedStart = formatTime(startTime);
      const formattedEnd = formatTime(endTime);

      // Shorten day names
      const shortDays = days.map((day) => {
        const dayMap: { [key: string]: string } = {
          Monday: isHindi ? "सोम" : "Mon",
          Tuesday: isHindi ? "मंगल" : "Tue",
          Wednesday: isHindi ? "बुध" : "Wed",
          Thursday: isHindi ? "गुरु" : "Thu",
          Friday: isHindi ? "शुक्र" : "Fri",
          Saturday: isHindi ? "शनि" : "Sat",
          Sunday: isHindi ? "रवि" : "Sun",
        };
        return dayMap[day] || day.substring(0, 3);
      });

      const daysStr = shortDays.join(", ");
      scheduleParts.push(`${daysStr}: ${formattedStart} - ${formattedEnd}`);
    }

    const scheduleText = scheduleParts.join("; ");

    return isHindi
      ? `${doctor.name} इन दिनों काम करते हैं: ${scheduleText}`
      : `${doctor.name} works on ${scheduleText}`;
  }

  /**
   * Extract information from user query
   */
  private async extractBookingInfo(
    query: string,
    session: BookingSession
  ): Promise<void> {
    const lowerQuery = query.toLowerCase();

    // Extract name - improved pattern
    const namePatterns = [
      /(?:name|नाम|मेरा नाम)\s*(?:is|है|:|)\s*([A-Za-z\s]+)/i,
      /^(?:i am|मैं)\s+([A-Za-z\s]+)/i,
      /(?:call me|मुझे कहते हैं)\s+([A-Za-z\s]+)/i,
    ];
    for (const pattern of namePatterns) {
      const nameMatch = query.match(pattern);
      if (nameMatch && nameMatch[1]) {
        const extractedName = nameMatch[1].trim();
        // Validate it's not too short and contains letters
        if (extractedName.length >= 2 && /[A-Za-z]/.test(extractedName)) {
          session.patientName = extractedName;
          break;
        }
      }
    }

    // Extract age - improved pattern (also handles standalone numbers when age was asked)
    // Check if we're currently asking for age
    if (session.lastAskedField === "age" || !session.patientAge) {
      const agePatterns = [
        /(?:age|उम्र)\s*(?:is|है|:|)\s*(\d+)/i,
        /(\d+)\s*(?:years?|साल|वर्ष|years old)/i,
        /(?:i am|मैं)\s+(\d+)\s*(?:years?|साल)/i,
        // Standalone number - only match if age was asked or query is very short (likely age)
        ...(session.lastAskedField === "age" || query.trim().match(/^\d{1,3}$/)
          ? [
              /^(\d{1,3})$/i, // Just a number (1-3 digits)
            ]
          : []),
      ];
      for (const pattern of agePatterns) {
        const ageMatch = query.match(pattern);
        if (ageMatch && ageMatch[1]) {
          const age = parseInt(ageMatch[1]);
          if (age > 0 && age < 150) {
            session.patientAge = age;
            break;
          }
        }
      }
    }

    // Extract phone - improved pattern (handles standalone 10-11 digit numbers)
    if (!session.patientPhone) {
      // First, try to extract digits with or without spaces/dashes
      // Remove all non-digit characters and check if we have 10-11 digits
      const cleanedDigits = query.replace(/\D/g, ""); // Remove all non-digits

      // If query is mostly digits (at least 10 digits and digits make up most of the query)
      // This handles cases like "8469946600" or "846 994 6600"
      if (cleanedDigits.length >= 10 && cleanedDigits.length <= 11) {
        // Check if digits make up a significant portion of the query (more than 60% digits)
        const digitRatio =
          cleanedDigits.length / query.replace(/\s/g, "").length;
        if (digitRatio >= 0.6 || session.lastAskedField === "phone") {
          let phoneDigits = cleanedDigits;
          // If 11 digits, take last 10 (remove leading country code digit)
          if (phoneDigits.length === 11) {
            phoneDigits = phoneDigits.slice(-10);
          }
          session.patientPhone = phoneDigits;
        }
      }

      // If not extracted yet, try other patterns
      if (!session.patientPhone) {
        const phonePatterns = [
          // Formatted phone numbers with spaces/dashes
          /(\+?\d{1,3}[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/,
          // With phone/mobile keywords
          /(?:phone|mobile|फोन|नंबर)\s*(?:is|है|:|number|no\.?)?\s*([\+\d\s\-\(\)]{10,})/i,
          // Any sequence of 10+ digits (will extract all digits from the number)
          /(\d{10,})/,
        ];
        for (const pattern of phonePatterns) {
          const phoneMatch = query.match(pattern);
          if (phoneMatch) {
            // Extract all digit groups and combine them
            let phone = phoneMatch[0];
            if (phoneMatch.length > 1) {
              // If multiple groups, combine them
              phone = phoneMatch
                .slice(1)
                .filter((g) => g)
                .join("");
            }
            const cleanPhone = phone.replace(/[\s\-\(\)\+\.]/g, "");

            // Check if it's a valid phone number (10-15 digits)
            if (
              cleanPhone.length >= 10 &&
              cleanPhone.length <= 15 &&
              /^\d+$/.test(cleanPhone)
            ) {
              // If 11 digits, take last 10 (remove leading country code digit)
              let finalPhone = cleanPhone;
              if (cleanPhone.length === 11) {
                finalPhone = cleanPhone.slice(-10);
              }
              // Store cleaned version
              session.patientPhone = finalPhone;
              break;
            }
          }
        }
      }
    }

    // Extract date - improved extraction with day names
    // Allow re-extraction if user is in suggesting_alternatives state (changing date)
    const allowDateReExtraction =
      !session.appointmentDate ||
      session.state === "suggesting_alternatives" ||
      /(?:schedule|book|रखो|करो|बुक)/i.test(query);

    if (allowDateReExtraction) {
      const previousDate = session.appointmentDate;

      const todayPattern = /(?:today|आज)/i;
      const tomorrowPattern = /(?:tomorrow|कल)/i;

      // Day names mapping
      const dayNames: { [key: string]: number } = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
        रविवार: 0,
        सोमवार: 1,
        मंगलवार: 2,
        बुधवार: 3,
        गुरुवार: 4,
        शुक्रवार: 5,
        शनिवार: 6,
      };

      if (todayPattern.test(query)) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        session.appointmentDate = today;
      } else if (tomorrowPattern.test(query)) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        session.appointmentDate = tomorrow;
      } else {
        // Check for "next Monday/Tuesday/etc."
        const nextDayPattern =
          /(?:next|अगले|अगला)\s+(?:week\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|सोमवार|मंगलवार|बुधवार|गुरुवार|शुक्रवार|शनिवार|रविवार)/i;
        const nextDayMatch = query.match(nextDayPattern);
        if (nextDayMatch && nextDayMatch[1]) {
          const dayName = nextDayMatch[1].toLowerCase();
          const targetDay = dayNames[dayName];
          if (targetDay !== undefined) {
            const today = new Date();
            const currentDay = today.getDay();
            let daysUntilTarget = targetDay - currentDay;

            // If target day is today or past, add 7 days (next week)
            if (daysUntilTarget <= 0) {
              daysUntilTarget += 7;
            }

            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + daysUntilTarget);
            targetDate.setHours(0, 0, 0, 0);
            session.appointmentDate = targetDate;
          }
        } else {
          // Check for "this Monday/Tuesday/etc." (current week)
          const thisDayPattern =
            /(?:this|इस)\s+(?:week\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|सोमवार|मंगलवार|बुधवार|गुरुवार|शुक्रवार|शनिवार|रविवार)/i;
          const thisDayMatch = query.match(thisDayPattern);
          if (thisDayMatch && thisDayMatch[1]) {
            const dayName = thisDayMatch[1].toLowerCase();
            const targetDay = dayNames[dayName];
            if (targetDay !== undefined) {
              const today = new Date();
              const currentDay = today.getDay();
              let daysUntilTarget = targetDay - currentDay;

              // If target day is in the past this week, add 7 days
              if (daysUntilTarget < 0) {
                daysUntilTarget += 7;
              }

              const targetDate = new Date(today);
              targetDate.setDate(today.getDate() + daysUntilTarget);
              targetDate.setHours(0, 0, 0, 0);
              session.appointmentDate = targetDate;
            }
          } else {
            // Check for just day name (assume next occurrence) - allow "the" prefix and "schedule" prefix
            const dayPattern =
              /(?:schedule|book|the)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday|सोमवार|मंगलवार|बुधवार|गुरुवार|शुक्रवार|शनिवार|रविवार)/i;
            const dayMatch = query.match(dayPattern);
            if (dayMatch && dayMatch[1]) {
              const dayName = dayMatch[1].toLowerCase();
              const targetDay = dayNames[dayName];
              if (targetDay !== undefined) {
                const today = new Date();
                const currentDay = today.getDay();
                let daysUntilTarget = targetDay - currentDay;

                // If target day is today or in the past, get next occurrence (7 days ahead)
                if (daysUntilTarget <= 0) {
                  daysUntilTarget += 7;
                }

                const targetDate = new Date(today);
                targetDate.setDate(today.getDate() + daysUntilTarget);
                targetDate.setHours(0, 0, 0, 0);
                session.appointmentDate = targetDate;
              }
            } else {
              // Try numeric date patterns - parse as DD/MM/YYYY format
              const datePatterns = [
                /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
                /(?:next|अगले)\s+(?:week|सप्ताह)/i,
                /(\d+)\s*(?:days?|दिन)\s*(?:from|बाद|later)/i,
              ];

              for (const pattern of datePatterns) {
                const match = query.match(pattern);
                if (match) {
                  try {
                    // Parse as DD/MM/YYYY format
                    const parts = (match[0] || match[1]).split(/[-\/]/);
                    if (parts.length >= 2) {
                      let day = parseInt(parts[0]);
                      let month = parseInt(parts[1]);
                      let year =
                        parts.length > 2
                          ? parseInt(parts[2])
                          : new Date().getFullYear();
                      if (year < 100) year += 2000; // Handle 2-digit years

                      const parsedDate = new Date(year, month - 1, day);
                      if (!isNaN(parsedDate.getTime())) {
                        parsedDate.setHours(0, 0, 0, 0);
                        session.appointmentDate = parsedDate;
                        break;
                      }
                    }
                  } catch (e) {
                    // Ignore parsing errors
                  }
                }
              }
            }
          }
        }
      }

      // Log if date was updated
      if (previousDate !== session.appointmentDate && session.appointmentDate) {
        console.log(
          `📅 Date ${previousDate ? "updated" : "extracted"}: ${previousDate?.toDateString() || "none"} → ${session.appointmentDate.toDateString()}`
        );
      }
    }

    // Extract time - improved extraction with more formats
    // Allow re-extraction if user is in suggesting_alternatives state (changing time)
    const allowTimeReExtraction =
      !session.appointmentTime ||
      session.state === "suggesting_alternatives" ||
      /(?:schedule|book|रखो|करो|बुक)/i.test(query);

    if (allowTimeReExtraction) {
      const previousTime = session.appointmentTime;
      const timePatterns = [
        // Format: HH a.m./p.m. (e.g., "9 a.m", "9 p.m", "9 a", "9 p")
        {
          pattern: /(\d{1,2})\s*([ap])\.?m?\.?/i,
          hasMinutes: false,
          ampmIndex: 2,
        },
        // Format: morning/evening HH AM/PM (e.g., "morning 9 AM", "evening 5 PM")
        {
          pattern: /(?:morning|evening|afternoon)\s+(\d{1,2})\s*(AM|PM)/i,
          hasMinutes: false,
          ampmIndex: 2,
        },
        // Format: HH:MM AM/PM (e.g., "2:30 PM", "14:30")
        {
          pattern: /(\d{1,2}):(\d{2})\s*(AM|PM)?/i,
          hasMinutes: true,
          ampmIndex: 3,
        },
        // Format: HHPM/AM without space (e.g., "5pm", "5PM") - check this BEFORE space version
        { pattern: /(\d{1,2})(PM|AM)/i, hasMinutes: false, ampmIndex: 2 },
        // Format: HH AM/PM with space (e.g., "5 PM", "5pm")
        { pattern: /(\d{1,2})\s+(PM|AM)/i, hasMinutes: false, ampmIndex: 2 },
        // Format: at HH PM/AM (e.g., "at 5pm", "at 5 PM")
        {
          pattern: /(?:at|पर|for)\s+(\d{1,2})\s*(PM|AM)/i,
          hasMinutes: false,
          ampmIndex: 2,
        },
        // Format: at HH:MM (e.g., "at 5:30")
        {
          pattern: /(?:at|पर|for)\s+(\d{1,2}):(\d{2})/i,
          hasMinutes: true,
          ampmIndex: 0,
        },
        // Format: HH o'clock (e.g., "5 o'clock")
        {
          pattern: /(?:at|पर)\s+(\d{1,2})\s*(?:o'clock|बजे)/i,
          hasMinutes: false,
          ampmIndex: 0,
        },
        // Format: 24-hour format (e.g., "17:00", "17")
        {
          pattern:
            /(?:at|पर|for)?\s*(\d{1,2}):?(\d{2})?(?:\s*(?:hours?|hrs?|बजे))?$/i,
          hasMinutes: true,
          ampmIndex: 0,
        },
      ];

      for (const { pattern, hasMinutes, ampmIndex } of timePatterns) {
        const timeMatch = query.match(pattern);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          let minutes = 0;
          let ampm: string | undefined;

          if (hasMinutes && timeMatch[2]) {
            // Check if timeMatch[2] is actually minutes (digits) or AM/PM
            const potentialMinutes = parseInt(timeMatch[2]);
            if (!isNaN(potentialMinutes)) {
              minutes = potentialMinutes;
            }
          }

          // Get AM/PM from the correct index
          if (ampmIndex > 0 && timeMatch[ampmIndex]) {
            const ampmValue = timeMatch[ampmIndex].toUpperCase();
            if (ampmValue === "PM" || ampmValue === "AM") {
              ampm = ampmValue;
            } else if (ampmValue === "A") {
              // Handle "9 a" or "9 a.m"
              ampm = "AM";
            } else if (ampmValue === "P") {
              // Handle "9 p" or "9 p.m"
              ampm = "PM";
            }
          }

          // Handle AM/PM conversion
          if (ampm) {
            if (ampm === "PM" && hours !== 12) {
              hours += 12;
            } else if (ampm === "AM" && hours === 12) {
              hours = 0;
            }
          } else if (!hasMinutes && hours <= 12) {
            // If no AM/PM specified and it's a simple hour (1-12), might be ambiguous
            // But we'll assume it's in 12-hour format - user will clarify if needed
            // For now, keep as is
          }

          // Validate hours and minutes
          if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes < 60) {
            session.appointmentTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
            break;
          }
        }
      }

      // Log if time was updated
      if (previousTime !== session.appointmentTime && session.appointmentTime) {
        console.log(
          `⏰ Time ${previousTime ? "updated" : "extracted"}: ${previousTime || "none"} → ${session.appointmentTime}`
        );
      }
    }

    // Extract department/problem
    if (!session.department && !session.problem) {
      const department = this.extractDepartmentFromQuery(query);
      if (department) {
        session.department = department;
      }

      // Extract problem description if present
      const problemKeywords = [
        "problem",
        "issue",
        "symptom",
        "pain",
        "problem है",
        "दिक्कत",
        "तकलीफ",
        "hurt",
        "hurting",
      ];
      if (problemKeywords.some((kw) => lowerQuery.includes(kw))) {
        // Store the full query or extract problem phrase
        session.problem = query;
      }
    }

    // Extract doctor name
    if (!session.doctorId) {
      const doctorNamePatterns = [
        /(?:dr\.?|doctor|डॉक्टर)\s+([A-Z][A-Za-z\s]+)/i,
        /^([A-Z][A-Za-z\s]+)\s+(?:doctor|dr\.?)/i,
      ];

      for (const pattern of doctorNamePatterns) {
        const doctorMatch = query.match(pattern);
        if (doctorMatch && doctorMatch[1]) {
          const doctorName = doctorMatch[1].trim();
          const doctor = this.findDoctorByName(doctorName);
          if (doctor) {
            session.doctorId = doctor.id;
            session.department = doctor.specialization;
            break;
          }
        }
      }
    }

    session.lastUpdated = new Date();
  }

  /**
   * Handle booking confirmation
   */
  private async confirmBooking(
    query: string,
    session: BookingSession,
    isHindi: boolean
  ): Promise<string> {
    const confirmKeywords = [
      "yes",
      "हां",
      "confirm",
      "book",
      "ok",
      "ठीक है",
      "sahi",
      "correct",
      "alright",
      "all right",
      "right",
      "sure",
      "go ahead",
      "proceed",
      "please do",
      "do it",
      "book it",
      "confirm it",
      "thank you",
      "thanks",
      "fine",
      "good",
      "perfect",
      "absolutely",
      "definitely",
      "of course",
      "yeah",
      "yep",
      "yup",
      "okay",
      "okey",
      "done",
      "agreed",
    ];
    const cancelKeywords = [
      "no",
      "नहीं",
      "cancel",
      "रद्द",
      "not now",
      "maybe later",
    ];

    const lowerQuery = query.toLowerCase();
    const isConfirmed = confirmKeywords.some((kw) => lowerQuery.includes(kw));
    const isCancelled = cancelKeywords.some((kw) => lowerQuery.includes(kw));

    if (isCancelled) {
      this.bookingSessions.delete(session.sessionId);
      return isHindi
        ? "बुकिंग रद्द कर दी गई है।"
        : "Booking has been cancelled.";
    }

    if (
      isConfirmed &&
      session.patientName &&
      session.patientAge &&
      session.patientPhone &&
      session.doctorId &&
      session.appointmentDate &&
      session.appointmentTime
    ) {
      try {
        const appointment = this.createAppointmentInMemory({
          patientName: session.patientName,
          patientAge: session.patientAge,
          patientPhone: session.patientPhone,
          doctorId: session.doctorId,
          appointmentDate: session.appointmentDate.toISOString().split("T")[0],
          appointmentTime: session.appointmentTime,
          reason: session.problem,
          status: "Scheduled",
        });

        this.bookingSessions.delete(session.sessionId);

        const response = isHindi
          ? `✅ अपॉइंटमेंट बुक हो गई है!\n` +
            `Appointment ID: ${appointment.id}\n` +
            `कृपया समय पर पहुंचें।`
          : `✅ Appointment booked successfully!\n` +
            `Appointment ID: ${appointment.id}\n` +
            `Please arrive on time.`;

        return response;
      } catch (error) {
        console.error("Booking error:", error);
        return isHindi
          ? "क्षमा करें, अपॉइंटमेंट बुक करने में समस्या आई। कृपया फिर से कोशिश करें।"
          : "Sorry, there was an issue booking the appointment. Please try again.";
      }
    }

    return isHindi
      ? "कृपया सभी जानकारी प्रदान करें।"
      : "Please provide all information.";
  }

  /**
   * Check if extraction was successful for the last asked field
   */
  private checkExtractionSuccess(
    session: BookingSession,
    previousState: {
      patientName?: string;
      patientAge?: number;
      patientPhone?: string;
      appointmentDate?: Date;
      appointmentTime?: string;
      doctorId?: number;
      department?: string;
      problem?: string;
    }
  ): boolean {
    if (!session.lastAskedField) return false;

    switch (session.lastAskedField) {
      case "name":
        return !previousState.patientName && !!session.patientName;
      case "age":
        return !previousState.patientAge && !!session.patientAge;
      case "phone":
        return !previousState.patientPhone && !!session.patientPhone;
      case "date":
        return !previousState.appointmentDate && !!session.appointmentDate;
      case "time":
        return !previousState.appointmentTime && !!session.appointmentTime;
      case "doctor/department/problem":
        return (
          !previousState.doctorId &&
          !previousState.department &&
          !previousState.problem &&
          (!!session.doctorId || !!session.department || !!session.problem)
        );
      default:
        return false;
    }
  }

  /**
   * Process booking flow - step by step conversational approach
   */
  private async processBookingFlow(
    query: string,
    sessionId: string,
    isHindi: boolean
  ): Promise<string> {
    this.cleanupSessions();
    const session = this.getBookingSession(sessionId);
    session.conversationHistory.push({ role: "user", content: query });

    // Store previous state to detect extraction success
    const previousState = {
      patientName: session.patientName,
      patientAge: session.patientAge,
      patientPhone: session.patientPhone,
      appointmentDate: session.appointmentDate,
      appointmentTime: session.appointmentTime,
      doctorId: session.doctorId,
      department: session.department,
      problem: session.problem,
    };

    // Extract information from query
    await this.extractBookingInfo(query, session);

    // IMPORTANT: If department/problem is detected but doctor is not set, automatically suggest and set doctor
    // BUT DON'T immediately return - we need to collect user details first
    if ((session.department || session.problem) && !session.doctorId) {
      const searchQuery = session.problem || query;
      const suggestion = this.suggestDoctorByProblem(searchQuery);
      if (suggestion.doctors.length > 0) {
        session.doctorId = suggestion.doctors[0].id;
        session.department = suggestion.specialization;
        // Doctor is now set, but we'll continue to collect other details
        // Don't return here - let the flow continue to ask for missing details
      }
    }

    // Check if user is providing confirmation response even when not in confirming state
    // This handles cases where user says "alright", "thank you" after being told all info is collected
    const lowerQuery = query.toLowerCase();
    const confirmKeywords = [
      "yes",
      "हां",
      "confirm",
      "book",
      "ok",
      "ठीक है",
      "sahi",
      "correct",
      "alright",
      "all right",
      "right",
      "sure",
      "go ahead",
      "proceed",
      "please do",
      "do it",
      "book it",
      "confirm it",
      "thank you",
      "thanks",
      "fine",
      "good",
      "perfect",
      "absolutely",
      "definitely",
      "of course",
      "yeah",
      "yep",
      "yup",
      "okay",
      "okey",
      "done",
      "agreed",
    ];

    // If all required fields are present and user is providing confirmation response
    if (
      session.patientName &&
      session.patientAge &&
      session.patientPhone &&
      session.doctorId &&
      session.appointmentDate &&
      session.appointmentTime &&
      confirmKeywords.some((kw) => lowerQuery.includes(kw))
    ) {
      // Treat as confirmation and proceed to book
      session.state = "confirming";
      const confirmationResponse = await this.confirmBooking(
        query,
        session,
        isHindi
      );
      session.conversationHistory.push({
        role: "assistant",
        content: confirmationResponse,
      });
      return confirmationResponse;
    }

    // Check if user is asking for clarification about what information is needed
    const clarificationKeywords = [
      "what information",
      "what info",
      "what do you need",
      "what details",
      "क्या जानकारी",
      "कौन सी जानकारी",
      "क्या चाहिए",
    ];
    const isClarification = clarificationKeywords.some((kw) =>
      lowerQuery.includes(kw)
    );

    if (isClarification) {
      // Tell user what information is still missing
      const missingFields = [];
      if (!session.patientName) missingFields.push(isHindi ? "नाम" : "name");
      if (!session.patientAge) missingFields.push(isHindi ? "उम्र" : "age");
      if (!session.patientPhone)
        missingFields.push(isHindi ? "फोन नंबर" : "phone number");
      if (!session.doctorId && !session.department && !session.problem) {
        missingFields.push(
          isHindi ? "डॉक्टर या समस्या" : "doctor or medical concern"
        );
      }
      if (!session.appointmentDate)
        missingFields.push(isHindi ? "तारीख" : "appointment date");
      if (!session.appointmentTime)
        missingFields.push(isHindi ? "समय" : "appointment time");

      if (missingFields.length > 0) {
        const response = isHindi
          ? `मुझे अभी भी ये जानकारी चाहिए: ${missingFields.join(", ")}। कृपया इन्हें दें।`
          : `I still need this information: ${missingFields.join(", ")}. Please provide these details.`;
        session.conversationHistory.push({
          role: "assistant",
          content: response,
        });
        return response;
      } else {
        // All information collected, set state to confirming and show confirmation prompt
        session.state = "confirming";

        const doctor = this.findDoctorById(session.doctorId);
        const response = isHindi
          ? `पुष्टि करें:\n` +
            `डॉक्टर: ${doctor.name} (${session.department || "Specialist"})\n` +
            `मरीज: ${session.patientName}\n` +
            `उम्र: ${session.patientAge}\n` +
            `फोन: ${session.patientPhone}\n` +
            `तारीख: ${this.formatDateClearly(session.appointmentDate)}\n` +
            `समय: ${session.appointmentTime}\n` +
            `क्या आप बुक करना चाहते हैं? (हां/नहीं)`
          : `Please confirm your appointment:\n` +
            `Doctor: ${doctor.name} (${session.department || "Specialist"})\n` +
            `Patient: ${session.patientName}\n` +
            `Age: ${session.patientAge}\n` +
            `Phone: ${session.patientPhone}\n` +
            `Date: ${this.formatDateClearly(session.appointmentDate)}\n` +
            `Time: ${session.appointmentTime}\n` +
            `Do you want to book? (yes/no)`;

        session.conversationHistory.push({
          role: "assistant",
          content: response,
        });
        return response;
      }
    }

    // Check if extraction was successful for last asked field
    const extractionSucceeded = this.checkExtractionSuccess(
      session,
      previousState
    );
    if (extractionSucceeded && session.lastAskedField) {
      // Clear lastAskedField since we got the answer
      session.lastAskedField = undefined;
    }

    // Check if user is asking about doctor schedule/times
    const scheduleQueryKeywords = [
      "tell me about the time",
      "tell me about time",
      "what time",
      "when is doctor available",
      "doctor schedule",
      "doctor timing",
      "available time",
      "when does doctor work",
      "समय बताओ",
      "डॉक्टर का समय",
      "कब उपलब्ध",
      "schedule बताओ",
      "timing बताओ",
      "कौन से दिन",
      "कब मिलेगा",
      "available time",
      "doctor available time",
    ];
    const isScheduleQuery = scheduleQueryKeywords.some((kw) =>
      lowerQuery.includes(kw)
    );

    if (isScheduleQuery && session.doctorId) {
      // User is asking about schedule - provide doctor schedule and available times
      const doctor = this.findDoctorById(session.doctorId);
      const scheduleText = this.formatDoctorSchedule(doctor, isHindi);

      // Get available times for the requested date (if date is set)
      const targetDate = session.appointmentDate || new Date();
      const availableTimes = this.findAlternativeTimesInMemory(
        session.doctorId,
        targetDate
      );

      let response = scheduleText;

      if (session.appointmentDate) {
        const dateStr = this.formatDateClearly(session.appointmentDate);
        if (availableTimes.length > 0) {
          response += isHindi
            ? `\n${dateStr} के लिए उपलब्ध समय: ${availableTimes.slice(0, 5).join(", ")}`
            : `\nAvailable times for ${dateStr}: ${availableTimes.slice(0, 5).join(", ")}`;
        } else {
          response += isHindi
            ? `\n${dateStr} के लिए कोई slot उपलब्ध नहीं है। कृपया किसी अन्य दिन का चयन करें।`
            : `\nNo slots available for ${dateStr}. Please choose another day.`;
        }
      } else if (availableTimes.length > 0) {
        const dateStr = isHindi ? "आज" : "today";
        response += isHindi
          ? `\n${dateStr} के लिए उपलब्ध समय: ${availableTimes.slice(0, 5).join(", ")}`
          : `\nAvailable times for ${dateStr}: ${availableTimes.slice(0, 5).join(", ")}`;
      }

      // Ask for date if not provided
      if (!session.appointmentDate) {
        response += isHindi
          ? `\nआप किस दिन appointment चाहते हैं?`
          : `\nWhich day would you like to book?`;
        session.lastAskedField = "date";
      } else if (!session.appointmentTime && availableTimes.length > 0) {
        response += isHindi
          ? `\nकौन सा time slot चुनेंगे?`
          : `\nWhich time slot would you prefer?`;
        session.lastAskedField = "time";
      }

      session.conversationHistory.push({
        role: "assistant",
        content: response,
      });
      return response;
    }

    // Step 1: PRIORITIZE collecting patient details (name, age, phone) first
    // Only suggest doctor and ask for scheduling AFTER we have patient details
    // This creates a better conversation flow

    // If problem/department detected but doctor not set, set the doctor silently
    // But don't inform the user yet - collect their details first
    if ((session.department || session.problem) && !session.doctorId) {
      const searchQuery = session.problem || query;
      const suggestion = this.suggestDoctorByProblem(searchQuery);

      if (suggestion.doctors.length > 0) {
        session.doctorId = suggestion.doctors[0].id;
        session.department = suggestion.specialization;
        // Doctor is now set, but continue to collect other info
        // DON'T return here - fall through to collect patient details
      }
    }

    // Now check if we need to collect patient details
    // If any of name, age, or phone is missing, ask for it
    if (!session.patientName || !session.patientAge || !session.patientPhone) {
      // Continue to the askForNextField section below
      // This will handle asking for the missing details
    } else if ((session.department || session.problem) && session.doctorId) {
      // NOW that we have patient details, inform about the doctor and ask for scheduling
      const doctor = this.findDoctorById(session.doctorId);
      const dateStr = session.appointmentDate
        ? this.formatDateClearly(session.appointmentDate)
        : isHindi
          ? "आज"
          : "today";

      // Get available times
      const targetDate = session.appointmentDate || new Date();
      const availableTimes = this.findAlternativeTimesInMemory(
        session.doctorId,
        targetDate
      );

      const doctorResponses = isHindi
        ? [
            `धन्यवाद! मैं ${doctor.name} (${session.department}) के साथ आपकी अपॉइंटमेंट बुक कर सकता हूं।`,
            `बहुत अच्छा! ${doctor.name} (${session.department}) आपके लिए बेहतरीन विकल्प हैं।`,
            `परफेक्ट! ${doctor.name} (${session.department}) से consult करते हैं।`,
          ]
        : [
            `Thank you! I can book you with ${doctor.name} (${session.department}).`,
            `Great! ${doctor.name} (${session.department}) is an excellent choice for you.`,
            `Perfect! Let's schedule you with ${doctor.name} (${session.department}).`,
          ];
      let response =
        doctorResponses[Math.floor(Math.random() * doctorResponses.length)];

      // If both date and time already provided, acknowledge and move to confirmation
      if (session.appointmentDate && session.appointmentTime) {
        const timeStr = session.appointmentTime;
        response += isHindi
          ? `\nआपका अपॉइंटमेंट ${dateStr} को ${timeStr} पर है।`
          : `\nYour appointment is on ${dateStr} at ${timeStr}.`;
        // Don't set lastAskedField, let it proceed to confirmation
      } else if (availableTimes.length > 0) {
        response += isHindi
          ? `\n${dateStr} के लिए उपलब्ध समय: ${availableTimes.slice(0, 5).join(", ")}`
          : `\nAvailable times for ${dateStr}: ${availableTimes.slice(0, 5).join(", ")}`;
      } else {
        // No available times - show doctor's schedule
        const scheduleText = this.formatDoctorSchedule(doctor, isHindi);
        response += isHindi
          ? `\n${scheduleText}\nकृपया उपलब्ध दिनों में से एक चुनें।`
          : `\n${scheduleText}\nPlease choose one of the available days.`;
      }

      if (!session.appointmentDate && !session.appointmentTime) {
        response += isHindi
          ? `\nकिस दिन और समय पर अपॉइंटमेंट चाहिए?`
          : `\nWhat date and time would you prefer?`;
        session.lastAskedField = "date";
      } else if (session.appointmentDate && !session.appointmentTime) {
        response += isHindi
          ? `\n${dateStr} को किस समय चाहिए?`
          : `\nWhat time on ${dateStr}?`;
        session.lastAskedField = "time";
      }

      session.conversationHistory.push({
        role: "assistant",
        content: response,
      });
      return response;
    }

    // Step 2: If we have doctor, date, and time - check availability
    if (
      session.doctorId &&
      session.appointmentDate &&
      session.appointmentTime
    ) {
      session.state = "checking_availability";

      const availability = this.checkDoctorAvailabilityInMemory(
        session.doctorId,
        session.appointmentDate,
        session.appointmentTime
      );

      if (!availability.available) {
        // Get doctor for schedule info
        const doctor = this.findDoctorById(session.doctorId);

        // Find alternatives
        const alternativeTimes = this.findAlternativeTimesInMemory(
          session.doctorId,
          session.appointmentDate
        );

        const alternativeDoctors = this.findAlternativeDoctorsInMemory(
          session.doctorId,
          session.appointmentDate,
          session.appointmentTime
        );

        let response = isHindi
          ? `क्षमा करें, ${availability.reason}`
          : `Sorry, ${availability.reason}`;

        // If doctor doesn't work on this day, suggest next available day
        if (
          availability.reason &&
          availability.reason.includes("does not work on this day")
        ) {
          const scheduleText = this.formatDoctorSchedule(doctor, isHindi);
          response += isHindi ? `\n${scheduleText}` : `\n${scheduleText}`;

          // Suggest the next available day for this doctor
          const nextAvailableDay = this.findNextAvailableDay(
            doctor,
            session.appointmentDate
          );
          if (nextAvailableDay) {
            response += isHindi
              ? `\n\nसुझाव: ${doctor.name} अगली बार ${nextAvailableDay} को उपलब्ध हैं।`
              : `\n\nSuggestion: ${doctor.name} is next available on ${nextAvailableDay}.`;
          }
        }

        if (alternativeTimes.length > 0) {
          response += isHindi
            ? `\nवैकल्पिक समय: ${alternativeTimes.slice(0, 3).join(", ")}`
            : `\nAlternative times: ${alternativeTimes.slice(0, 3).join(", ")}`;
        }

        if (alternativeDoctors.length > 0) {
          response += isHindi
            ? `\nवैकल्पिक डॉक्टर: ${alternativeDoctors.map((d) => d.doctor.name).join(", ")}`
            : `\nAlternative doctors: ${alternativeDoctors.map((d) => d.doctor.name).join(", ")}`;
        }

        response += isHindi
          ? `\nकौन सा समय या डॉक्टर चुनेंगे?`
          : `\nWhich time or doctor would you prefer?`;

        session.lastAskedField = "time";
        session.conversationHistory.push({
          role: "assistant",
          content: response,
        });
        return response;
      }

      // Doctor is available, proceed to collect patient details
      // If we have all patient details, show confirmation
      if (session.patientName && session.patientAge && session.patientPhone) {
        session.state = "confirming";

        const doctor = this.findDoctorById(session.doctorId);
        const response = isHindi
          ? `पुष्टि करें:\n` +
            `डॉक्टर: ${doctor.name} (${session.department || "Specialist"})\n` +
            `मरीज: ${session.patientName}\n` +
            `उम्र: ${session.patientAge}\n` +
            `फोन: ${session.patientPhone}\n` +
            `तारीख: ${this.formatDateClearly(session.appointmentDate)}\n` +
            `समय: ${session.appointmentTime}\n` +
            `क्या आप बुक करना चाहते हैं? (हां/नहीं)`
          : `Please confirm your appointment:\n` +
            `Doctor: ${doctor.name} (${session.department || "Specialist"})\n` +
            `Patient: ${session.patientName}\n` +
            `Age: ${session.patientAge}\n` +
            `Phone: ${session.patientPhone}\n` +
            `Date: ${this.formatDateClearly(session.appointmentDate)}\n` +
            `Time: ${session.appointmentTime}\n` +
            `Do you want to book? (yes/no)`;

        session.conversationHistory.push({
          role: "assistant",
          content: response,
        });
        return response;
      }
    }

    // Check if all information is collected - if yes, show confirmation immediately
    // This check happens after extraction, so if phone was just provided, we can proceed
    if (
      session.patientName &&
      session.patientAge &&
      session.patientPhone &&
      session.doctorId &&
      session.appointmentDate &&
      session.appointmentTime
    ) {
      session.state = "confirming";

      const doctor = this.findDoctorById(session.doctorId);
      const response = isHindi
        ? `पुष्टि करें:\n` +
          `डॉक्टर: ${doctor.name} (${session.department || "Specialist"})\n` +
          `मरीज: ${session.patientName}\n` +
          `उम्र: ${session.patientAge}\n` +
          `फोन: ${session.patientPhone}\n` +
          `तारीख: ${this.formatDateClearly(session.appointmentDate)}\n` +
          `समय: ${session.appointmentTime}\n` +
          `क्या आप बुक करना चाहते हैं? (हां/नहीं)`
        : `Please confirm your appointment:\n` +
          `Doctor: ${doctor.name} (${session.department || "Specialist"})\n` +
          `Patient: ${session.patientName}\n` +
          `Age: ${session.patientAge}\n` +
          `Phone: ${session.patientPhone}\n` +
          `Date: ${this.formatDateClearly(session.appointmentDate)}\n` +
          `Time: ${session.appointmentTime}\n` +
          `Do you want to book? (yes/no)`;

      session.conversationHistory.push({
        role: "assistant",
        content: response,
      });
      return response;
    }

    // Step 3: Ask for missing information ONE at a time
    // But FIRST, make sure we've suggested doctor if problem/department was mentioned
    const nextField = this.getNextMissingField(session);

    // If we have department/problem but no doctor yet, prioritize suggesting doctor
    if (
      (session.department || session.problem) &&
      !session.doctorId &&
      nextField === "doctor/department/problem"
    ) {
      const searchQuery = session.problem || query;
      const suggestion = this.suggestDoctorByProblem(searchQuery);

      if (suggestion.doctors.length > 0) {
        session.doctorId = suggestion.doctors[0].id;
        session.department = suggestion.specialization;

        const doctor = suggestion.doctors[0];
        const dateStr = session.appointmentDate
          ? this.formatDateClearly(session.appointmentDate)
          : isHindi
            ? "आज"
            : "today";

        // Get available times
        const targetDate = session.appointmentDate || new Date();
        const availableTimes = this.findAlternativeTimesInMemory(
          session.doctorId,
          targetDate
        );

        let response = isHindi
          ? `मैं आपकी मदद कर सकता हूं। ${doctor.name} (${suggestion.specialization}) आपके लिए उपयुक्त हैं।`
          : `I can help you. I suggest ${doctor.name} (${suggestion.specialization}) for you.`;

        if (availableTimes.length > 0) {
          response += isHindi
            ? `\n${dateStr} के लिए उपलब्ध समय: ${availableTimes.slice(0, 5).join(", ")}`
            : `\nAvailable times for ${dateStr}: ${availableTimes.slice(0, 5).join(", ")}`;
        } else {
          // No available times - show doctor's schedule
          const scheduleText = this.formatDoctorSchedule(doctor, isHindi);
          response += isHindi
            ? `\n${scheduleText}\nकृपया उपलब्ध दिनों में से एक चुनें।`
            : `\n${scheduleText}\nPlease choose one of the available days.`;
        }

        if (!session.appointmentDate && !session.appointmentTime) {
          response += isHindi
            ? `\nकिस दिन और समय पर अपॉइंटमेंट चाहिए?`
            : `\nWhat date and time would you prefer?`;
          session.lastAskedField = "date";
        } else if (session.appointmentDate && !session.appointmentTime) {
          response += isHindi
            ? `\n${dateStr} को किस समय चाहिए?`
            : `\nWhat time on ${dateStr}?`;
          session.lastAskedField = "time";
        } else {
          // Both date and time provided, move to patient details
          session.lastAskedField = undefined;
        }

        session.conversationHistory.push({
          role: "assistant",
          content: response,
        });
        return response;
      }
    }

    // if (!nextField) {
    //   // All information collected but something went wrong
    //   // Check if user is asking what information is needed (clarification question)
    //   const lowerQuery = query.toLowerCase();
    //   const clarificationKeywords = [
    //     "what information",
    //     "what info",
    //     "what do you need",
    //     "what details",
    //     "what",
    //     "क्या जानकारी",
    //     "कौन सी जानकारी",
    //     "क्या चाहिए",
    //     "क्या",
    //   ];
    //   const isClarification = clarificationKeywords.some((kw) =>
    //     lowerQuery.includes(kw)
    //   );

    //   if (isClarification) {
    //     // Tell user what information is still missing
    //     const missingFields = [];
    //     if (!session.patientName) missingFields.push(isHindi ? "नाम" : "name");
    //     if (!session.patientAge) missingFields.push(isHindi ? "उम्र" : "age");
    //     if (!session.patientPhone)
    //       missingFields.push(isHindi ? "फोन नंबर" : "phone number");
    //     if (!session.doctorId && !session.department && !session.problem) {
    //       missingFields.push(
    //         isHindi ? "डॉक्टर या समस्या" : "doctor or medical concern"
    //       );
    //     }
    //     if (!session.appointmentDate)
    //       missingFields.push(isHindi ? "तारीख" : "appointment date");
    //     if (!session.appointmentTime)
    //       missingFields.push(isHindi ? "समय" : "appointment time");

    //     if (missingFields.length > 0) {
    //       return isHindi
    //         ? `मुझे अभी भी ये जानकारी चाहिए: ${missingFields.join(", ")}। कृपया इन्हें दें।`
    //         : `I still need this information: ${missingFields.join(", ")}. Please provide these details.`;
    //     }
    //   }

    //   return isHindi
    //     ? "कृपया अपनी जानकारी दें।"
    //     : "Please provide your information.";
    // }

    // If extraction succeeded, acknowledge before asking next question
    if (extractionSucceeded) {
      let acknowledgment = "";

      // Acknowledge what was extracted
      if (
        previousState.appointmentDate !== session.appointmentDate &&
        session.appointmentDate
      ) {
        // Format date clearly: "Monday, January 5"
        const formattedDate = this.formatDateClearly(session.appointmentDate);

        const dateResponses = isHindi
          ? [
              `बिल्कुल! ${formattedDate} की date नोट कर ली।`,
              `ठीक है, ${formattedDate} schedule कर लिया।`,
              `Perfect! ${formattedDate} fix कर दिया है।`,
            ]
          : [
              `Perfect! I've set ${formattedDate} for your appointment.`,
              `Great! ${formattedDate} works.`,
              `Done! I've scheduled it for ${formattedDate}.`,
            ];
        acknowledgment =
          dateResponses[Math.floor(Math.random() * dateResponses.length)];
      } else if (
        previousState.appointmentTime !== session.appointmentTime &&
        session.appointmentTime
      ) {
        // Format time for display (17:00:00 -> 5:00 PM)
        const timeParts = session.appointmentTime.split(":");
        const hours = parseInt(timeParts[0]);
        const minutes = timeParts[1];
        const displayTime =
          hours > 12
            ? `${hours - 12}:${minutes} PM`
            : hours === 12
              ? `12:${minutes} PM`
              : hours === 0
                ? `12:${minutes} AM`
                : `${hours}:${minutes} AM`;
        const timeResponses = isHindi
          ? [
              `बिल्कुल! ${displayTime} का time fix कर दिया।`,
              `ठीक है, ${displayTime} पर appointment है।`,
              `Perfect! ${displayTime} schedule कर लिया।`,
            ]
          : [
              `Perfect! I've set the time for ${displayTime}.`,
              `Great! ${displayTime} it is.`,
              `Done! Time is fixed for ${displayTime}.`,
            ];
        acknowledgment =
          timeResponses[Math.floor(Math.random() * timeResponses.length)];
      } else if (
        previousState.patientName !== session.patientName &&
        session.patientName
      ) {
        const responses = isHindi
          ? [
              `बहुत अच्छा ${session.patientName}जी!`,
              `ठीक है ${session.patientName}जी, नोट कर लिया।`,
              `धन्यवाद ${session.patientName}जी!`,
            ]
          : [
              `Nice to meet you, ${session.patientName}!`,
              `Got it, ${session.patientName}. Thanks!`,
              `Perfect, ${session.patientName}.`,
            ];
        acknowledgment =
          responses[Math.floor(Math.random() * responses.length)];
      } else if (
        previousState.patientAge !== session.patientAge &&
        session.patientAge
      ) {
        const responses = isHindi
          ? [
              `ठीक है, ${session.patientAge} साल। धन्यवाद!`,
              `नोट कर लिया, ${session.patientAge} साल।`,
              `अच्छा, ${session.patientAge} साल।`,
            ]
          : [
              `Got it, ${session.patientAge} years old. Thanks!`,
              `Perfect, ${session.patientAge} years.`,
              `Noted, ${session.patientAge} years.`,
            ];
        acknowledgment =
          responses[Math.floor(Math.random() * responses.length)];
      } else if (
        previousState.patientPhone !== session.patientPhone &&
        session.patientPhone
      ) {
        const formattedPhone =
          session.patientPhone.length === 10
            ? `${session.patientPhone.slice(0, 5)} ${session.patientPhone.slice(5)}`
            : session.patientPhone;
        const responses = isHindi
          ? [
              `बिल्कुल, ${formattedPhone} नोट कर लिया।`,
              `ठीक है, फोन नंबर ${formattedPhone} लिख लिया।`,
              `धन्यवाद, ${formattedPhone} सेव कर दिया।`,
            ]
          : [
              `Perfect! I've saved ${formattedPhone}.`,
              `Got it! Your number ${formattedPhone} is noted.`,
              `Thanks! I've recorded ${formattedPhone}.`,
            ];
        acknowledgment =
          responses[Math.floor(Math.random() * responses.length)];

        // Immediately check if all info is complete after phone extraction
        if (
          session.patientName &&
          session.patientAge &&
          session.patientPhone &&
          session.doctorId &&
          session.appointmentDate &&
          session.appointmentTime
        ) {
          session.state = "confirming";
          const doctor = this.findDoctorById(session.doctorId);
          const confirmationMessage = isHindi
            ? `पुष्टि करें:\n` +
              `डॉक्टर: ${doctor.name} (${session.department || "Specialist"})\n` +
              `मरीज: ${session.patientName}\n` +
              `उम्र: ${session.patientAge}\n` +
              `फोन: ${session.patientPhone}\n` +
              `तारीख: ${this.formatDateClearly(session.appointmentDate)}\n` +
              `समय: ${session.appointmentTime}\n` +
              `क्या आप बुक करना चाहते हैं? (हां/नहीं)`
            : `Please confirm your appointment:\n` +
              `Doctor: ${doctor.name} (${session.department || "Specialist"})\n` +
              `Patient: ${session.patientName}\n` +
              `Age: ${session.patientAge}\n` +
              `Phone: ${session.patientPhone}\n` +
              `Date: ${this.formatDateClearly(session.appointmentDate)}\n` +
              `Time: ${session.appointmentTime}\n` +
              `Do you want to book? (yes/no)`;

          const response = `${acknowledgment}\n\n${confirmationMessage}`;
          session.conversationHistory.push({
            role: "assistant",
            content: response,
          });
          return response;
        }
      }

      // If both date and time were extracted together, acknowledge both
      if (
        previousState.appointmentDate !== session.appointmentDate &&
        previousState.appointmentTime !== session.appointmentTime &&
        session.appointmentDate &&
        session.appointmentTime
      ) {
        // Format time for display (17:00:00 -> 5:00 PM)
        const timeParts = session.appointmentTime.split(":");
        const hours = parseInt(timeParts[0]);
        const minutes = timeParts[1];
        const displayTime =
          hours > 12
            ? `${hours - 12}:${minutes} PM`
            : hours === 12
              ? `12:${minutes} PM`
              : hours === 0
                ? `12:${minutes} AM`
                : `${hours}:${minutes} AM`;
        const combinedResponses = isHindi
          ? [
              `बिल्कुल perfect! ${this.formatDateClearly(session.appointmentDate)} को ${displayTime} पर appointment fix हो गई।`,
              `ठीक है! ${this.formatDateClearly(session.appointmentDate)} को ${displayTime} schedule कर दिया है।`,
              `Great! ${this.formatDateClearly(session.appointmentDate)} को ${displayTime} पर आपकी appointment है।`,
            ]
          : [
              `Perfect! I've scheduled your appointment for ${this.formatDateClearly(session.appointmentDate)} at ${displayTime}.`,
              `Excellent! Your appointment is set for ${this.formatDateClearly(session.appointmentDate)} at ${displayTime}.`,
              `Great! I've booked you for ${this.formatDateClearly(session.appointmentDate)} at ${displayTime}.`,
            ];
        acknowledgment =
          combinedResponses[
            Math.floor(Math.random() * combinedResponses.length)
          ];
      }

      if (acknowledgment) {
        // Check if all information is now complete after extraction
        if (
          session.patientName &&
          session.patientAge &&
          session.patientPhone &&
          session.doctorId &&
          session.appointmentDate &&
          session.appointmentTime
        ) {
          // All info collected, proceed to confirmation
          session.state = "confirming";

          const doctor = this.findDoctorById(session.doctorId);
          const response =
            acknowledgment +
            (isHindi
              ? `\n\nपुष्टि करें:\n` +
                `डॉक्टर: ${doctor.name} (${session.department || "Specialist"})\n` +
                `मरीज: ${session.patientName}\n` +
                `उम्र: ${session.patientAge}\n` +
                `फोन: ${session.patientPhone}\n` +
                `तारीख: ${this.formatDateClearly(session.appointmentDate)}\n` +
                `समय: ${session.appointmentTime}\n` +
                `क्या आप बुक करना चाहते हैं? (हां/नहीं)`
              : `\n\nPlease confirm your appointment:\n` +
                `Doctor: ${doctor.name} (${session.department || "Specialist"})\n` +
                `Patient: ${session.patientName}\n` +
                `Age: ${session.patientAge}\n` +
                `Phone: ${session.patientPhone}\n` +
                `Date: ${this.formatDateClearly(session.appointmentDate)}\n` +
                `Time: ${session.appointmentTime}\n` +
                `Do you want to book? (yes/no)`);

          session.conversationHistory.push({
            role: "assistant",
            content: response,
          });
          return response;
        }

        // Continue to ask next question, but with acknowledgment first
        // (we'll add the question below, so return early only if we should move to next step)
        const currentNextField = this.getNextMissingField(session);
        if (currentNextField && currentNextField !== nextField) {
          // Field changed, so we'll ask the new field with acknowledgment
          session.lastAskedField = undefined; // Clear it so we can ask next
        }
      }
    }

    // Don't repeat the same question if user just answered
    if (session.lastAskedField === nextField && !extractionSucceeded) {
      // Check if user provided the answer in current query
      const fieldExtracted =
        (nextField === "name" && session.patientName) ||
        (nextField === "age" && session.patientAge) ||
        (nextField === "phone" && session.patientPhone) ||
        (nextField === "date" && session.appointmentDate) ||
        (nextField === "time" && session.appointmentTime) ||
        (nextField === "doctor/department/problem" &&
          (session.doctorId || session.department || session.problem));

      if (!fieldExtracted) {
        // User didn't provide answer, ask again with rephrasing
        const rephrasedQuestions: {
          [key: string]: { en: string[]; hi: string[] };
        } = {
          name: {
            en: [
              "I didn't catch your name. Could you tell me again?",
              "Sorry, I still need your name. What should I call you?",
              "May I have your name, please?",
            ],
            hi: [
              "मुझे आपका नाम नहीं मिला। कृपया फिर से बताएं?",
              "क्षमा करें, अभी भी आपका नाम चाहिए। आपका नाम क्या है?",
              "कृपया अपना नाम बताएं?",
            ],
          },
          age: {
            en: [
              "Could you tell me your age?",
              "I still need your age, please.",
              "How old are you?",
            ],
            hi: [
              "कृपया अपनी उम्र बताएं?",
              "अभी भी आपकी उम्र चाहिए।",
              "आप कितने साल के हैं?",
            ],
          },
          phone: {
            en: [
              "Could you share your phone number?",
              "I still need your contact number, please.",
              "What's your mobile number?",
            ],
            hi: [
              "कृपया अपना फोन नंबर share करें?",
              "अभी भी आपका contact number चाहिए।",
              "आपका mobile number क्या है?",
            ],
          },
          date: {
            en: [
              "When would you like to schedule?",
              "Which date works for you?",
              "What day would you prefer?",
            ],
            hi: [
              "आप कब schedule करना चाहेंगे?",
              "कौन सी date आपके लिए ठीक है?",
              "कौन सा दिन prefer करेंगे?",
            ],
          },
          time: {
            en: [
              "What time would work?",
              "Which time slot do you prefer?",
              "When would you like to come?",
            ],
            hi: [
              "कौन सा समय ठीक रहेगा?",
              "आप कौन सा time slot prefer करेंगे?",
              "आप कब आना चाहेंगे?",
            ],
          },
          "doctor/department/problem": {
            en: [
              "Which doctor would you like to see?",
              "What's your medical concern?",
              "Tell me about your health issue or preferred doctor.",
            ],
            hi: [
              "आप किस डॉक्टर से मिलना चाहेंगे?",
              "आपकी medical problem क्या है?",
              "अपनी health issue या preferred doctor बताएं।",
            ],
          },
        };

        const variations = rephrasedQuestions[nextField];
        if (variations) {
          const options = isHindi ? variations.hi : variations.en;
          const question = options[Math.floor(Math.random() * options.length)];
          session.conversationHistory.push({
            role: "assistant",
            content: question,
          });
          return question;
        }
      }
    }

    // Ask the next question - with natural variations
    let question = "";
    const questionVariations: {
      [key: string]: { en: string[]; hi: string[] };
    } = {
      "doctor/department/problem": {
        en: [
          "Which doctor would you like to see, or what's your medical concern?",
          "What kind of doctor do you need? Or tell me about your problem.",
          "Who would you like to consult, or what health issue are you facing?",
        ],
        hi: [
          "आप किस डॉक्टर से मिलना चाहेंगे, या आपकी क्या समस्या है?",
          "आपको किस तरह के डॉक्टर की जरूरत है? या अपनी परेशानी बताएं।",
          "कौन से डॉक्टर से consult करना चाहेंगे, या आपकी health issue क्या है?",
        ],
      },
      date: {
        en: [
          "When would you like to schedule the appointment?",
          "What day works best for you?",
          "Which date would be convenient for you?",
        ],
        hi: [
          "आप कब अपॉइंटमेंट लेना चाहेंगे?",
          "कौन सा दिन आपके लिए ठीक रहेगा?",
          "किस तारीख पर आप आ सकते हैं?",
        ],
      },
      time: {
        en: [
          "What time would work for you?",
          "Which time slot would you prefer?",
          "What time suits you best?",
        ],
        hi: [
          "किस समय आप आ सकते हैं?",
          "कौन सा time slot आपको सूट करेगा?",
          "आपके लिए कौन सा समय बेहतर रहेगा?",
        ],
      },
      name: {
        en: [
          "May I know your name, please?",
          "What should I call you?",
          "Could you tell me your name?",
        ],
        hi: [
          "कृपया अपना नाम बताएं?",
          "आपका नाम क्या है?",
          "आपको कैसे संबोधित करूं?",
        ],
      },
      age: {
        en: [
          "How old are you?",
          "What's your age?",
          "Could you tell me your age?",
        ],
        hi: [
          "आपकी उम्र क्या है?",
          "आप कितने साल के हैं?",
          "कृपया अपनी उम्र बताएं?",
        ],
      },
      phone: {
        en: [
          "Could you share your contact number?",
          "What's your phone number?",
          "May I have your mobile number?",
        ],
        hi: [
          "कृपया अपना contact number share करें?",
          "आपका फोन नंबर क्या है?",
          "आपका mobile number मिल सकता है?",
        ],
      },
    };

    const variations = questionVariations[nextField];
    if (variations) {
      const options = isHindi ? variations.hi : variations.en;
      question = options[Math.floor(Math.random() * options.length)];
    }
    // else {
    //   // Fallback
    //   question = isHindi
    //     ? "कृपया जानकारी दें।"
    //     : "Please provide the information.";
    // }

    // Add acknowledgment if extraction succeeded
    let finalResponse = "";
    if (extractionSucceeded) {
      // Build acknowledgment message
      if (
        previousState.appointmentDate !== session.appointmentDate &&
        session.appointmentDate
      ) {
        // Format date clearly: "Monday, January 5"
        const formattedDate = this.formatDateClearly(session.appointmentDate);

        const dateResponses = isHindi
          ? [
              `बिल्कुल! ${formattedDate} की date नोट कर ली। `,
              `ठीक है, ${formattedDate} schedule कर लिया। `,
              `Perfect! ${formattedDate} fix कर दिया है। `,
            ]
          : [
              `Perfect! I've set ${formattedDate} for your appointment. `,
              `Great! ${formattedDate} works. `,
              `Done! I've scheduled it for ${formattedDate}. `,
            ];
        finalResponse =
          dateResponses[Math.floor(Math.random() * dateResponses.length)];
      } else if (
        previousState.appointmentTime !== session.appointmentTime &&
        session.appointmentTime
      ) {
        // Format time for display (17:00:00 -> 5:00 PM)
        const timeParts = session.appointmentTime.split(":");
        const hours = parseInt(timeParts[0]);
        const minutes = timeParts[1];
        const displayTime =
          hours > 12
            ? `${hours - 12}:${minutes} PM`
            : hours === 12
              ? `12:${minutes} PM`
              : hours === 0
                ? `12:${minutes} AM`
                : `${hours}:${minutes} AM`;
        const timeResponses = isHindi
          ? [
              `बिल्कुल! ${displayTime} का time fix कर दिया। `,
              `ठीक है, ${displayTime} पर appointment है। `,
              `Perfect! ${displayTime} schedule कर लिया। `,
            ]
          : [
              `Perfect! I've set the time for ${displayTime}. `,
              `Great! ${displayTime} it is. `,
              `Done! Time is fixed for ${displayTime}. `,
            ];
        finalResponse =
          timeResponses[Math.floor(Math.random() * timeResponses.length)];
      } else if (
        previousState.patientName !== session.patientName &&
        session.patientName
      ) {
        const responses = isHindi
          ? [
              `बहुत अच्छा ${session.patientName}जी! `,
              `ठीक है ${session.patientName}जी, नोट कर लिया। `,
              `धन्यवाद ${session.patientName}जी! `,
            ]
          : [
              `Nice to meet you, ${session.patientName}! `,
              `Got it, ${session.patientName}. Thanks! `,
              `Perfect, ${session.patientName}. `,
            ];
        finalResponse = responses[Math.floor(Math.random() * responses.length)];
      } else if (
        previousState.patientAge !== session.patientAge &&
        session.patientAge
      ) {
        const responses = isHindi
          ? [
              `ठीक है, ${session.patientAge} साल। धन्यवाद! `,
              `नोट कर लिया, ${session.patientAge} साल। `,
              `अच्छा, ${session.patientAge} साल। `,
            ]
          : [
              `Got it, ${session.patientAge} years old. Thanks! `,
              `Perfect, ${session.patientAge} years. `,
              `Noted, ${session.patientAge} years. `,
            ];
        finalResponse = responses[Math.floor(Math.random() * responses.length)];
      } else if (
        previousState.patientPhone !== session.patientPhone &&
        session.patientPhone
      ) {
        const formattedPhone =
          session.patientPhone.length === 10
            ? `${session.patientPhone.slice(0, 5)} ${session.patientPhone.slice(5)}`
            : session.patientPhone;
        const responses = isHindi
          ? [
              `बिल्कुल, ${formattedPhone} नोट कर लिया। `,
              `ठीक है, फोन नंबर ${formattedPhone} लिख लिया। `,
              `धन्यवाद, ${formattedPhone} सेव कर दिया। `,
            ]
          : [
              `Perfect! I've saved ${formattedPhone}. `,
              `Got it! Your number ${formattedPhone} is noted. `,
              `Thanks! I've recorded ${formattedPhone}. `,
            ];
        finalResponse = responses[Math.floor(Math.random() * responses.length)];

        // Immediately check if all info is complete after phone extraction
        if (
          session.patientName &&
          session.patientAge &&
          session.patientPhone &&
          session.doctorId &&
          session.appointmentDate &&
          session.appointmentTime
        ) {
          session.state = "confirming";
          const doctor = this.findDoctorById(session.doctorId);
          const confirmationMessage = isHindi
            ? `पुष्टि करें:\n` +
              `डॉक्टर: ${doctor.name} (${session.department || "Specialist"})\n` +
              `मरीज: ${session.patientName}\n` +
              `उम्र: ${session.patientAge}\n` +
              `फोन: ${session.patientPhone}\n` +
              `तारीख: ${this.formatDateClearly(session.appointmentDate)}\n` +
              `समय: ${session.appointmentTime}\n` +
              `क्या आप बुक करना चाहते हैं? (हां/नहीं)`
            : `Please confirm your appointment:\n` +
              `Doctor: ${doctor.name} (${session.department || "Specialist"})\n` +
              `Patient: ${session.patientName}\n` +
              `Age: ${session.patientAge}\n` +
              `Phone: ${session.patientPhone}\n` +
              `Date: ${this.formatDateClearly(session.appointmentDate)}\n` +
              `Time: ${session.appointmentTime}\n` +
              `Do you want to book? (yes/no)`;

          const response = `${finalResponse}\n\n${confirmationMessage}`;
          session.conversationHistory.push({
            role: "assistant",
            content: response,
          });
          return response;
        }
      }

      // If both date and time extracted together
      if (
        previousState.appointmentDate !== session.appointmentDate &&
        previousState.appointmentTime !== session.appointmentTime &&
        session.appointmentDate &&
        session.appointmentTime
      ) {
        // Format time for display (17:00:00 -> 5:00 PM)
        const timeParts = session.appointmentTime.split(":");
        const hours = parseInt(timeParts[0]);
        const minutes = timeParts[1];
        const displayTime =
          hours > 12
            ? `${hours - 12}:${minutes} PM`
            : hours === 12
              ? `12:${minutes} PM`
              : hours === 0
                ? `12:${minutes} AM`
                : `${hours}:${minutes} AM`;
        const combinedResponses = isHindi
          ? [
              `बिल्कुल perfect! ${this.formatDateClearly(session.appointmentDate)} को ${displayTime} पर appointment fix हो गई। `,
              `ठीक है! ${this.formatDateClearly(session.appointmentDate)} को ${displayTime} schedule कर दिया है। `,
              `Great! ${this.formatDateClearly(session.appointmentDate)} को ${displayTime} पर आपकी appointment है। `,
            ]
          : [
              `Perfect! I've scheduled your appointment for ${this.formatDateClearly(session.appointmentDate)} at ${displayTime}. `,
              `Excellent! Your appointment is set for ${this.formatDateClearly(session.appointmentDate)} at ${displayTime}. `,
              `Great! I've booked you for ${this.formatDateClearly(session.appointmentDate)} at ${displayTime}. `,
            ];
        finalResponse =
          combinedResponses[
            Math.floor(Math.random() * combinedResponses.length)
          ];
      }
    }

    // Final check: If all information is complete, show confirmation instead of asking next question
    if (
      session.patientName &&
      session.patientAge &&
      session.patientPhone &&
      session.doctorId &&
      session.appointmentDate &&
      session.appointmentTime
    ) {
      session.state = "confirming";

      const doctor = this.findDoctorById(session.doctorId);
      const confirmationMessage = isHindi
        ? `पुष्टि करें:\n` +
          `डॉक्टर: ${doctor.name} (${session.department || "Specialist"})\n` +
          `मरीज: ${session.patientName}\n` +
          `उम्र: ${session.patientAge}\n` +
          `फोन: ${session.patientPhone}\n` +
          `तारीख: ${this.formatDateClearly(session.appointmentDate)}\n` +
          `समय: ${session.appointmentTime}\n` +
          `क्या आप बुक करना चाहते हैं? (हां/नहीं)`
        : `Please confirm your appointment:\n` +
          `Doctor: ${doctor.name} (${session.department || "Specialist"})\n` +
          `Patient: ${session.patientName}\n` +
          `Age: ${session.patientAge}\n` +
          `Phone: ${session.patientPhone}\n` +
          `Date: ${this.formatDateClearly(session.appointmentDate)}\n` +
          `Time: ${session.appointmentTime}\n` +
          `Do you want to book? (yes/no)`;

      const response = finalResponse
        ? `${finalResponse}\n\n${confirmationMessage}`
        : confirmationMessage;

      session.conversationHistory.push({
        role: "assistant",
        content: response,
      });
      return response;
    }

    finalResponse += question;
    session.lastAskedField = nextField;
    session.conversationHistory.push({
      role: "assistant",
      content: finalResponse,
    });
    return finalResponse;
  }

  /**
   * Process user query with AI and database
   */
  async processQuery(
    query: string,
    sessionId: string = "default"
  ): Promise<string> {
    // Check if this is a booking flow
    const session = this.getBookingSession(sessionId);

    // 1. Detect language (Hindi or English)
    const isHindi = this.detectHindi(query);
    const language = isHindi ? "Hindi" : "English";

    // Track preferred language in session (only set on first query or if not set)
    if (!session.preferredLanguage) {
      session.preferredLanguage = isHindi ? "hi" : "en";
      console.log(`🌐 User language detected: ${session.preferredLanguage}`);
    }

    // If in confirming state, handle confirmation
    if (session.state === "confirming") {
      const confirmationResponse = await this.confirmBooking(
        query,
        session,
        isHindi
      );
      session.conversationHistory.push({ role: "user", content: query });
      session.conversationHistory.push({
        role: "assistant",
        content: confirmationResponse,
      });
      return confirmationResponse;
    }

    // Check if booking was initiated or if this query has booking intent
    const hasBookingIntent = this.isBookingIntent(query);

    // Continue booking flow if:
    // 1. Booking intent detected in current query
    // 2. Booking was previously initiated
    // 3. Session has collected any booking-related data
    const hasCollectedData =
      session.patientName ||
      session.patientAge ||
      session.patientPhone ||
      session.doctorId ||
      session.department ||
      session.problem ||
      session.appointmentDate ||
      session.appointmentTime;

    if (
      hasBookingIntent ||
      session.bookingInitiated ||
      hasCollectedData ||
      session.state !== "collecting_info"
    ) {
      if (hasBookingIntent && !session.bookingInitiated) {
        session.bookingInitiated = true;
      }
      const bookingResponse = await this.processBookingFlow(
        query,
        sessionId,
        isHindi
      );
      return bookingResponse;
    }

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
    const vectorContext =
      vectorResults.length > 0
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
    // Check for Devanagari script (most reliable)
    const hindiPattern = /[\u0900-\u097F]/;
    if (hindiPattern.test(query)) {
      return true;
    }

    // Check for Hindi words using word boundaries to avoid false matches
    const hindiWords = [
      "hai",
      "kya",
      "kaise",
      "kab",
      "kitne",
      "mein",
      "ke",
      "ki",
      "aur",
      "ka",
      "ko",
      "se",
      "par",
      "toh",
      "yeh",
      "woh",
    ];

    const lowerQuery = query.toLowerCase();

    // Use word boundary matching to avoid false positives
    // e.g., "mein" should match "mein hu" but not "name is"
    return hindiWords.some((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "i");
      return regex.test(lowerQuery);
    });
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
