import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL;

  if (!clientID || !clientSecret || !callbackURL) {
    throw new Error('Google OAuth environment variables are not set correctly');
  }

  super({
    clientID,
    clientSecret,
    callbackURL,
    scope: ['email', 'profile'],
    passReqToCallback: true,
  });
}


  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const role = req.query.role || 'patient';

    const user = await this.authService.handleGoogleLogin({
      email: profile._json.email,
      name: profile._json.name,
      role,
    });

    return done(null, user);
  }
}
