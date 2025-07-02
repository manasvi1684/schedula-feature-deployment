// src/doctor/doctor.service.ts

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from 'src/entities/doctor.entity';
import { DoctorAvailability } from 'src/entities/doctor_availability.entity';
import { TimeSlot } from 'src/entities/timeslot.entity';
import { SetAvailabilityDto } from 'src/auth/dto/SetAvailabilityDto';
import { PaginationDto } from 'src/auth/dto/PaginationDto';
import { UpdateScheduleConfigDto } from './dto/update-schedule-config.dto';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(DoctorAvailability)
    private availabilityRepo: Repository<DoctorAvailability>,
    @InjectRepository(TimeSlot)
    private timeSlotRepo: Repository<TimeSlot>,
  ) {}

  // ... (getAllDoctors, getDoctorById, updateScheduleConfig are fine) ...
  getAllDoctors(name?: string, specialization?: string) {
    const qb = this.doctorRepository.createQueryBuilder('doctor');

    if (name) {
      qb.andWhere(
        "LOWER(doctor.first_name || ' ' || doctor.last_name) ILIKE :name",
        { name: `%${name.toLowerCase()}%` },
      );
    }

    if (specialization) {
      qb.andWhere('LOWER(doctor.specialization) ILIKE :specialization', {
        specialization: `%${specialization.toLowerCase()}%`,
      });
    }

    return qb.getMany();
  }

  getDoctorById(id: number) {
    return this.doctorRepository.findOne({
      where: { doctor_id: id },
      relations: ['user', 'appointments', 'timeSlots'],
    });
  }
  
  async updateScheduleConfig(
    userUuid: string,
    dto: UpdateScheduleConfigDto,
  ) {
    const doctor = await this.doctorRepository.findOne({
      where: { user: { id: userUuid } },
    });

    if (!doctor) {
      throw new NotFoundException(
        'Doctor profile not found for the logged-in user.',
      );
    }
    
    Object.assign(doctor, dto);
    
    try {
      await this.doctorRepository.save(doctor);
      return {
        message: 'Schedule configuration updated successfully.',
        updatedConfig: {
          schedule_type: doctor.schedule_type,
          slot_duration: doctor.slot_duration,
          consulting_time: doctor.consulting_time,
          wave_limit: doctor.wave_limit,
        },
      };
    } catch (error) {
      console.error('Error updating schedule config:', error);
      throw new InternalServerErrorException(
        'Failed to update schedule configuration.',
      );
    }
  }


  // --- THIS IS THE CORRECTED METHOD ---
  async setAvailability(userUuid: string, dto: SetAvailabilityDto) {
    try {
      // Find the doctor using the user's UUID relation
      const doctor = await this.doctorRepository.findOne({
        where: { user: { id: userUuid } },
      });

      if (!doctor) {
        throw new NotFoundException('Doctor profile not found for the logged-in user.');
      }
      
      const { date, start_time, end_time, session, weekdays } = dto;
      // We will use the doctor's configured slot duration, not one from the DTO.
      const interval_minutes = doctor.slot_duration; 

      const parsedDate = new Date(date);
      if (parsedDate < new Date()) {
        throw new BadRequestException('Date cannot be in the past');
      }

      const availability = this.availabilityRepo.create({
        doctor: doctor,
        date: parsedDate,
        start_time,
        end_time,
        session,
        weekdays,
      });

      const savedAvailability = await this.availabilityRepo.save(availability);

      // Pass the FULL doctor object to the helper function
      const slots = this.generateTimeSlots(doctor, savedAvailability, interval_minutes);

      await this.timeSlotRepo.save(slots);

      return { message: 'Availability and slots created', slots };
    } catch (error) {
      console.error('❌ Error in setAvailability:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Something went wrong while setting availability.');
    }
  }

  async getDoctorAvailability(doctorId: number, { page = 1, limit = 10 }: PaginationDto) {
    const skip = (page - 1) * limit;
    const qb = this.timeSlotRepo.createQueryBuilder('slot');

    qb.where('slot.doctor_id = :doctorId', { doctorId })
      .andWhere('slot.is_available = :isAvailable', { isAvailable: true })
      .andWhere('slot.date >= CURRENT_DATE')
      .orderBy('slot.date', 'ASC')
      .addOrderBy('slot.start_time', 'ASC')
      .skip(skip)
      .take(limit);

    const [slots, total] = await qb.getManyAndCount();
    return { total, page, limit, slots };
  }

  // --- THIS IS THE CORRECTED HELPER METHOD ---
  private generateTimeSlots(
    doctor: Doctor, // <-- Pass the full doctor object
    availability: DoctorAvailability,
    interval: number,
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const dateObj = new Date(availability.date);
    const formattedDate = dateObj.toISOString().split('T')[0];

    const start = new Date(`${formattedDate}T${availability.start_time}`);
    const end = new Date(`${formattedDate}T${availability.end_time}`);

    while (start < end) {
      const slotEnd = new Date(start.getTime() + interval * 60000);
      if (slotEnd > end) break;

      // --- NEW LOGIC HERE ---
      // Determine the patient limit for this slot based on the doctor's config
      const patientLimit = doctor.schedule_type === 'wave' ? doctor.wave_limit : 1;
      // --- END NEW LOGIC ---

      const slot = this.timeSlotRepo.create({
        doctor: { doctor_id: doctor.doctor_id } as Doctor,
        availability: { id: availability.id } as DoctorAvailability,
        date: dateObj, // Use the Date object directly
        day_of_week: dateObj.toLocaleDateString('en-US', { weekday: 'long' }),
        start_time: start.toTimeString().slice(0, 5),
        end_time: slotEnd.toTimeString().slice(0, 5),
        is_available: true,
        patient_limit: patientLimit, // <-- Use the calculated limit
        booked_count: 0,
      });

      slots.push(slot);
      start.setMinutes(start.getMinutes() + interval);
    }
    return slots;
  }
}