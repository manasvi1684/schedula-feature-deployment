// src/appointment/appointment.controller.ts

import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  InternalServerErrorException,
  NotFoundException,
  Get,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('api/v1/appointments')
@UseGuards(JwtGuard, RolesGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @Roles('patient') // Only patients can book appointments
  create(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @Req() req: any, // We need the request object to get the user
  ) {
    const userUuid = req.user.sub; // Get the user's UUID from the JWT payload
    return this.appointmentService.createAppointment(
      userUuid,
      createAppointmentDto,
    );
  }
  @Get('me')
  @Roles('patient') // Accessible to patients
  async getPatientAppointments(@Req() req: any) {
    const userUuid = req.user.id;
    try {
      return await this.appointmentService.getPatientAppointments(userUuid);
    } catch (error) {
      // Improved Error Handling
      if (error instanceof NotFoundException) {
        throw error; // Re-throw the NotFoundException
      }
      throw new InternalServerErrorException('Failed to retrieve patient appointments.');
    }
  }

  @Get('doctor')
  @Roles('doctor') // Accessible to doctors
  async getDoctorAppointments(@Req() req: any) {
    const userUuid = req.user.id;
     try {
      return await this.appointmentService.getDoctorAppointments(userUuid);
    } catch (error) {
       // Improved Error Handling
      if (error instanceof NotFoundException) {
        throw error; // Re-throw the NotFoundException
      }
      throw new InternalServerErrorException('Failed to retrieve doctor appointments.');
    }
  }
}