import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorAppointmentEntity1751378117998
  implements MigrationInterface
{
  name = 'RefactorAppointmentEntity1751378117998';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // This migration now creates the table with the correct final schema
    await queryRunner.query(
      `CREATE TYPE "public"."appointment_status_enum" AS ENUM('scheduled', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "appointment" (
        "appointment_id" SERIAL NOT NULL,
        "date" date NOT NULL,
        "session" character varying NOT NULL,
        "reporting_time" TIME NOT NULL,
        "status" "public"."appointment_status_enum" NOT NULL DEFAULT 'scheduled',
        "reason" text,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "doctor_id" integer,
        "patient_id" integer,
        "slot_id" integer,
        CONSTRAINT "PK_appointment" PRIMARY KEY ("appointment_id")
      )`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "appointment"."date" IS 'The date of the appointment'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "appointment"."session" IS 'The session of the appointment, e.g., morning or evening'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "appointment"."reporting_time" IS 'The specific reporting time for the patient'`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment" ADD CONSTRAINT "FK_appointment_doctor" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("doctor_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment" ADD CONSTRAINT "FK_appointment_patient" FOREIGN KEY ("patient_id") REFERENCES "patient"("patient_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment" ADD CONSTRAINT "FK_appointment_timeslot" FOREIGN KEY ("slot_id") REFERENCES "doctor_time_slots"("slot_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // The down method is the reverse: it drops everything
    await queryRunner.query(
      `ALTER TABLE "appointment" DROP CONSTRAINT "FK_appointment_timeslot"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment" DROP CONSTRAINT "FK_appointment_patient"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment" DROP CONSTRAINT "FK_appointment_doctor"`,
    );
    await queryRunner.query(`DROP TABLE "appointment"`);
    await queryRunner.query(`DROP TYPE "public"."appointment_status_enum"`);
  }
}