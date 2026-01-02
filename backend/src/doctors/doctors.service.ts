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
}
