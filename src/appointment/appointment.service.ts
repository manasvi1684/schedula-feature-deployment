
import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, MoreThanOrEqual } from 'typeorm';
import { Appointment } from 'src/entities/appointment.entity';
import { TimeSlot } from 'src/entities/timeslot.entity';
import { Patient } from 'src/entities/patient.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { formatInTimeZone } from 'date-fns-tz';

import { Doctor } from 'src/entities/doctor.entity'; //to import a doctor
import { User } from 'src/entities/user.entity';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,

    @InjectRepository(TimeSlot)
    private timeSlotRepository: Repository<TimeSlot>,

    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,

    //and ADD it to constructor
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    private dataSource: DataSource,
  ) {}

// In src/appointment/appointment.service.ts

  async createAppointment(
    userUuid: string,
    createAppointmentDto: CreateAppointmentDto,
  ) {
    const { slot_id } = createAppointmentDto;

    return this.dataSource.manager.transaction(
      async (transactionalEntityManager) => {
        // --- STEP 1: Find the TimeSlot ID and LOCK the row. Simple and effective. ---
        const timeSlotToLock = await transactionalEntityManager.findOne(TimeSlot, {
          where: { slot_id: slot_id },
          select: ['slot_id'],
          lock: { mode: 'pessimistic_write' },
        });

        if (!timeSlotToLock) {
          throw new NotFoundException(`Time slot with ID ${slot_id} not found.`);
        }

        // --- STEP 2: Now that the row is safely locked, fetch the full data with EXPLICIT relations. ---
        const timeSlot = await transactionalEntityManager.findOne(TimeSlot, {
            where: { slot_id: slot_id },
            relations: ['doctor', 'availability'],
        });

        if (!timeSlot || !timeSlot.availability || !timeSlot.doctor) {
            throw new InternalServerErrorException('Time slot data is incomplete.');
        }

        const patient = await transactionalEntityManager.findOne(Patient, {
          where: { user: { id: userUuid } },
        });

        if (!patient) {
          throw new NotFoundException('Patient profile not found for the logged-in user.');
        }
        
        const doctor = timeSlot.doctor;

        // --- 3. Perform validation checks ---
        

if (doctor.booking_start_time && doctor.booking_end_time) {
  // We assume a standard timezone for the clinic, e.g., 'Asia/Kolkata'.
  // This makes the check consistent regardless of server location.
  const timeZone = 'Asia/Kolkata'; // Or any other IANA timezone string

  // Get the current time in the specified timezone, formatted as HH:mm:ss
  const currentTime = formatInTimeZone(new Date(), timeZone, 'HH:mm:ss');

  console.log('--- BOOKING WINDOW DEBUG (date-fns) ---');
  console.log('Doctor ID:', doctor.doctor_id);
  console.log('Current Time (in ' + timeZone + '):', currentTime);
  console.log('Booking Start Time (from DB):', doctor.booking_start_time);
  console.log('Booking End Time (from DB):', doctor.booking_end_time);
  console.log('---');
  // --- END OF DEBUGGING BLOCK ---

  // Now we do a simple, reliable string comparison
  if (
    currentTime < doctor.booking_start_time ||
    currentTime > doctor.booking_end_time
  ) {
    throw new ForbiddenException(
      `Booking is only allowed between ${doctor.booking_start_time} and ${doctor.booking_end_time}.`,
    );
  }
}

        if (!timeSlot.is_available) {
          throw new ConflictException('This time slot is no longer available.');
        }

        const existingAppointment = await transactionalEntityManager.findOne(
          Appointment,
          {
            where: {
              patient: { patient_id: patient.patient_id },
              doctor: { doctor_id: doctor.doctor_id },
              date: timeSlot.date,
              session: timeSlot.availability.session,
            },
          },
        );
        if (existingAppointment) {
          throw new ConflictException('You have already booked an appointment for this session today.');
        }

        // --- 4. Handle booking based on schedule_type ---
        let reporting_time = timeSlot.start_time;

        if (doctor.schedule_type === 'stream') {
          if (timeSlot.booked_count >= timeSlot.patient_limit) {
            throw new ConflictException('This time slot is already booked.');
          }
          timeSlot.is_available = false;
          timeSlot.booked_count = 1;
        } else { // Wave scheduling
          if (timeSlot.booked_count >= timeSlot.patient_limit) {
            throw new ConflictException('This time slot has reached its maximum capacity.');
          }
          timeSlot.booked_count += 1;
          if (timeSlot.booked_count === timeSlot.patient_limit) {
            timeSlot.is_available = false;
          }
          const minutesToAdd = (timeSlot.booked_count - 1) * doctor.consulting_time;
          const [hours, minutes] = timeSlot.start_time.split(':').map(Number);
          const startTime = new Date();
          startTime.setHours(hours, minutes, 0, 0);
          startTime.setMinutes(startTime.getMinutes() + minutesToAdd);
          reporting_time = startTime.toTimeString().slice(0, 5);
        }

        // --- 5. Create and save the new appointment and update the time slot ---
        const newAppointment = transactionalEntityManager.create(Appointment, {
          patient,
          doctor,
          time_slot: timeSlot,
          date: timeSlot.date,
          session: timeSlot.availability.session,
          reporting_time: reporting_time,
          status: 'scheduled',
        });
        
        await transactionalEntityManager.save(TimeSlot, timeSlot);
        const savedAppointment = await transactionalEntityManager.save(Appointment, newAppointment);

        return {
          message: 'Appointment booked successfully!',
          appointment: savedAppointment,
        };
      },
    );
  }

   // Method to view appointments for a patient
   async getPatientAppointments(userUuid: string) {
    const patient = await this.patientRepository.findOne({
      where: { user: { id: userUuid } },
    });

    if (!patient) {
      throw new NotFoundException('Patient profile not found.');
    }

    const appointments = await this.appointmentRepository.find({
      where: {
        patient: { patient_id: patient.patient_id },
        date: MoreThanOrEqual(new Date()), // Only show upcoming appointments
      },
      relations: ['doctor', 'time_slot', 'time_slot.availability'], // Load relations
      order: {
        date: 'ASC',
        time_slot: { start_time: 'ASC' },
      },
    });

    return appointments;
  }

  // Method to view appointments for a doctor
  async getDoctorAppointments(userUuid: string) {
    const doctor = await this.doctorRepository.findOne({ //fix = > check and include proper dependancy
      where: { user: { id: userUuid } },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found.');
    }

    const appointments = await this.appointmentRepository.find({
      where: {
        doctor: { doctor_id: doctor.doctor_id },
        date: MoreThanOrEqual(new Date()), // Only show upcoming appointments
      },
      relations: ['patient', 'time_slot', 'time_slot.availability'], // Load relations
      order: {
        date: 'ASC',
        time_slot: { start_time: 'ASC' },
      },
    });

    return appointments;
  }

  async cancelAppointment(appointmentId: number, requestingUser: User) {
  // Use a transaction to ensure all or no database operations complete
  return this.dataSource.manager.transaction(async (transactionalEntityManager) => {
    // 1. Find the appointment with all necessary relations for validation
    const appointment = await transactionalEntityManager.findOne(Appointment, {
      where: { appointment_id: appointmentId },
      relations: [
        'patient',
        'patient.user',
        'doctor',
        'doctor.user',
        'time_slot',
      ],
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${appointmentId} not found.`);
    }

    if (appointment.status === 'cancelled') {
      // This isn't an error, just an informative message.
      return { message: 'This appointment was already cancelled.' };
    }
    if (appointment.status === 'completed') {
        throw new ForbiddenException('Cannot cancel a completed appointment.');
    }

    // 2. Authorization: Check if the user is allowed to cancel
    const isPatientOwner =
      requestingUser.role === 'patient' &&
      appointment.patient.user.id === requestingUser.id;
    
    const isDoctorOwner =
      requestingUser.role === 'doctor' &&
      appointment.doctor.user.id === requestingUser.id;

    if (!isPatientOwner && !isDoctorOwner) {
      throw new ForbiddenException('You are not authorized to cancel this appointment.');
    }

    // 3. Update the appointment status
    appointment.status = 'cancelled';

    // 4. Make the Time Slot available again
    const timeSlot = appointment.time_slot;
    if (timeSlot) {
      // Only make changes if the slot is NOT already available
      if (!timeSlot.is_available) {
        timeSlot.is_available = true;
      }
      // Decrement the booked count, but don't go below zero
      if (timeSlot.booked_count > 0) {
        timeSlot.booked_count -= 1;
      }
      await transactionalEntityManager.save(TimeSlot, timeSlot);
    }

    const updatedAppointment = await transactionalEntityManager.save(Appointment, appointment);

    return {
      message: 'Appointment successfully cancelled.',
      appointment: updatedAppointment,
    };
  });
}
}