// src/doctor/doctor.controller.ts

import {
  Controller,
  Get,
  Query,
  Param,
  NotFoundException,
  Post,
  Delete,
  Body,
  Req,
  UseGuards,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { CreateTimeSlotDto } from './dto/create-timeslot.dto';
// import { SetAvailabilityDto } from 'src/auth/dto/SetAvailabilityDto'; // <-- No longer needed here
import { PaginationDto } from 'src/auth/dto/PaginationDto';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UpdateScheduleConfigDto } from './dto/update-schedule-config.dto';
import { UpdateTimeSlotDto } from './dto/update-timeslot.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto'; // <-- Import the new DTO

@Controller('api/v1/doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  findAll(
    @Query('name') name?: string,
    @Query('specialization') specialization?: string,
  ) {
    return this.doctorService.getAllDoctors(name, specialization);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const doctor = await this.doctorService.getDoctorById(id);
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }
  
  @Patch('schedule-config')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('doctor')
  async updateScheduleConfig(
    @Req() req: any,
    @Body() updateScheduleConfigDto: UpdateScheduleConfigDto,
  ) {
    // You have req.user.id here, which is good. We should be consistent.
    // The JWT strategy assigns the payload to req.user. Let's assume the user ID is in req.user.id
    const userUuid = req.user.id;
    return this.doctorService.updateScheduleConfig(
      userUuid,
      updateScheduleConfigDto,
    );
  }

  // --- NEW ENDPOINT for creating the availability window ---
  @Post('availability-window')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('doctor')
  async createAvailability(
    @Body() dto: CreateAvailabilityDto,
    @Req() req: any,
  ) {
    // Let's be consistent and use req.user.id
    const userUuid = req.user.id; 
    return this.doctorService.createAvailability(userUuid, dto);
  }
  // --- END NEW ENDPOINT ---


  // --- OLD ENDPOINT REMOVED ---
  /*
  @Post('availability')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('doctor')
  async setAvailability(@Body() dto: SetAvailabilityDto, @Req() req: any) {
    const userUuid = req.user.id;
    return this.doctorService.setAvailability(userUuid, dto);
  }
  */
  // --- END OLD ENDPOINT ---


  @Get(':id/availability')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('patient')
  async getAvailability(
    @Param('id', ParseIntPipe) doctorId: number,
    @Query() pagination: PaginationDto,
  ) {
    return this.doctorService.getDoctorAvailability(doctorId, pagination);
  }

  @Delete('time-slots/:slotId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('doctor')
  async deleteTimeSlot(
    @Req() req: any,
    @Param('slotId', ParseIntPipe) slotId: number,
  ) {
    // Consistent use of req.user.id
    const userUuid = req.user.id; 
    return this.doctorService.deleteTimeSlot(userUuid, slotId);
  }

   @Patch('time-slots/:slotId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('doctor')
  async updateTimeSlot(
    @Req() req: any,
    @Param('slotId', ParseIntPipe) slotId: number,
    @Body() updateTimeSlotDto: UpdateTimeSlotDto,
  ) {
    // Consistent use of req.user.id
    const userUuid = req.user.id; 
    return this.doctorService.updateTimeSlot(userUuid, slotId, updateTimeSlotDto);
  }
   @Post('time-slots')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('doctor')
  async createTimeSlot(
    @Body() dto: CreateTimeSlotDto,
    @Req() req: any,
  ) {
    const userUuid = req.user.id;
    return this.doctorService.createTimeSlot(userUuid, dto);
  }

}