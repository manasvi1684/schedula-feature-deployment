
import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, MoreThanOrEqual } from 'typeorm';
import { Appointment } from 'src/entities/appointment.entity';
import { TimeSlot } from 'src/entities/timeslot.entity';
import { Patient } from 'src/entities/patient.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

import { Doctor } from 'src/entities/doctor.entity'; //to import a doctor

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
        // By removing 'eager', we now have full control and generate simpler SQL.
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
        } else {
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
}