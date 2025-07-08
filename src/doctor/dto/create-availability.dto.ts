// src/doctor/dto/create-availability.dto.ts
import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  Matches,
  ValidateIf,
} from 'class-validator';
import { AvailabilityType } from 'src/entities/doctor_availability.entity';

export class CreateAvailabilityDto {
  @IsNotEmpty()
  @IsEnum(AvailabilityType)
  type: AvailabilityType;

  // Validate 'date' only if type is 'custom_date'
  @ValidateIf((o) => o.type === AvailabilityType.CUSTOM_DATE)
  @IsNotEmpty({ message: 'Date is required for custom_date availability' })
  @IsString()
  date?: string; // e.g., "2025-12-25"

  // Validate 'weekdays' only if type is 'recurring'
  @ValidateIf((o) => o.type === AvailabilityType.RECURRING)
  @IsNotEmpty({ message: 'Weekdays are required for recurring availability' })
  @IsArray()
  @IsString({ each: true })
  weekdays?: string[]; // e.g., ["Monday", "Wednesday"]

  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'consulting_start_time must be in HH:MM format',
  })
  consulting_start_time: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'consulting_end_time must be in HH:MM format',
  })
  consulting_end_time: string;

  @IsNotEmpty()
  @IsString()
  session: string; // e.g., "morning", "evening"
}