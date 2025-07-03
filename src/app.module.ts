import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { DoctorModule } from './doctor/doctor.module';
import { AppointmentModule } from './appointment/appointment.module';

// --- IMPORTANT: Import the options from our single source of truth ---
import { AppDataSource } from './data-source';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // --- Use the imported configuration directly ---
    // This ensures your running app and your migrations
    // use the exact same database settings.
    TypeOrmModule.forRoot(AppDataSource.options),

    // Your existing feature modules
    AuthModule,
    DoctorModule,
    AppointmentModule,
  ],
})
export class AppModule {}