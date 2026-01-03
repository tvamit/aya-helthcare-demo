import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../database/entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { DoctorsService } from '../doctors/doctors.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @Inject(forwardRef(() => DoctorsService))
    private doctorsService: DoctorsService,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    const appointment = this.appointmentsRepository.create(createAppointmentDto);
    return await this.appointmentsRepository.save(appointment);
  }

  async findAll(filters?: { status?: string; doctorId?: number }): Promise<Appointment[]> {
    const query = this.appointmentsRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.doctor', 'doctor');

    if (filters?.status) {
      query.andWhere('appointment.status = :status', { status: filters.status });
    }

    if (filters?.doctorId) {
      query.andWhere('appointment.doctorId = :doctorId', { doctorId: filters.doctorId });
    }

    return await query
      .orderBy('appointment.appointmentDate', 'ASC')
      .addOrderBy('appointment.appointmentTime', 'ASC')
      .getMany();
  }

  async findOne(id: number): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['doctor'],
    });
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }
    return appointment;
  }

  async update(id: number, updateAppointmentDto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.findOne(id);
    Object.assign(appointment, updateAppointmentDto);
    return await this.appointmentsRepository.save(appointment);
  }

  async remove(id: number): Promise<void> {
    const appointment = await this.findOne(id);
    await this.appointmentsRepository.remove(appointment);
  }

  async getUpcoming(): Promise<Appointment[]> {
    const today = new Date();
    return await this.appointmentsRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .where('appointment.appointmentDate >= :today', { today })
      .andWhere('appointment.status = :status', { status: 'Scheduled' })
      .orderBy('appointment.appointmentDate', 'ASC')
      .addOrderBy('appointment.appointmentTime', 'ASC')
      .getMany();
  }

  /**
   * Check if doctor is available at specific date and time
   */
  async checkDoctorAvailability(
    doctorId: number,
    date: Date,
    time: string,
  ): Promise<{ available: boolean; reason?: string }> {
    const doctor = await this.doctorsService.findOne(doctorId);
    
    if (!doctor.available) {
      return { available: false, reason: 'Doctor is currently unavailable' };
    }

    // Check doctor's schedule
    const appointmentDate = new Date(date);
    const dayName = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });
    const doctorSchedule = doctor.schedule || [];
    
    const daySchedule = doctorSchedule.find(s => s.day === dayName);
    if (!daySchedule) {
      return { available: false, reason: 'Doctor does not work on this day' };
    }

    // Check if time is within doctor's working hours
    const requestedTime = time.split(':').map(Number);
    const requestedMinutes = requestedTime[0] * 60 + (requestedTime[1] || 0);
    
    const [startHours, startMinutes] = daySchedule.startTime.split(':').map(Number);
    const [endHours, endMinutes] = daySchedule.endTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    if (requestedMinutes < startTotalMinutes || requestedMinutes >= endTotalMinutes) {
      return { 
        available: false, 
        reason: `Doctor is available from ${daySchedule.startTime} to ${daySchedule.endTime}` 
      };
    }

    // Check for existing appointments at same time
    const existingAppointment = await this.appointmentsRepository.findOne({
      where: {
        doctorId,
        appointmentDate: date,
        appointmentTime: time,
        status: 'Scheduled',
      },
    });

    if (existingAppointment) {
      return { available: false, reason: 'Time slot is already booked' };
    }

    return { available: true };
  }

  /**
   * Find alternative available time slots for a doctor
   */
  async findAlternativeTimes(
    doctorId: number,
    date: Date,
    preferredTime?: string,
  ): Promise<string[]> {
    const doctor = await this.doctorsService.findOne(doctorId);
    const appointmentDate = new Date(date);
    const dayName = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });
    const doctorSchedule = doctor.schedule || [];
    
    const daySchedule = doctorSchedule.find(s => s.day === dayName);
    if (!daySchedule) {
      return [];
    }

    // Get all existing appointments for this doctor on this date
    const existingAppointments = await this.appointmentsRepository.find({
      where: {
        doctorId,
        appointmentDate: date,
        status: 'Scheduled',
      },
    });

    const bookedTimes = new Set(
      existingAppointments.map(apt => apt.appointmentTime)
    );

    // Generate available time slots (every 30 minutes)
    const availableSlots: string[] = [];
    const [startHours, startMinutes] = daySchedule.startTime.split(':').map(Number);
    const [endHours, endMinutes] = daySchedule.endTime.split(':').map(Number);
    
    let currentHours = startHours;
    let currentMinutes = startMinutes;

    while (currentHours < endHours || (currentHours === endHours && currentMinutes < endMinutes)) {
      const timeSlot = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}:00`;
      
      if (!bookedTimes.has(timeSlot)) {
        availableSlots.push(timeSlot);
      }

      // Add 30 minutes
      currentMinutes += 30;
      if (currentMinutes >= 60) {
        currentMinutes = 0;
        currentHours++;
      }
    }

    // If preferred time exists, prioritize slots near it
    if (preferredTime && availableSlots.length > 0) {
      const preferred = preferredTime.split(':').map(Number);
      const preferredMinutes = preferred[0] * 60 + (preferred[1] || 0);
      
      availableSlots.sort((a, b) => {
        const aTime = a.split(':').map(Number);
        const aMinutes = aTime[0] * 60 + (aTime[1] || 0);
        const bTime = b.split(':').map(Number);
        const bMinutes = bTime[0] * 60 + (bTime[1] || 0);
        
        return Math.abs(aMinutes - preferredMinutes) - Math.abs(bMinutes - preferredMinutes);
      });
    }

    return availableSlots.slice(0, 5); // Return top 5 alternatives
  }

  /**
   * Find alternative doctors in same or related specialization
   */
  async findAlternativeDoctors(
    originalDoctorId: number,
    date: Date,
    time: string,
  ): Promise<any[]> {
    const originalDoctor = await this.doctorsService.findOne(originalDoctorId);
    
    // Find other available doctors in same specialization
    const alternativeDoctors = await this.doctorsService.findAll({
      specialization: originalDoctor.specialization,
      available: true,
    });

    const availableAlternatives = [];

    for (const doctor of alternativeDoctors) {
      if (doctor.id === originalDoctorId) continue;
      
      const availability = await this.checkDoctorAvailability(
        doctor.id,
        date,
        time,
      );

      if (availability.available) {
        availableAlternatives.push({
          doctor,
          availableTime: time,
        });
      }
    }

    return availableAlternatives.slice(0, 3); // Return top 3 alternatives
  }
}
