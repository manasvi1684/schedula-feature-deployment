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
  Patch,
  ParseIntPipe,
  Param,
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
    const userUuid = req.user.id; // <-- THIS IS THE CRITICAL FIX: Changed from req.user.sub to req.user.id
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
      if (error instanceof NotFoundException) {
        throw error;
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
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve doctor appointments.');
    }
  }
  @Patch(':id/cancel')
  @UseGuards(JwtGuard) // Protects the route, allows ANY logged-in user to try
  async cancelAppointment(
    @Param('id', ParseIntPipe) appointmentId: number,
    @Req() req: any,
  ) {
    // We pass the entire user object to the service so it can check the role and ID
    const user = req.user; 
    return this.appointmentService.cancelAppointment(appointmentId, user);
  }
}