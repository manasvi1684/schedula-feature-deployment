import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './src/entities/user.entity'; 
import { Doctor } from './src/entities/doctor.entity';
import { Patient } from './src/entities/patient.entity';
import { Appointment } from './src/entities/appointment.entity';
import { TimeSlot } from './src/entities/timeslot.entity';
import * as dotenv from 'dotenv';
import { DoctorAvailability } from 'src/entities/doctor_availability.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: true,
  entities: [Doctor, Patient, Appointment, TimeSlot,User,DoctorAvailability],
  migrations: ['src/migrations/*.ts'],
});
