// src/migrations/1751538914965-AddDoctorBookingWindow.ts

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDoctorBookingWindow1751538914965 implements MigrationInterface {
    name = 'AddDoctorBookingWindow1751538914965'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // --- ONLY add the new columns to the doctor table ---
        await queryRunner.query(`ALTER TABLE "doctor" ADD "booking_start_time" TIME`);
        await queryRunner.query(`COMMENT ON COLUMN "doctor"."booking_start_time" IS 'Global booking window start time for the doctor'`);
        await queryRunner.query(`ALTER TABLE "doctor" ADD "booking_end_time" TIME`);
        await queryRunner.query(`COMMENT ON COLUMN "doctor"."booking_end_time" IS 'Global booking window end time for the doctor'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // --- ONLY drop the new columns from the doctor table ---
        await queryRunner.query(`COMMENT ON COLUMN "doctor"."booking_end_time" IS 'Global booking window end time for the doctor'`);
        await queryRunner.query(`ALTER TABLE "doctor" DROP COLUMN "booking_end_time"`);
        await queryRunner.query(`COMMENT ON COLUMN "doctor"."booking_start_time" IS 'Global booking window start time for the doctor'`);
        await queryRunner.query(`ALTER TABLE "doctor" DROP COLUMN "booking_start_time"`);
    }

}