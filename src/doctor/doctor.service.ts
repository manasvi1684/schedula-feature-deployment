// src/doctor/doctor.service.ts

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from 'src/entities/doctor.entity';
import { DoctorAvailability } from 'src/entities/doctor_availability.entity';
import { TimeSlot } from 'src/entities/timeslot.entity';
import { SetAvailabilityDto } from 'src/auth/dto/SetAvailabilityDto';
import { PaginationDto } from 'src/auth/dto/PaginationDto';
import { UpdateScheduleConfigDto } from './dto/update-schedule-config.dto';
import { UpdateTimeSlotDto } from './dto/update-timeslot.dto';

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

  // ... (Your other methods are fine)
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
  async updateScheduleConfig(userUuid: string, dto: UpdateScheduleConfigDto) {
    const doctor = await this.doctorRepository.findOne({ where: { user: { id: userUuid } } });
    if (!doctor) {
      throw new NotFoundException('Doctor profile not found for the logged-in user.');
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
          booking_start_time: doctor.booking_start_time,
          booking_end_time: doctor.booking_end_time,
        },
      };
    } catch (error) {
      console.error('Error updating schedule config:', error);
      throw new InternalServerErrorException('Failed to update schedule configuration.');
    }
  }

  // src/doctor/doctor.service.ts, inside the DoctorService class

  // ... (after updateScheduleConfig method)

  async deleteTimeSlot(userUuid: string, slotId: number) {
    // 1. Find the doctor making the request
    const doctor = await this.doctorRepository.findOne({
      where: { user: { id: userUuid } },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found for the logged-in user.');
    }

    // 2. Find the time slot to be deleted
    const timeSlot = await this.timeSlotRepo.findOne({
      where: { slot_id: slotId },
      relations: ['doctor'], // We need to load the doctor to check ownership
    });

    if (!timeSlot) {
      throw new NotFoundException(`Time slot with ID ${slotId} not found.`);
    }

    // 3. Authorization Check: Ensure the doctor owns this time slot
    if (timeSlot.doctor.doctor_id !== doctor.doctor_id) {
      throw new ForbiddenException('You are not authorized to delete this time slot.');
    }

    // 4. Validation Check: The critical business rule
    if (timeSlot.booked_count > 0) {
      throw new ConflictException(
        'This slot cannot be deleted as it has one or more appointments booked.',
      );
    }

    // 5. If all checks pass, delete the slot
    await this.timeSlotRepo.remove(timeSlot);

    return { message: `Time slot ${slotId} has been successfully deleted.` };
  }

  // src/doctor/doctor.service.ts
// ... (after deleteTimeSlot method)

async updateTimeSlot(
  userUuid: string,
  slotId: number,
  dto: UpdateTimeSlotDto,
) {
  // 1. Find the doctor making the request
  const doctor = await this.doctorRepository.findOne({
    where: { user: { id: userUuid } },
  });
  if (!doctor) {
    throw new NotFoundException('Doctor profile not found.');
  }

  // 2. Find the time slot to be edited
  const timeSlot = await this.timeSlotRepo.findOne({
    where: { slot_id: slotId },
    relations: ['doctor'],
  });
  if (!timeSlot) {
    throw new NotFoundException(`Time slot with ID ${slotId} not found.`);
  }

  // 3. Authorization Check
  if (timeSlot.doctor.doctor_id !== doctor.doctor_id) {
    throw new ForbiddenException('You are not authorized to edit this time slot.');
  }

  // 4. Validation Check (The same as delete)
  if (timeSlot.booked_count > 0) {
    throw new ConflictException(
      'This slot cannot be edited as it has existing appointments.',
    );
  }

  // 5. Update the slot and save
  Object.assign(timeSlot, dto); // Merge new start/end times
  const updatedSlot = await this.timeSlotRepo.save(timeSlot);

  return {
    message: `Time slot ${slotId} has been successfully updated.`,
    slot: updatedSlot,
  };
}

  async setAvailability(userUuid: string, dto: SetAvailabilityDto) {
    try {
      const doctor = await this.doctorRepository.findOne({
        where: { user: { id: userUuid } },
      });

      if (!doctor) {
        throw new NotFoundException('Doctor profile not found for the logged-in user.');
      }
      
      const { date, start_time, end_time, session, weekdays } = dto;
      const interval_minutes = doctor.slot_duration; 

      const parsedDate = new Date(date);
      if (parsedDate.toString() === 'Invalid Date') {
        throw new BadRequestException('Invalid date format provided.');
      }
      if (parsedDate < new Date()) {
        throw new BadRequestException('Date cannot be in the past');
      }

      const availability = this.availabilityRepo.create({
        doctor, // Pass the full object
        date: parsedDate,
        start_time,
        end_time,
        session,
        weekdays,
      });

      const savedAvailability = await this.availabilityRepo.save(availability);
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

    qb.where('slot.doctor.doctor_id = :doctorId', { doctorId })
      .andWhere('slot.is_available = :isAvailable', { isAvailable: true })
      .andWhere('slot.date >= CURRENT_DATE')
      .orderBy('slot.date', 'ASC')
      .addOrderBy('slot.start_time', 'ASC')
      .skip(skip)
      .take(limit);

    const [slots, total] = await qb.getManyAndCount();
    return { total, page, limit, slots };
  }

  private generateTimeSlots(
    doctor: Doctor,
    availability: DoctorAvailability,
    interval: number,
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const dateObj = new Date(availability.date);
    const start = new Date(`${dateObj.toISOString().slice(0, 10)}T${availability.start_time}`);
    const end = new Date(`${dateObj.toISOString().slice(0, 10)}T${availability.end_time}`);

    while (start < end) {
      const slotEnd = new Date(start.getTime() + interval * 60000);
      if (slotEnd > end) break;

      const patientLimit = doctor.schedule_type === 'wave' ? doctor.wave_limit : 1;

      const slot = this.timeSlotRepo.create({
        doctor: { doctor_id: doctor.doctor_id } as Doctor,
        availability: { id: availability.id } as DoctorAvailability,
        date: dateObj,
        day_of_week: dateObj.toLocaleDateString('en-US', { weekday: 'long' }),
        start_time: start.toTimeString().slice(0, 5),
        end_time: slotEnd.toTimeString().slice(0, 5),
        is_available: true,
        patient_limit: patientLimit, // <-- THE FIX IS HERE
        booked_count: 0,
      });

      slots.push(slot);
      start.setMinutes(start.getMinutes() + interval);
    }
    return slots;
  }
}