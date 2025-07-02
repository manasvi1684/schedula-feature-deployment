import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Unique,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Appointment } from './appointment.entity';
import { TimeSlot } from './timeslot.entity';
import { User } from './user.entity';
import { DoctorAvailability } from './doctor_availability.entity';

@Entity()
@Unique(['email'])
export class Doctor {
  @PrimaryGeneratedColumn()
  doctor_id: number;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column()
  email: string;

  @Column()
  phone_number: string;

  @Column()
  specialization: string;

  @Column()
  experience_years: number;

  @Column()
  education: string;

  @Column()
  clinic_name: string;

  @Column()
  clinic_address: string;

  @Column('text', { array: true })
  available_days: string[];

  @Column({ default: 'doctor' })
  role: 'doctor';

  // --- NEW AND UPDATED SCHEDULING FIELDS ---

  @Column({
    type: 'enum',
    enum: ['stream', 'wave'],
    default: 'stream',
    comment: 'The scheduling strategy for this doctor',
  })
  schedule_type: 'stream' | 'wave';

  @Column({
    type: 'int',
    default: 30,
    comment: 'The duration of a single appointment slot in minutes (e.g., 15, 20, 30)',
  })
  slot_duration: number;

  @Column({
    type: 'int',
    default: 15,
    comment: 'The time allocated for a single patient consultation in minutes',
  })
  consulting_time: number;

    @Column({
    type: 'int',
    default: 3,
    comment: 'Maximum number of patients per slot in wave scheduling',
  })
  wave_limit: number;
  // --- END OF NEW FIELDS ---

  @OneToMany(() => TimeSlot, (slot) => slot.doctor)
  timeSlots: TimeSlot[];

  @OneToMany(() => Appointment, (appointment) => appointment.doctor)
  appointments: Appointment[];

  @OneToOne(() => User, (user) => user.doctor, { cascade: true })
  @JoinColumn()
  user: User;

  @OneToMany(() => DoctorAvailability, (availability) => availability.doctor)
  availabilities: DoctorAvailability[];
}