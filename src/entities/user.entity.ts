import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';

export type AuthProvider = 'local' | 'google';
export type UserRole = 'doctor' | 'patient';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  password: string | null;

  @Column({ type: 'text', nullable: true })
  refreshToken: string | null;

  @Column({
    type: 'enum',
    enum: ['local', 'google'],
    default: 'local',
  })
  provider: AuthProvider;

  @Column({
    type: 'enum',
    enum: ['doctor', 'patient'],
  })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Doctor, (doctor) => doctor.user)
  doctor: Doctor;

  @OneToOne(() => Patient, (patient) => patient.user)
  patient: Patient;
}
