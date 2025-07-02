import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { Doctor } from 'src/entities/doctor.entity';
import { DoctorAvailability } from 'src/entities/doctor_availability.entity';
import { TimeSlot } from 'src/entities/timeslot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor, DoctorAvailability, TimeSlot])],
  controllers: [DoctorController],
  providers: [DoctorService],
})
export class DoctorModule {}
