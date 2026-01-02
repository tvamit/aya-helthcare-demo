import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('beds')
export class Bed {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  bedNumber: string;

  @Column({
    type: 'enum',
    enum: ['ICU', 'General', 'Emergency', 'Private', 'Semi-Private', 'Pediatric'],
  })
  ward: string;

  @Column({
    type: 'enum',
    enum: ['ICU', 'Ventilator', 'Oxygen', 'Regular'],
  })
  bedType: string;

  @Column({ default: true })
  available: boolean;

  @Column({ nullable: true, length: 100 })
  patientName: string;

  @Column({ nullable: true, length: 50 })
  patientId: string;

  @Column({ type: 'timestamp', nullable: true })
  admissionDate: Date;

  @Column({ type: 'int' })
  floor: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  pricePerDay: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
