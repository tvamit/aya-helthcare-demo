import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../backend/.env') });

// Import models
const BedSchema = new mongoose.Schema({
    bedNumber: String,
    ward: String,
    bedType: String,
    available: Boolean,
    patientName: String,
    patientId: String,
    admissionDate: Date,
    floor: Number,
    pricePerDay: Number
}, { timestamps: true });

const DoctorSchema = new mongoose.Schema({
    name: String,
    specialization: String,
    available: Boolean,
    consultationFee: Number,
    schedule: Array,
    phone: String,
    email: String
}, { timestamps: true });

const Bed = mongoose.model('Bed', BedSchema);
const Doctor = mongoose.model('Doctor', DoctorSchema);

// Sample data
const beds = [
    // ICU Beds
    { bedNumber: 'ICU-101', ward: 'ICU', bedType: 'Ventilator', available: true, floor: 1, pricePerDay: 5000 },
    { bedNumber: 'ICU-102', ward: 'ICU', bedType: 'Ventilator', available: true, floor: 1, pricePerDay: 5000 },
    { bedNumber: 'ICU-103', ward: 'ICU', bedType: 'ICU', available: false, floor: 1, pricePerDay: 4000, patientName: 'Rajesh Kumar', patientId: 'P001' },
    { bedNumber: 'ICU-104', ward: 'ICU', bedType: 'ICU', available: true, floor: 1, pricePerDay: 4000 },

    // General Beds
    { bedNumber: 'GEN-201', ward: 'General', bedType: 'Regular', available: true, floor: 2, pricePerDay: 1500 },
    { bedNumber: 'GEN-202', ward: 'General', bedType: 'Regular', available: true, floor: 2, pricePerDay: 1500 },
    { bedNumber: 'GEN-203', ward: 'General', bedType: 'Oxygen', available: true, floor: 2, pricePerDay: 2000 },
    { bedNumber: 'GEN-204', ward: 'General', bedType: 'Regular', available: false, floor: 2, pricePerDay: 1500, patientName: 'Priya Sharma', patientId: 'P002' },
    { bedNumber: 'GEN-205', ward: 'General', bedType: 'Regular', available: true, floor: 2, pricePerDay: 1500 },

    // Private Beds
    { bedNumber: 'PVT-301', ward: 'Private', bedType: 'Regular', available: true, floor: 3, pricePerDay: 3500 },
    { bedNumber: 'PVT-302', ward: 'Private', bedType: 'Oxygen', available: true, floor: 3, pricePerDay: 4000 },
    { bedNumber: 'PVT-303', ward: 'Private', bedType: 'Regular', available: false, floor: 3, pricePerDay: 3500, patientName: 'Amit Patel', patientId: 'P003' },

    // Emergency Beds
    { bedNumber: 'EMG-001', ward: 'Emergency', bedType: 'Regular', available: true, floor: 0, pricePerDay: 2500 },
    { bedNumber: 'EMG-002', ward: 'Emergency', bedType: 'Oxygen', available: true, floor: 0, pricePerDay: 3000 },
    { bedNumber: 'EMG-003', ward: 'Emergency', bedType: 'Regular', available: true, floor: 0, pricePerDay: 2500 },
];

const doctors = [
    {
        name: 'Dr. Rajesh Gupta',
        specialization: 'Cardiologist',
        available: true,
        consultationFee: 1500,
        schedule: [
            { day: 'Monday', startTime: '09:00', endTime: '17:00' },
            { day: 'Wednesday', startTime: '09:00', endTime: '17:00' },
            { day: 'Friday', startTime: '09:00', endTime: '17:00' }
        ],
        phone: '+91-9876543210',
        email: 'rajesh.gupta@hospital.com'
    },
    {
        name: 'Dr. Priya Sharma',
        specialization: 'Neurologist',
        available: true,
        consultationFee: 2000,
        schedule: [
            { day: 'Tuesday', startTime: '10:00', endTime: '18:00' },
            { day: 'Thursday', startTime: '10:00', endTime: '18:00' },
            { day: 'Saturday', startTime: '10:00', endTime: '14:00' }
        ],
        phone: '+91-9876543211',
        email: 'priya.sharma@hospital.com'
    },
    {
        name: 'Dr. Amit Patel',
        specialization: 'Orthopedic',
        available: true,
        consultationFee: 1200,
        schedule: [
            { day: 'Monday', startTime: '08:00', endTime: '16:00' },
            { day: 'Tuesday', startTime: '08:00', endTime: '16:00' },
            { day: 'Thursday', startTime: '08:00', endTime: '16:00' }
        ],
        phone: '+91-9876543212',
        email: 'amit.patel@hospital.com'
    },
    {
        name: 'Dr. Sunita Rao',
        specialization: 'Pediatrician',
        available: true,
        consultationFee: 1000,
        schedule: [
            { day: 'Monday', startTime: '11:00', endTime: '19:00' },
            { day: 'Wednesday', startTime: '11:00', endTime: '19:00' },
            { day: 'Friday', startTime: '11:00', endTime: '19:00' }
        ],
        phone: '+91-9876543213',
        email: 'sunita.rao@hospital.com'
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
            { day: 'Friday', startTime: '09:00', endTime: '21:00' }
        ],
        phone: '+91-9876543214',
        email: 'vikram.singh@hospital.com'
    }
];

// Seed function
async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_ai');
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await Bed.deleteMany({});
        await Doctor.deleteMany({});
        console.log('🗑️  Cleared existing data');

        // Insert new data
        await Bed.insertMany(beds);
        console.log(`✅ Inserted ${beds.length} beds`);

        await Doctor.insertMany(doctors);
        console.log(`✅ Inserted ${doctors.length} doctors`);

        console.log('\n✅ Database seeded successfully!');
        console.log('\nStatistics:');
        console.log(`- Total Beds: ${beds.length}`);
        console.log(`- Available Beds: ${beds.filter(b => b.available).length}`);
        console.log(`- Total Doctors: ${doctors.length}`);
        console.log(`- Available Doctors: ${doctors.filter(d => d.available).length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

// Run seeder
seedDatabase();
