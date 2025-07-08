import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorAvailabilitySchema1751970351404 implements MigrationInterface {
    name = 'RefactorAvailabilitySchema1751970351404'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // --- Step 1: Safely drop foreign keys before modifying tables ---
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_appointment_doctor"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_appointment_patient"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_appointment_timeslot"`);

        // --- Step 2: Drop old columns ---
        await queryRunner.query(`ALTER TABLE "doctor_availabilities" DROP COLUMN "start_time"`);
        await queryRunner.query(`ALTER TABLE "doctor_availabilities" DROP COLUMN "end_time"`);

        // --- Step 3: Add new columns with temporary defaults ---
        await queryRunner.query(`CREATE TYPE "public"."doctor_availabilities_type_enum" AS ENUM('custom_date', 'recurring')`);
        await queryRunner.query(`ALTER TABLE "doctor_availabilities" ADD "type" "public"."doctor_availabilities_type_enum" NOT NULL DEFAULT 'custom_date'`);
        
        // Add columns with a default value to handle existing rows
        await queryRunner.query(`ALTER TABLE "doctor_availabilities" ADD "consulting_start_time" TIME NOT NULL DEFAULT '00:00:00'`);
        await queryRunner.query(`ALTER TABLE "doctor_availabilities" ADD "consulting_end_time" TIME NOT NULL DEFAULT '00:00:00'`);

        // --- Step 4: Immediately remove the defaults so new rows require a value ---
        await queryRunner.query(`ALTER TABLE "doctor_availabilities" ALTER COLUMN "consulting_start_time" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "doctor_availabilities" ALTER COLUMN "consulting_end_time" DROP DEFAULT`);
        
        // --- Step 5: Make other columns nullable ---
        await queryRunner.query(`ALTER TABLE "doctor_availabilities" ALTER COLUMN "date" DROP NOT NULL`);

        // --- Step 6: Re-add foreign keys with new auto-generated names ---
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_9a9c484aa4a944eaec632e00a81" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("doctor_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_86b3e35a97e289071b4785a1402" FOREIGN KEY ("patient_id") REFERENCES "patient"("patient_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_9f9596ccb3fe8e63358d9bfcbdb" FOREIGN KEY ("slot_id") REFERENCES "doctor_time_slots"("slot_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // --- Revert everything in reverse order ---
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_9f9596ccb3fe8e63358d9bfcbdb"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_86b3e35a97e289071b4785a1402"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_9a9c484aa4a944eaec632e00a81"`);
        
        await queryRunner.query(`ALTER TABLE "doctor_availabilities" ALTER COLUMN "date" SET NOT NULL`);
        
        await queryRunner.query(`ALTER TABLE "doctor_availabilities" DROP COLUMN "consulting_end_time"`);
        await queryRunner.query(`ALTER TABLE "doctor_availabilities" DROP COLUMN "consulting_start_time"`);
        await queryRunner.query(`ALTER TABLE "doctor_availabilities" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."doctor_availabilities_type_enum"`);

        await queryRunner.query(`ALTER TABLE "doctor_availabilities" ADD "end_time" TIME NOT NULL`);
        await queryRunner.query(`ALTER TABLE "doctor_availabilities" ADD "start_time" TIME NOT NULL`);

        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_appointment_timeslot" FOREIGN KEY ("slot_id") REFERENCES "doctor_time_slots"("slot_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_appointment_patient" FOREIGN KEY ("patient_id") REFERENCES "patient"("patient_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_appointment_doctor" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("doctor_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}