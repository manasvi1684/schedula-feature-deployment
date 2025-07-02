// src/doctor/doctor.controller.ts

import {
  Controller,
  Get,
  Query,
  Param,
  NotFoundException,
  Post,
  Body,
  Req,
  UseGuards,
  ParseIntPipe,
  Patch, // <-- Import Patch
} from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { SetAvailabilityDto } from 'src/auth/dto/SetAvailabilityDto';
import { PaginationDto } from 'src/auth/dto/PaginationDto';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
// --- NEW ---
import { UpdateScheduleConfigDto } from './dto/update-schedule-config.dto'; // <-- Import our new DTO
// --- END NEW ---

@Controller('api/v1/doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  // ... (existing GET findAll and GET findOne endpoints are perfect, no changes needed)
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
  
  // --- NEW ENDPOINT ---
  @Patch('schedule-config') // Using a clear, descriptive route
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('doctor')
  async updateScheduleConfig(
    @Req() req: any,
    @Body() updateScheduleConfigDto: UpdateScheduleConfigDto,
  ) {
    const userUuid = req.user.sub; // Get doctor's user UUID from JWT
    return this.doctorService.updateScheduleConfig(
      userUuid,
      updateScheduleConfigDto,
    );
  }
  // --- END NEW ENDPOINT ---

  // ... (existing POST setAvailability and GET getAvailability endpoints are perfect, no changes needed)
  @Post('availability')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('doctor')
  async setAvailability(@Body() dto: SetAvailabilityDto, @Req() req: any) {
    const userUuid = req.user.sub;
    return this.doctorService.setAvailability(userUuid, dto);
  }

  @Get(':id/availability')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('patient')
  async getAvailability(
    @Param('id', ParseIntPipe) doctorId: number,
    @Query() pagination: PaginationDto,
  ) {
    return this.doctorService.getDoctorAvailability(doctorId, pagination);
  }
}