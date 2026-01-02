import { IsString, IsNumber, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'Rahul Kumar' })
  @IsString()
  patientName: string;

  @ApiProperty({ example: '+91-9876543210' })
  @IsString()
  patientPhone: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  doctorId: number;

  @ApiProperty({ example: '2026-01-15' })
  @IsDateString()
  appointmentDate: string;

  @ApiProperty({ example: '10:00:00' })
  @IsString()
  appointmentTime: string;

  @ApiProperty({ enum: ['Scheduled', 'Completed', 'Cancelled', 'No-Show'], default: 'Scheduled' })
  @IsOptional()
  @IsEnum(['Scheduled', 'Completed', 'Cancelled', 'No-Show'])
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
