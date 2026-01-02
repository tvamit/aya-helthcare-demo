import { IsString, IsBoolean, IsNumber, IsEnum, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDoctorDto {
  @ApiProperty({ example: 'Dr. Rajesh Gupta' })
  @IsString()
  name: string;

  @ApiProperty({
    enum: [
      'Cardiologist',
      'Neurologist',
      'Orthopedic',
      'Pediatrician',
      'General Physician',
      'Dentist',
      'ENT',
      'Dermatologist',
    ],
  })
  @IsEnum([
    'Cardiologist',
    'Neurologist',
    'Orthopedic',
    'Pediatrician',
    'General Physician',
    'Dentist',
    'ENT',
    'Dermatologist',
  ])
  specialization: string;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @ApiProperty({ example: 1500 })
  @IsNumber()
  consultationFee: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  schedule?: {
    day: string;
    startTime: string;
    endTime: string;
  }[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  email?: string;
}
