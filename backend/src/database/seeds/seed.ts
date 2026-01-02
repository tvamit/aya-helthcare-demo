import { DataSource } from 'typeorm';
import { Bed } from '../entities/bed.entity';
import { Doctor } from '../entities/doctor.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'hospital_ai',
  entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
  synchronize: true,
});

// Sample bed data
const beds: Partial<Bed>[] = [
  // ICU Beds
  {
    bedNumber: 'ICU-101',
    ward: 'ICU',
    bedType: 'Ventilator',
    available: true,
    floor: 1,
    pricePerDay: 5000,
  },
  {
    bedNumber: 'ICU-102',
    ward: 'ICU',
    bedType: 'Ventilator',
    available: true,
    floor: 1,
    pricePerDay: 5000,
  },
  {
    bedNumber: 'ICU-103',
    ward: 'ICU',
    bedType: 'ICU',
    available: false,
    floor: 1,
    pricePerDay: 4000,
    patientName: 'Rajesh Kumar',
    patientId: 'P001',
  },
  {
    bedNumber: 'ICU-104',
    ward: 'ICU',
    bedType: 'ICU',
    available: true,
    floor: 1,
    pricePerDay: 4000,
  },

  // General Beds
  {
    bedNumber: 'GEN-201',
    ward: 'General',
    bedType: 'Regular',
    available: true,
    floor: 2,
    pricePerDay: 1500,
  },
  {
    bedNumber: 'GEN-202',
    ward: 'General',
    bedType: 'Regular',
    available: true,
    floor: 2,
    pricePerDay: 1500,
  },
  {
    bedNumber: 'GEN-203',
    ward: 'General',
    bedType: 'Oxygen',
    available: true,
    floor: 2,
    pricePerDay: 2000,
  },
  {
    bedNumber: 'GEN-204',
    ward: 'General',
    bedType: 'Regular',
    available: false,
    floor: 2,
    pricePerDay: 1500,
    patientName: 'Priya Sharma',
    patientId: 'P002',
  },
  {
    bedNumber: 'GEN-205',
    ward: 'General',
    bedType: 'Regular',
    available: true,
    floor: 2,
    pricePerDay: 1500,
  },

  // Private Beds
  {
    bedNumber: 'PVT-301',
    ward: 'Private',
    bedType: 'Regular',
    available: true,
    floor: 3,
    pricePerDay: 3500,
  },
  {
    bedNumber: 'PVT-302',
    ward: 'Private',
    bedType: 'Oxygen',
    available: true,
    floor: 3,
    pricePerDay: 4000,
  },
  {
    bedNumber: 'PVT-303',
    ward: 'Private',
    bedType: 'Regular',
    available: false,
    floor: 3,
    pricePerDay: 3500,
    patientName: 'Amit Patel',
    patientId: 'P003',
  },

  // Emergency Beds
  {
    bedNumber: 'EMG-001',
    ward: 'Emergency',
    bedType: 'Regular',
    available: true,
    floor: 0,
    pricePerDay: 2500,
  },
  {
    bedNumber: 'EMG-002',
    ward: 'Emergency',
    bedType: 'Oxygen',
    available: true,
    floor: 0,
    pricePerDay: 3000,
  },
  {
    bedNumber: 'EMG-003',
    ward: 'Emergency',
    bedType: 'Regular',
    available: true,
    floor: 0,
    pricePerDay: 2500,
  },
];

// Sample doctor data
const doctors: Partial<Doctor>[] = [
  {
    name: 'Dr. Rajesh Gupta',
    specialization: 'Cardiologist',
    available: true,
    consultationFee: 1500,
    schedule: [
      { day: 'Monday', startTime: '09:00', endTime: '17:00' },
      { day: 'Wednesday', startTime: '09:00', endTime: '17:00' },
      { day: 'Friday', startTime: '09:00', endTime: '17:00' },
    ],
    phone: '+91-9876543210',
    email: 'rajesh.gupta@hospital.com',
  },
  {
    name: 'Dr. Priya Sharma',
    specialization: 'Neurologist',
    available: true,
    consultationFee: 2000,
    schedule: [
      { day: 'Tuesday', startTime: '10:00', endTime: '18:00' },
      { day: 'Thursday', startTime: '10:00', endTime: '18:00' },
      { day: 'Saturday', startTime: '10:00', endTime: '14:00' },
    ],
    phone: '+91-9876543211',
    email: 'priya.sharma@hospital.com',
  },
  {
    name: 'Dr. Amit Patel',
    specialization: 'Orthopedic',
    available: true,
    consultationFee: 1200,
    schedule: [
      { day: 'Monday', startTime: '08:00', endTime: '16:00' },
      { day: 'Tuesday', startTime: '08:00', endTime: '16:00' },
      { day: 'Thursday', startTime: '08:00', endTime: '16:00' },
    ],
    phone: '+91-9876543212',
    email: 'amit.patel@hospital.com',
  },
  {
    name: 'Dr. Sunita Rao',
    specialization: 'Pediatrician',
    available: true,
    consultationFee: 1000,
    schedule: [
      { day: 'Monday', startTime: '11:00', endTime: '19:00' },
      { day: 'Wednesday', startTime: '11:00', endTime: '19:00' },
      { day: 'Friday', startTime: '11:00', endTime: '19:00' },
    ],
    phone: '+91-9876543213',
    email: 'sunita.rao@hospital.com',
  },
  {
    name: 'Dr. Vikram Singh',
    specialization: 'General Physician',
    available: true,
    consultationFee: 800,
    schedule: [
      { day: 'Monday', startTime: '09:00', endTime: '21:00' },
      { day: 'Tuesday', startTime: '09:00', endTime: '21:00' },
      { day: 'Wednesday', startTime: '09:00', endTime: '21:00' },
      { day: 'Thursday', startTime: '09:00', endTime: '21:00' },
      { day: 'Friday', startTime: '09:00', endTime: '21:00' },
    ],
    phone: '+91-9876543214',
    email: 'vikram.singh@hospital.com',
  },
];

async function seed() {
  try {
    // Initialize data source
    await AppDataSource.initialize();
    console.log('✅ Connected to PostgreSQL');

    const bedRepository = AppDataSource.getRepository(Bed);
    const doctorRepository = AppDataSource.getRepository(Doctor);

    // Clear existing data (handle foreign keys)
    await AppDataSource.query('TRUNCATE TABLE appointments CASCADE');
    await AppDataSource.query('TRUNCATE TABLE beds CASCADE');
    await AppDataSource.query('TRUNCATE TABLE doctors CASCADE');
    console.log('🗑️  Cleared existing data');

    // Insert beds
    await bedRepository.save(beds);
    console.log(`✅ Inserted ${beds.length} beds`);

    // Insert doctors
    await doctorRepository.save(doctors);
    console.log(`✅ Inserted ${doctors.length} doctors`);

    // Statistics
    const availableBeds = beds.filter((b) => b.available).length;
    const availableDoctors = doctors.filter((d) => d.available).length;

    console.log('\n✅ Database seeded successfully!');
    console.log('\nStatistics:');
    console.log(`- Total Beds: ${beds.length}`);
    console.log(`- Available Beds: ${availableBeds}`);
    console.log(`- Total Doctors: ${doctors.length}`);
    console.log(`- Available Doctors: ${availableDoctors}`);

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeder
seed();
