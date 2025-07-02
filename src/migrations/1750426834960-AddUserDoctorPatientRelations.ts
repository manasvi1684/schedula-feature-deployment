import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserDoctorPatientRelations1750426834960 implements MigrationInterface {
    name = 'AddUserDoctorPatientRelations1750426834960'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // --- FIX: Create the ENUM types before creating the tables that use them ---
        await queryRunner.query(`CREATE TYPE "public"."user_provider_enum" AS ENUM('local', 'google')`);
        // --- FIX: This now matches your User entity exactly ('doctor', 'patient') ---
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('doctor', 'patient')`);

        // Original commands from your file, now guaranteed to work:
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "name" character varying, "password" character varying, "provider" "public"."user_provider_enum" NOT NULL DEFAULT 'local', "role" "public"."user_role_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "patient" ("patient_id" SERIAL NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "email" character varying NOT NULL, "phone_number" character varying NOT NULL, "gender" character varying NOT NULL, "dob" character varying NOT NULL, "address" character varying NOT NULL, "emergency_contact" character varying NOT NULL, "medical_history" text array, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "password" character varying NOT NULL, "refreshToken" text, "role" character varying NOT NULL DEFAULT 'patient', "userId" uuid, CONSTRAINT "UQ_2c56e61f9e1afb07f28882fcebb" UNIQUE ("email"), CONSTRAINT "REL_6636aefca0bdad8933c7cc3e39" UNIQUE ("userId"), CONSTRAINT "PK_bd1c8f471a2198c19f43987ab05" PRIMARY KEY ("patient_id"))`);
        await queryRunner.query(`CREATE TABLE "appointment" ("appointment_id" SERIAL NOT NULL, "appointment_date" character varying NOT NULL, "time_slot" character varying NOT NULL, "appointment_status" character varying NOT NULL, "reason" character varying, "notes" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "doctorDoctorId" integer, "patientPatientId" integer, CONSTRAINT "PK_ee9f73735a635356d4da9bd3e69" PRIMARY KEY ("appointment_id"))`);
        await queryRunner.query(`CREATE TABLE "time_slot" ("slot_id" SERIAL NOT NULL, "day_of_week" character varying NOT NULL, "start_time" character varying NOT NULL, "end_time" character varying NOT NULL, "doctorDoctorId" integer, CONSTRAINT "PK_bfc3df46b6c1e3880a06ec3ada6" PRIMARY KEY ("slot_id"))`);
        await queryRunner.query(`CREATE TABLE "doctor" ("doctor_id" SERIAL NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "email" character varying NOT NULL, "phone_number" character varying NOT NULL, "specialization" character varying NOT NULL, "experience_years" integer NOT NULL, "education" character varying NOT NULL, "clinic_name" character varying NOT NULL, "clinic_address" character varying NOT NULL, "available_days" text array NOT NULL, "role" character varying NOT NULL DEFAULT 'doctor', "password" character varying NOT NULL, "refreshToken" text, "userId" uuid, CONSTRAINT "UQ_bf6303ac911efaab681dc911f54" UNIQUE ("email"), CONSTRAINT "REL_e573a17ab8b6eea2b7fe9905fa" UNIQUE ("userId"), CONSTRAINT "PK_e2959c517497025482609c0166c" PRIMARY KEY ("doctor_id"))`);
        await queryRunner.query(`ALTER TABLE "patient" ADD CONSTRAINT "FK_6636aefca0bdad8933c7cc3e394" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_13a204ffe250d1ed48e4c864850" FOREIGN KEY ("doctorDoctorId") REFERENCES "doctor"("doctor_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_2fb16d91a58e4f16b4a71ed33dc" FOREIGN KEY ("patientPatientId") REFERENCES "patient"("patient_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "time_slot" ADD CONSTRAINT "FK_3d3f2eb0221fbbb90fcd38fb864" FOREIGN KEY ("doctorDoctorId") REFERENCES "doctor"("doctor_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "doctor" ADD CONSTRAINT "FK_e573a17ab8b6eea2b7fe9905fa8" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop constraints first
        await queryRunner.query(`ALTER TABLE "doctor" DROP CONSTRAINT "FK_e573a17ab8b6eea2b7fe9905fa8"`);
        await queryRunner.query(`ALTER TABLE "time_slot" DROP CONSTRAINT "FK_3d3f2eb0221fbbb90fcd38fb864"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_2fb16d91a58e4f16b4a71ed33dc"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_13a204ffe250d1ed48e4c864850"`);
        await queryRunner.query(`ALTER TABLE "patient" DROP CONSTRAINT "FK_6636aefca0bdad8933c7cc3e394"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "doctor"`);
        await queryRunner.query(`DROP TABLE "time_slot"`);
        await queryRunner.query(`DROP TABLE "appointment"`);
        await queryRunner.query(`DROP TABLE "patient"`);
        await queryRunner.query(`DROP TABLE "user"`);
        
        // --- FIX: Finally, drop the custom ENUM types ---
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_provider_enum"`);
    }

}