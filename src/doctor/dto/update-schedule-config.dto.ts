// src/doctor/dto/update-schedule-config.dto.ts
import { IsEnum, IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

export class UpdateScheduleConfigDto {
  @IsOptional()
  @IsEnum(['stream', 'wave'], {
    message: 'schedule_type must be either "stream" or "wave"',
  })
  schedule_type?: 'stream' | 'wave';

  @IsOptional()
  @IsInt()
  @Min(5, { message: 'slot_duration must be at least 5 minutes' })
  slot_duration?: number;

  @IsOptional()
  @IsInt()
  @Min(5, { message: 'consulting_time must be at least 5 minutes' })
  consulting_time?: number;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'wave_limit must be at least 1' })
  wave_limit?: number;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'booking_start_time must be in HH:MM format (e.g., 09:00)',
  })
  booking_start_time?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'booking_end_time must be in HH:MM format (e.g., 17:00)',
  })
  booking_end_time?: string;
}