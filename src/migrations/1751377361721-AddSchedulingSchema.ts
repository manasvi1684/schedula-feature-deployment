import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSchedulingSchema1751377361721 implements MigrationInterface {
    name = 'AddSchedulingSchema1751377361721'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "doctor_time_slots" ADD "booked_count" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`COMMENT ON COLUMN "doctor_time_slots"."booked_count" IS 'The current number of patients booked for this slot (for wave scheduling)'`);
        await queryRunner.query(`ALTER TABLE "doctor_time_slots" ADD "patient_limit" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`COMMENT ON COLUMN "doctor_time_slots"."patient_limit" IS 'The maximum number of patients that can book this slot'`);
        await queryRunner.query(`CREATE TYPE "public"."doctor_schedule_type_enum" AS ENUM('stream', 'wave')`);
        await queryRunner.query(`ALTER TABLE "doctor" ADD "schedule_type" "public"."doctor_schedule_type_enum" NOT NULL DEFAULT 'stream'`);
        await queryRunner.query(`COMMENT ON COLUMN "doctor"."schedule_type" IS 'The scheduling strategy for this doctor'`);
        await queryRunner.query(`ALTER TABLE "doctor" ADD "slot_duration" integer NOT NULL DEFAULT '30'`);
        await queryRunner.query(`COMMENT ON COLUMN "doctor"."slot_duration" IS 'The duration of a single appointment slot in minutes (e.g., 15, 20, 30)'`);
        await queryRunner.query(`ALTER TABLE "doctor" ADD "consulting_time" integer NOT NULL DEFAULT '15'`);
        await queryRunner.query(`COMMENT ON COLUMN "doctor"."consulting_time" IS 'The time allocated for a single patient consultation in minutes'`);
        await queryRunner.query(`ALTER TABLE "doctor" ADD "wave_limit" integer NOT NULL DEFAULT '3'`);
        await queryRunner.query(`COMMENT ON COLUMN "doctor"."wave_limit" IS 'Maximum number of patients per slot in wave scheduling'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON COLUMN "doctor"."wave_limit" IS 'Maximum number of patients per slot in wave scheduling'`);
        await queryRunner.query(`ALTER TABLE "doctor" DROP COLUMN "wave_limit"`);
        await queryRunner.query(`COMMENT ON COLUMN "doctor"."consulting_time" IS 'The time allocated for a single patient consultation in minutes'`);
        await queryRunner.query(`ALTER TABLE "doctor" DROP COLUMN "consulting_time"`);
        await queryRunner.query(`COMMENT ON COLUMN "doctor"."slot_duration" IS 'The duration of a single appointment slot in minutes (e.g., 15, 20, 30)'`);
        await queryRunner.query(`ALTER TABLE "doctor" DROP COLUMN "slot_duration"`);
        await queryRunner.query(`COMMENT ON COLUMN "doctor"."schedule_type" IS 'The scheduling strategy for this doctor'`);
        await queryRunner.query(`ALTER TABLE "doctor" DROP COLUMN "schedule_type"`);
        await queryRunner.query(`DROP TYPE "public"."doctor_schedule_type_enum"`);
        await queryRunner.query(`COMMENT ON COLUMN "doctor_time_slots"."patient_limit" IS 'The maximum number of patients that can book this slot'`);
        await queryRunner.query(`ALTER TABLE "doctor_time_slots" DROP COLUMN "patient_limit"`);
        await queryRunner.query(`COMMENT ON COLUMN "doctor_time_slots"."booked_count" IS 'The current number of patients booked for this slot (for wave scheduling)'`);
        await queryRunner.query(`ALTER TABLE "doctor_time_slots" DROP COLUMN "booked_count"`);
    }

}
