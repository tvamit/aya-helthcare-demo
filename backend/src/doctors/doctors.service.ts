import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Doctor } from "../database/entities/doctor.entity";
import { CreateDoctorDto } from "./dto/create-doctor.dto";
import { UpdateDoctorDto } from "./dto/update-doctor.dto";

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>
  ) {}

  async create(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    const doctor = this.doctorsRepository.create(createDoctorDto);
    return await this.doctorsRepository.save(doctor);
  }

  async findAll(filters?: {
    available?: boolean;
    specialization?: string;
  }): Promise<Doctor[]> {
    const query = this.doctorsRepository.createQueryBuilder("doctor");

    if (filters?.available !== undefined) {
      query.andWhere("doctor.available = :available", {
        available: filters.available,
      });
    }

    if (filters?.specialization) {
      query.andWhere("doctor.specialization = :specialization", {
        specialization: filters.specialization,
      });
    }

    return await query.orderBy("doctor.name", "ASC").getMany();
  }

  async findOne(id: number): Promise<Doctor> {
    const doctor = await this.doctorsRepository.findOne({
      where: { id },
      relations: ["appointments"],
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }
    return doctor;
  }

  async update(id: number, updateDoctorDto: UpdateDoctorDto): Promise<Doctor> {
    const doctor = await this.findOne(id);
    Object.assign(doctor, updateDoctorDto);
    return await this.doctorsRepository.save(doctor);
  }

  async remove(id: number): Promise<void> {
    const doctor = await this.findOne(id);
    await this.doctorsRepository.remove(doctor);
  }

  async getAvailableCount(specialization?: string): Promise<number> {
    const query = this.doctorsRepository
      .createQueryBuilder("doctor")
      .where("doctor.available = :available", { available: true });

    if (specialization) {
      query.andWhere("doctor.specialization = :specialization", {
        specialization,
      });
    }

    return await query.getCount();
  }

  // doctors.service.ts
  async getStats() {
    return {
      available: await this.doctorsRepository.count({
        where: { available: true },
      }),
      total: await this.doctorsRepository.count(),
    };
  }

  /**
   * Find doctors by specialization with availability info
   */
  async findBySpecialization(specialization: string): Promise<Doctor[]> {
    return await this.findAll({ specialization, available: true });
  }

  /**
   * Find doctor by name (case-insensitive, partial match)
   */
  async findDoctorByName(name: string): Promise<Doctor | null> {
    // Remove "Dr.", "Dr", "Doctor" prefixes and trim
    const cleanName = name.replace(/^(dr\.?\s*|doctor\s*)/i, '').trim();
    
    // Search for doctors with matching names (case-insensitive, partial match)
    const doctors = await this.doctorsRepository
      .createQueryBuilder('doctor')
      .where('LOWER(doctor.name) LIKE LOWER(:name)', { name: `%${cleanName}%` })
      .andWhere('doctor.available = :available', { available: true })
      .getMany();

    // Return first match if found
    return doctors.length > 0 ? doctors[0] : null;
  }

  /**
   * Suggest doctor based on problem/symptom
   */
  async suggestDoctorByProblem(problem: string): Promise<{
    specialization: string;
    doctors: Doctor[];
  }> {
    const lowerProblem = problem.toLowerCase();
    const specializationMap: { [key: string]: string } = {
      chest: 'Cardiologist',
      heart: 'Cardiologist',
      दिल: 'Cardiologist',
      सीने: 'Cardiologist',
      head: 'Neurologist',
      headache: 'Neurologist',
      सिरदर्द: 'Neurologist',
      brain: 'Neurologist',
      bone: 'Orthopedic',
      fracture: 'Orthopedic',
      joint: 'Orthopedic',
      child: 'Pediatrician',
      baby: 'Pediatrician',
      बच्चा: 'Pediatrician',
      tooth: 'Dentist',
      dental: 'Dentist',
      दांत: 'Dentist',
      ear: 'ENT',
      nose: 'ENT',
      throat: 'ENT',
      skin: 'Dermatologist',
      rash: 'Dermatologist',
      त्वचा: 'Dermatologist',
    };

    let suggestedSpecialization = 'General Physician'; // Default

    for (const [keyword, specialization] of Object.entries(specializationMap)) {
      if (lowerProblem.includes(keyword)) {
        suggestedSpecialization = specialization;
        break;
      }
    }

    const doctors = await this.findBySpecialization(suggestedSpecialization);
    
    return {
      specialization: suggestedSpecialization,
      doctors: doctors.length > 0 ? doctors : await this.findAll({ available: true }),
    };
  }
}
