import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('api/v1')
@UseGuards(JwtGuard, RolesGuard)
export class ProfileController {
  @Get('doctor/profile')
  @Roles('doctor')
  getDoctorProfile(@Req() req) {
    return {
      message: 'Welcome Doctor 👨‍⚕️',
      user: req.user,
    };
  }

  @Get('patient/profile')
  @Roles('patient')
  getPatientProfile(@Req() req) {
    return {
      message: 'Welcome Patient 🧑‍🤝‍🧑',
      user: req.user,
    };
  }
}
