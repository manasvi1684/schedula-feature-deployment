import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  Unique,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Appointment } from './appointment.entity';
import { User } from './user.entity';

@Entity()
@Unique(['email'])
export class Patient {
  @PrimaryGeneratedColumn()
  patient_id: number;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column()
  email: string;

  @Column()
  phone_number: string;

  @Column()
  gender: string;

  @Column()
  dob: string;

  @Column()
  address: string;

  @Column()
  emergency_contact: string;

  @Column('text', { array: true, nullable: true })
  medical_history: string[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ default: 'patient' })
  role: 'patient';

  @OneToOne(() => User, (user) => user.patient, { cascade: true })
  @JoinColumn()
  user: User;

  @OneToMany(() => Appointment, (appointment) => appointment.patient)
  appointments: Appointment[];
}
