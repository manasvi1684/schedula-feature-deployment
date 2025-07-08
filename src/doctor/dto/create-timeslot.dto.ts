// src/doctor/dto/create-timeslot.dto.ts
import { IsInt, IsNotEmpty, IsString, Matches, Min } from 'class-validator';

export class CreateTimeSlotDto {
  @IsInt()
  @IsNotEmpty()
  availability_id: number;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'start_time must be in HH:MM format',
  })
  start_time: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'end_time must be in HH:MM format',
  })
  end_time: string;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  patient_limit: number;
}