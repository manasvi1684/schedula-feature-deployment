// src/appointment/dto/create-appointment.dto.ts
import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateAppointmentDto {
  @IsInt()
  @IsNotEmpty()
  slot_id: number;
}