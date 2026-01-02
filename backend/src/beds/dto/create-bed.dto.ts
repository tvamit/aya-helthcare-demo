import { IsString, IsBoolean, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBedDto {
  @ApiProperty({ example: 'ICU-101' })
  @IsString()
  bedNumber: string;

  @ApiProperty({ enum: ['ICU', 'General', 'Emergency', 'Private', 'Semi-Private', 'Pediatric'] })
  @IsEnum(['ICU', 'General', 'Emergency', 'Private', 'Semi-Private', 'Pediatric'])
  ward: string;

  @ApiProperty({ enum: ['ICU', 'Ventilator', 'Oxygen', 'Regular'] })
  @IsEnum(['ICU', 'Ventilator', 'Oxygen', 'Regular'])
  bedType: string;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  patientName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  floor: number;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  pricePerDay: number;
}
