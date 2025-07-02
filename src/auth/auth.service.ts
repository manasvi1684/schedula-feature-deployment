import {
  Injectable,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Doctor } from 'src/entities/doctor.entity';
import { Patient } from 'src/entities/patient.entity';
import { User, AuthProvider, UserRole } from 'src/entities/user.entity';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,
    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async signup(dto: SignupDto) {
    try {
      const { role, email, name, password, specialization } = dto;

      const existingUser = await this.userRepo.findOne({ where: { email } });
      if (existingUser) throw new ForbiddenException('Email already registered');

      const hash = await bcrypt.hash(password, 10);

      const user = this.userRepo.create({
        email,
        name,
        password: hash,
        role: role as UserRole,
        provider: 'local',
      });
      await this.userRepo.save(user);

      const [first_name, ...lastParts] = name.trim().split(' ');
      const last_name = lastParts.join(' ');

      if (role === 'doctor') {
        await this.doctorRepo.save({
          user,
          first_name,
          last_name,
          email: user.email,
          phone_number: '9876543210',
          specialization: specialization || '',
          experience_years: 10,
          education: 'MBBS, MD',
          clinic_name: 'Marvel Medicals',
          clinic_address: '177A Bleecker Street, NY',
          available_days: ['Monday', 'Wednesday', 'Friday'],
        });
      } else if (role === 'patient') {
        await this.patientRepo.save({
          user,
          first_name: name,
          last_name: '',
          email: user.email,
          phone_number: '',
          gender: '',
          dob: '',
          address: '',
          emergency_contact: '',
          medical_history: [],
        });
      } else {
        throw new ForbiddenException('Invalid role');
      }

      const tokens = await this.getTokens(user.id, user.email, user.role);
      await this.updateRefreshToken(user.id, tokens.refresh_token);
      return tokens;
    } catch (error) {
      console.error('❌ Signup Error:', error);
      throw new InternalServerErrorException('Signup failed');
    }
  }

  async signin(dto: SigninDto) {
    try {
      const { email, password } = dto;

      const user = await this.userRepo.findOne({ where: { email } });
      if (!user || !user.password) {
        if (user?.provider === 'google') {
          throw new ForbiddenException('Account is registered via Google. Please login with Google.');
        }
        throw new ForbiddenException('Invalid credentials');
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) throw new ForbiddenException('Invalid credentials');

      const tokens = await this.getTokens(user.id, user.email, user.role);
      await this.updateRefreshToken(user.id, tokens.refresh_token);

      return {
        tokens,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      console.error('❌ Signin Error:', error);
      throw new InternalServerErrorException('Signin failed');
    }
  }

  async signout(userId: string) {
    try {
      await this.userRepo.update(userId, { refreshToken: null });
      return { message: 'Signout successful' };
    } catch (error) {
      console.error('❌ Signout Error:', error);
      throw new InternalServerErrorException('Something went wrong during signout');
    }
  }

  async refreshTokens(userId: string, refreshToken: string | null | undefined) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'role', 'refreshToken'],
    });

    if (!user || !user.refreshToken) {
      throw new ForbiddenException('Access Denied');
    }

    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new ForbiddenException('Access Denied: Invalid token format');
    }

    const match = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!match) throw new ForbiddenException('Access Denied');

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.userRepo.update(userId, { refreshToken: hashed });
  }

  async getTokens(userId: string, email: string, role: UserRole) {
    const [access_token, refresh_token] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId, email, role },
        {
          secret: process.env.JWT_ACCESS_SECRET,
          expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        },
      ),
      this.jwt.signAsync(
        { sub: userId, email, role },
        {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        },
      ),
    ]);
    return { access_token, refresh_token };
  }

  // ✅ Google OAuth Handler
  async handleGoogleLogin(profile: {
    email: string;
    name: string;
    role: UserRole;
  }) {
    const { email, name, role } = profile;

    let user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      user = this.userRepo.create({
        email,
        name,
        password: null,
        role,
        provider: 'google',
      });
      await this.userRepo.save(user);

      const [first_name, ...lastParts] = name.trim().split(' ');
      const last_name = lastParts.join(' ');

      if (role === 'doctor') {
        await this.doctorRepo.save({
          user,
          first_name,
          last_name,
          email,
          phone_number: '',
          specialization: '',
          experience_years: 0,
          education: '',
          clinic_name: '',
          clinic_address: '',
          available_days: [],
        });
      } else if (role === 'patient') {
        await this.patientRepo.save({
          user,
          first_name: name,
          last_name: '',
          email,
          phone_number: '',
          gender: '',
          dob: '',
          address: '',
          emergency_contact: '',
          medical_history: [],
        });
      }
    }

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return {
      message: 'Google login successful',
      tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
