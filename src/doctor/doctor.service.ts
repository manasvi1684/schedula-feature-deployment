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
import { DoctorAvailability, AvailabilityType } from 'src/entities/doctor_availability.entity';
import { TimeSlot } from 'src/entities/timeslot.entity';
import { PaginationDto } from 'src/auth/dto/PaginationDto';
import { UpdateScheduleConfigDto } from './dto/update-schedule-config.dto';
import { UpdateTimeSlotDto } from './dto/update-timeslot.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { CreateTimeSlotDto } from './dto/create-timeslot.dto';

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

  async getDoctorAvailability(
    doctorId: number,
    { page = 1, limit = 10 }: PaginationDto,
  ) {
    const skip = (page - 1) * limit;
    const qb = this.timeSlotRepo.createQueryBuilder('slot');
    qb.where('slot.doctor_id = :doctorId', { doctorId })
      .andWhere('slot.is_available = :isAvailable', { isAvailable: true })
      .andWhere('(slot.date >= CURRENT_DATE OR slot.date IS NULL)')
      .orderBy('slot.date', 'ASC', 'NULLS FIRST')
      .addOrderBy('slot.start_time', 'ASC')
      .skip(skip)
      .take(limit);
    const [slots, total] = await qb.getManyAndCount();
    return {
      total,
      page,
      limit,
      slots,
    };
  }

  async updateScheduleConfig(userUuid: string, dto: UpdateScheduleConfigDto) {
    const doctor = await this.doctorRepository.findOneBy({ user: { id: userUuid } });
    if (!doctor) {
      throw new NotFoundException('Doctor profile not found for the logged-in user.');
    }
    Object.assign(doctor, dto);
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
  }

  async createAvailability(userUuid: string, dto: CreateAvailabilityDto) {
    const doctor = await this.doctorRepository.findOneBy({ user: { id: userUuid } });
    if (!doctor) {
      throw new NotFoundException('Doctor profile not found for the logged-in user.');
    }
    if (dto.consulting_start_time >= dto.consulting_end_time) {
      throw new BadRequestException('Consulting end time must be after start time.');
    }
    const newAvailability = this.availabilityRepo.create({
      doctor,
      type: dto.type,
      date: dto.date ? new Date(dto.date) : null,
      weekdays: dto.weekdays || null,
      consulting_start_time: dto.consulting_start_time,
      consulting_end_time: dto.consulting_end_time,
      session: dto.session,
    });
    const savedAvailability = await this.availabilityRepo.save(newAvailability);
    return {
      message: 'Availability window created successfully. You can now add time slots to this window.',
      availability: savedAvailability,
    };
  }

  async createTimeSlot(userUuid: string, dto: CreateTimeSlotDto) {
    const doctor = await this.doctorRepository.findOneBy({ user: { id: userUuid } });
    if (!doctor) {
      throw new NotFoundException('Doctor profile not found.');
    }
    const availabilityWindow = await this.availabilityRepo.findOneBy({
      id: dto.availability_id,
      doctor: { doctor_id: doctor.doctor_id },
    });
    if (!availabilityWindow) {
      throw new NotFoundException(
        `Availability window with ID ${dto.availability_id} not found or you are not the owner.`,
      );
    }
    const [slotStartH, slotStartM] = dto.start_time.split(':').map(Number);
    const slotStartInMinutes = slotStartH * 60 + slotStartM;
    const [slotEndH, slotEndM] = dto.end_time.split(':').map(Number);
    const slotEndInMinutes = slotEndH * 60 + slotEndM;
    const [consultingStartH, consultingStartM] = availabilityWindow.consulting_start_time.split(':').map(Number);
    const consultingStartInMinutes = consultingStartH * 60 + consultingStartM;
    const [consultingEndH, consultingEndM] = availabilityWindow.consulting_end_time.split(':').map(Number);
    const consultingEndInMinutes = consultingEndH * 60 + consultingEndM;
    if (
      slotStartInMinutes < consultingStartInMinutes ||
      slotEndInMinutes > consultingEndInMinutes ||
      slotStartInMinutes >= slotEndInMinutes
    ) {
      throw new BadRequestException(
        `Slot time must be within the consulting window of ${availabilityWindow.consulting_start_time} to ${availabilityWindow.consulting_end_time}, and start time must be before end time.`,
      );
    }
    let slotDate: Date | null = null;
    let slotDayOfWeek: string;
    if (availabilityWindow.type === AvailabilityType.CUSTOM_DATE) {
      slotDate = availabilityWindow.date;
      slotDayOfWeek = new Date(slotDate).toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      slotDayOfWeek = "Recurring";
    }
    const newTimeSlot = this.timeSlotRepo.create({
      doctor,
      availability: availabilityWindow,
      start_time: dto.start_time,
      end_time: dto.end_time,
      patient_limit: dto.patient_limit,
      date: slotDate,
      day_of_week: slotDayOfWeek,
      is_available: true,
    });
    const savedSlot = await this.timeSlotRepo.save(newTimeSlot);
    return {
      message: 'Time slot created successfully.',
      slot: savedSlot,
    };
  }

  async updateTimeSlot(userUuid: string, slotId: number, dto: UpdateTimeSlotDto) {
    const doctor = await this.doctorRepository.findOneBy({ user: { id: userUuid } });
    if (!doctor) { throw new NotFoundException('Doctor profile not found.'); }
    const timeSlot = await this.timeSlotRepo.findOne({
      where: { slot_id: slotId },
      relations: ['doctor', 'availability'],
    });
    if (!timeSlot) { throw new NotFoundException(`Time slot with ID ${slotId} not found.`); }
    if (timeSlot.doctor.doctor_id !== doctor.doctor_id) { throw new ForbiddenException('You are not authorized to edit this time slot.'); }

    const siblingSlots = await this.timeSlotRepo.find({
      where: { availability: { id: timeSlot.availability.id } },
    });

    // --- ADDED THIS DEBUGGING BLOCK ---
    console.log('--- STRICT VALIDATION DEBUG (UPDATE) ---');
    console.log(`Target Slot ID: ${slotId}`);
    console.log(`Parent Availability Window ID: ${timeSlot.availability.id}`);
    console.log('Sibling slots found in this window:', siblingSlots.map(s => ({ id: s.slot_id, booked_count: s.booked_count })));
    // --- END OF DEBUGGING BLOCK ---

    const totalBookingsInWindow = siblingSlots.reduce((sum, slot) => sum + slot.booked_count, 0);
    if (totalBookingsInWindow > 0) {
      throw new ConflictException('Cannot edit this slot because one or more appointments are booked within this consulting session.');
    }

    Object.assign(timeSlot, dto);
    const updatedSlot = await this.timeSlotRepo.save(timeSlot);
    return { message: `Time slot ${slotId} has been successfully updated.`, slot: updatedSlot };
  }

  async deleteTimeSlot(userUuid: string, slotId: number) {
    const doctor = await this.doctorRepository.findOneBy({ user: { id: userUuid } });
    if (!doctor) { throw new NotFoundException('Doctor profile not found.'); }
    const timeSlot = await this.timeSlotRepo.findOne({
      where: { slot_id: slotId },
      relations: ['doctor', 'availability'],
    });
    if (!timeSlot) { throw new NotFoundException(`Time slot with ID ${slotId} not found.`); }
    if (timeSlot.doctor.doctor_id !== doctor.doctor_id) { throw new ForbiddenException('You are not authorized to delete this time slot.'); }

    const siblingSlots = await this.timeSlotRepo.find({
      where: { availability: { id: timeSlot.availability.id } },
    });
    
    // --- ADDED THIS DEBUGGING BLOCK ---
    console.log('--- STRICT VALIDATION DEBUG (DELETE) ---');
    console.log(`Target Slot ID: ${slotId}`);
    console.log(`Parent Availability Window ID: ${timeSlot.availability.id}`);
    console.log('Sibling slots found in this window:', siblingSlots.map(s => ({ id: s.slot_id, booked_count: s.booked_count })));
    // --- END OF DEBUGGING BLOCK ---

    const totalBookingsInWindow = siblingSlots.reduce((sum, slot) => sum + slot.booked_count, 0);
    if (totalBookingsInWindow > 0) {
      throw new ConflictException('Cannot delete this slot because one or more appointments are booked within this consulting session.');
    }

    await this.timeSlotRepo.remove(timeSlot);
    return { message: `Time slot ${slotId} has been successfully deleted.` };
  }
}