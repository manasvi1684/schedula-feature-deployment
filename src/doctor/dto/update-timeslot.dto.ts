// src/doctor/dto/update-timeslot.dto.ts
import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateTimeSlotDto {
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'start_time must be in HH:MM format (e.g., 09:00)',
  })
  start_time?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'end_time must be in HH:MM format (e.g., 17:00)',
  })
  end_time?: string;
}