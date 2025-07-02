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

@Entity('doctor_availabilities')
export class DoctorAvailability {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Doctor, (doctor) => doctor.availabilities, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'doctor_id' }) // Optional: ensures DB-level column
  doctor: Doctor;

  @Column({ type: 'date' })
  date: Date; // ✅ Make this a Date

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

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
