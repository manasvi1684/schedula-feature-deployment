import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Doctor } from './doctor.entity';
import { DoctorAvailability } from './doctor_availability.entity';

@Entity('doctor_time_slots')
export class TimeSlot {
  @PrimaryGeneratedColumn()
  slot_id: number;

  @ManyToOne(() => Doctor, (doctor) => doctor.timeSlots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @ManyToOne(() => DoctorAvailability, (availability) => availability.timeSlots, {
    onDelete: 'CASCADE',
    nullable: true
  })
  @JoinColumn({ name: 'availability_id' })
  availability: DoctorAvailability;

  @Column({ type: 'date',nullable:true })
  date: Date;

  @Column()
  day_of_week: string;

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  @Column({ default: true })
  is_available: boolean;
  
  // --- NEW FIELDS FOR WAVE SCHEDULING ---
  
  @Column({
    type: 'int',
    default: 0,
    comment: 'The current number of patients booked for this slot (for wave scheduling)',
  })
  booked_count: number;
  
  @Column({
    type: 'int',
    default: 1,
    comment: 'The maximum number of patients that can book this slot',
  })
  patient_limit: number;
  
  // --- END OF NEW FIELDS ---

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}