import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1750772762829 implements MigrationInterface {
    name = 'Init1750772762829'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "doctor_availabilities" DROP CONSTRAINT "FK_062ae0e0c7ff880b65f9bdf35a4"`);
        await queryRunner.query(`ALTER TABLE "doctor_availabilities" RENAME COLUMN "doctorDoctorId" TO "doctor_id"`);
        await queryRunner.query(`CREATE TABLE "doctor_time_slots" ("slot_id" SERIAL NOT NULL, "date" date NOT NULL, "day_of_week" character varying NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "is_available" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "doctor_id" integer, "availability_id" integer, CONSTRAINT "PK_b0ccef5218619cb78eec89ba5d5" PRIMARY KEY ("slot_id"))`);
        await queryRunner.query(`ALTER TABLE "doctor_availabilities" ADD CONSTRAINT "FK_aa49ce7b9ff575a2963abcb6910" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("doctor_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "doctor_time_slots" ADD CONSTRAINT "FK_2cedde845f4a3669d3fa669c1cf" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("doctor_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "doctor_time_slots" ADD CONSTRAINT "FK_2f49b486fc98e4de92becb5fb6c" FOREIGN KEY ("availability_id") REFERENCES "doctor_availabilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "doctor_time_slots" DROP CONSTRAINT "FK_2f49b486fc98e4de92becb5fb6c"`);
        await queryRunner.query(`ALTER TABLE "doctor_time_slots" DROP CONSTRAINT "FK_2cedde845f4a3669d3fa669c1cf"`);
        await queryRunner.query(`ALTER TABLE "doctor_availabilities" DROP CONSTRAINT "FK_aa49ce7b9ff575a2963abcb6910"`);
        await queryRunner.query(`DROP TABLE "doctor_time_slots"`);
        await queryRunner.query(`ALTER TABLE "doctor_availabilities" RENAME COLUMN "doctor_id" TO "doctorDoctorId"`);
        await queryRunner.query(`ALTER TABLE "doctor_availabilities" ADD CONSTRAINT "FK_062ae0e0c7ff880b65f9bdf35a4" FOREIGN KEY ("doctorDoctorId") REFERENCES "doctor"("doctor_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
