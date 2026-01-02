import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Bed } from "../database/entities/bed.entity";
import { CreateBedDto } from "./dto/create-bed.dto";
import { UpdateBedDto } from "./dto/update-bed.dto";

@Injectable()
export class BedsService {
  constructor(
    @InjectRepository(Bed)
    private bedsRepository: Repository<Bed>
  ) {}

  async create(createBedDto: CreateBedDto): Promise<Bed> {
    const bed = this.bedsRepository.create(createBedDto);
    return await this.bedsRepository.save(bed);
  }

  async findAll(filters?: {
    available?: boolean;
    ward?: string;
  }): Promise<Bed[]> {
    const query = this.bedsRepository.createQueryBuilder("bed");

    if (filters?.available !== undefined) {
      query.andWhere("bed.available = :available", {
        available: filters.available,
      });
    }

    if (filters?.ward) {
      query.andWhere("bed.ward = :ward", { ward: filters.ward });
    }

    return await query.orderBy("bed.bedNumber", "ASC").getMany();
  }

  async findOne(id: number): Promise<Bed> {
    const bed = await this.bedsRepository.findOne({ where: { id } });
    if (!bed) {
      throw new NotFoundException(`Bed with ID ${id} not found`);
    }
    return bed;
  }

  async update(id: number, updateBedDto: UpdateBedDto): Promise<Bed> {
    const bed = await this.findOne(id);
    Object.assign(bed, updateBedDto);
    return await this.bedsRepository.save(bed);
  }

  async remove(id: number): Promise<void> {
    const bed = await this.findOne(id);
    await this.bedsRepository.remove(bed);
  }

  async getAvailableCount(ward?: string): Promise<number> {
    const query = this.bedsRepository
      .createQueryBuilder("bed")
      .where("bed.available = :available", { available: true });

    if (ward) {
      query.andWhere("bed.ward = :ward", { ward });
    }

    return await query.getCount();
  }

  async getStats() {
    const [icuCount, generalCount, emergencyCount, totalCount] =
      await Promise.all([
        this.bedsRepository.count({ where: { ward: "ICU", available: true } }),
        this.bedsRepository.count({
          where: { ward: "General", available: true },
        }),
        this.bedsRepository.count({
          where: { ward: "Emergency", available: true },
        }),
        this.bedsRepository.count({ where: { available: true } }),
      ]);

    return {
      icu: icuCount,
      general: generalCount,
      emergency: emergencyCount,
      total: totalCount,
    };
  }
}
