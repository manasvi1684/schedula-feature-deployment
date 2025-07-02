import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsIn,
  MinLength,
} from 'class-validator';

export class SignupDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  name: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Enter a valid email address' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsNotEmpty({ message: 'Role is required' })
  @IsIn(['doctor', 'patient'], { message: 'Role must be doctor or patient' })
  role: 'doctor' | 'patient';

  @IsOptional()
  @IsString({ message: 'Specialization must be a string' })
  specialization?: string;
}
