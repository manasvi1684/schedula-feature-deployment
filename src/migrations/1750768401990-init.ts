import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1750768401990 implements MigrationInterface {
    name = 'Init1750768401990'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "doctor_availabilities" ("id" SERIAL NOT NULL, "date" date NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "weekdays" text array, "session" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "doctorDoctorId" integer, CONSTRAINT "PK_2a42931ed0fe3c6934b737c503a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "time_slot" ADD "is_available" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "time_slot" ADD "availabilityId" integer`);
        await queryRunner.query(`ALTER TABLE "doctor_availabilities" ADD CONSTRAINT "FK_062ae0e0c7ff880b65f9bdf35a4" FOREIGN KEY ("doctorDoctorId") REFERENCES "doctor"("doctor_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "time_slot" ADD CONSTRAINT "FK_542a1ffef03df66c2b5fd9226cb" FOREIGN KEY ("availabilityId") REFERENCES "doctor_availabilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "time_slot" DROP CONSTRAINT "FK_542a1ffef03df66c2b5fd9226cb"`);
        await queryRunner.query(`ALTER TABLE "doctor_availabilities" DROP CONSTRAINT "FK_062ae0e0c7ff880b65f9bdf35a4"`);
        await queryRunner.query(`ALTER TABLE "time_slot" DROP COLUMN "availabilityId"`);
        await queryRunner.query(`ALTER TABLE "time_slot" DROP COLUMN "is_available"`);
        await queryRunner.query(`DROP TABLE "doctor_availabilities"`);
    }

}
