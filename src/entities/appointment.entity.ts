// src/entities/appointment.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';
import { TimeSlot } from './timeslot.entity'; // <-- IMPORTANT: Import TimeSlot

@Entity('appointments') // It's good practice to name the table explicitly
export class Appointment {
  @PrimaryGeneratedColumn()
  appointment_id: number;

  @ManyToOne(() => Doctor, (doctor) => doctor.appointments, { eager: true })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @ManyToOne(() => Patient, (patient) => patient.appointments, { eager: true })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  // --- REFACTORED SECTION ---
  // We are replacing the old string fields with a direct link to the TimeSlot
  @ManyToOne(() => TimeSlot)
  @JoinColumn({ name: 'slot_id' })
  time_slot: TimeSlot;

  @Column({ type: 'date', comment: 'The date of the appointment' })
  date: Date;

  @Column({ comment: 'The session of the appointment, e.g., morning or evening' })
  session: string;

  @Column({ type: 'time', comment: 'The specific reporting time for the patient' })
  reporting_time: string;

  // --- END REFACTORED SECTION ---

  @Column({
    type: 'enum',
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled',
  })
  status: string; // Renamed from appointment_status for clarity

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string; // Notes from the doctor, for example

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}