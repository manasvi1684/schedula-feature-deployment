// src/auth/auth.controller.ts

import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  Query,
  UseGuards,
  HttpCode,
  UnauthorizedException,
  HttpStatus // Import HttpStatus for better clarity with HttpCode
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { GoogleAuthGuard } from './strategy/google.guard';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED) // Use HttpStatus enum for clarity
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  signin(@Body() dto: SigninDto) {
    return this.authService.signin(dto);
  }

  @UseGuards(JwtGuard)
  @Post('signout')
  @HttpCode(HttpStatus.OK) // Use HttpStatus enum for clarity
  signout(@Req() req) {
    const userId = req.user.id; // <-- CRITICAL FIX: Get user ID from req.user.id
    return this.authService.signout(userId);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard) // JwtGuard will attach req.user, from which we get userId
  async refresh(@Req() req) {
    const refreshToken = req.headers['authorization']?.replace('Bearer ', ''); // Still get refresh token from header
    const userId = req.user.id; // <-- CRITICAL FIX: Get user ID from req.user.id, NOT req.body

    if (!refreshToken || !userId) { // userId check is still useful in case req.user.id is somehow not present
      throw new UnauthorizedException('Missing refresh token or userId');
    }

    return this.authService.refreshTokens(userId, refreshToken);
  }

  @UseGuards(JwtGuard)
  @Get('profile')
  @HttpCode(HttpStatus.OK) // Use HttpStatus enum for clarity
  getProfile(@Req() req) {
    // req.user already contains { id, email, role } from JwtStrategy's validate method
    return {
      message: 'Access granted to protected route',
      user: req.user,
    };
  }

  // === 🌐 Google OAuth Routes ===

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth(@Query('role') role: string) {
    // Role is passed as query param and handled by strategy
    return;
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req) {
    // req.user from GoogleAuthGuard will contain user data and tokens
    return req.user;
  }
}