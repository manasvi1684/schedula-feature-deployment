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
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('signin')
  @HttpCode(200)
  signin(@Body() dto: SigninDto) {
    return this.authService.signin(dto);
  }

  @UseGuards(JwtGuard)
  @Post('signout')
  signout(@Req() req) {
    return this.authService.signout(req.user.sub);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Req() req) {
    const refreshToken = req.headers['authorization']?.replace('Bearer ', '');
    const userId = req.body?.userId;

    if (!refreshToken || !userId) {
      throw new UnauthorizedException('Missing refresh token or userId');
    }

    return this.authService.refreshTokens(userId, refreshToken);
  }

  @UseGuards(JwtGuard)
  @Get('profile')
  getProfile(@Req() req) {
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
    // Tokens and user info already handled by GoogleStrategy
    return req.user;
  }
}
