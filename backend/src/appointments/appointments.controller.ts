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
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all appointments with optional filters' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'doctorId', required: false, type: Number })
  async findAll(@Query('status') status?: string, @Query('doctorId') doctorId?: string) {
    const filters: any = {};
    if (status) {
      filters.status = status;
    }
    if (doctorId) {
      filters.doctorId = parseInt(doctorId);
    }

    const appointments = await this.appointmentsService.findAll(filters);
    return {
      success: true,
      count: appointments.length,
      data: appointments,
    };
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming scheduled appointments' })
  async getUpcoming() {
    const appointments = await this.appointmentsService.getUpcoming();
    return {
      success: true,
      count: appointments.length,
      data: appointments,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an appointment by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an appointment' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an appointment' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.appointmentsService.remove(id);
    return { success: true, message: 'Appointment deleted successfully' };
  }
}
