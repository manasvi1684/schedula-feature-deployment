// src/doctor/dto/update-schedule-config.dto.ts
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

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
}