// src/auth/strategy/jwt.strategy.ts

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET') || 'default_access_secret',
    });
  }

  // CORRECTED VALIDATE METHOD
  async validate(payload: { sub: string; email: string; role: string }) { // <-- 'sub' is now 'string'
    // The object returned by validate() will be assigned to req.user
    return { id: payload.sub, email: payload.email, role: payload.role }; 
  }
}