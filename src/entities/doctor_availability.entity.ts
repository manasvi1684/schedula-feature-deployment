// src/entities/doctor_availability.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Doctor } from './doctor.entity';
import { TimeSlot } from './timeslot.entity';

// --- CHANGE 1: ADD THIS ENUM ---
export enum AvailabilityType {
  CUSTOM_DATE = 'custom_date',
  RECURRING = 'recurring',
}
// --- END CHANGE 1 ---

@Entity('doctor_availabilities')
export class DoctorAvailability {
  @PrimaryGeneratedColumn()
  id: number;

  // --- CHANGE 2: ADD THE NEW 'type' COLUMN ---
  @Column({
    type: 'enum',
    enum: AvailabilityType,
    default: AvailabilityType.CUSTOM_DATE,
  })
  type: AvailabilityType;
  // --- END CHANGE 2 ---

  @ManyToOne(() => Doctor, (doctor) => doctor.availabilities, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  // --- CHANGE 3: MAKE 'date' NULLABLE ---
  @Column({ type: 'date', nullable: true }) // Add nullable: true
  date: Date;
  // --- END CHANGE 3 ---

  // --- CHANGE 4: RENAME 'start_time' and 'end_time' FOR CLARITY ---
  @Column({ type: 'time' })
  consulting_start_time: string; // Renamed from start_time

  @Column({ type: 'time' })
  consulting_end_time: string; // Renamed from end_time
  // --- END CHANGE 4 ---

  // --- CHANGE 5: The 'weekdays' column is already nullable, which is perfect. No change needed here. ---
  @Column('text', { array: true, nullable: true })
  weekdays: string[];

  @Column()
  session: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => TimeSlot, (slot) => slot.availability, { cascade: true })
  timeSlots: TimeSlot[];
}