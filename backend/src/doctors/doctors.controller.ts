import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@ApiTags('doctors')
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new doctor' })
  @ApiResponse({ status: 201, description: 'Doctor created successfully' })
  create(@Body() createDoctorDto: CreateDoctorDto) {
    return this.doctorsService.create(createDoctorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all doctors with optional filters' })
  @ApiQuery({ name: 'available', required: false, type: Boolean })
  @ApiQuery({ name: 'specialization', required: false, type: String })
  async findAll(
    @Query('available') available?: string,
    @Query('specialization') specialization?: string,
  ) {
    const filters: any = {};
    if (available !== undefined) {
      filters.available = available === 'true';
    }
    if (specialization) {
      filters.specialization = specialization;
    }

    const doctors = await this.doctorsService.findAll(filters);
    return {
      success: true,
      count: doctors.length,
      data: doctors,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get doctor availability statistics' })
  async getStats() {
    const total = (await this.doctorsService.findAll({})).length;
    const available = await this.doctorsService.getAvailableCount();

    return {
      success: true,
      stats: {
        total,
        available,
        unavailable: total - available,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a doctor by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.doctorsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a doctor' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDoctorDto: UpdateDoctorDto) {
    return this.doctorsService.update(id, updateDoctorDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a doctor' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.doctorsService.remove(id);
    return { success: true, message: 'Doctor deleted successfully' };
  }
}
