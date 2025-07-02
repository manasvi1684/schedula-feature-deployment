// src/appointment/appointment.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { Appointment } from 'src/entities/appointment.entity';
import { TimeSlot } from 'src/entities/timeslot.entity';
import { Patient } from 'src/entities/patient.entity';
import { Doctor } from 'src/entities/doctor.entity';
// Note: We don't need to import Doctor here because it's available via the TimeSlot relation.

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      TimeSlot,
      Patient,
      Doctor
    ]),
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService],
})
export class AppointmentModule {}