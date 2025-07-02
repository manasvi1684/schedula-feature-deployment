import { MigrationInterface, QueryRunner } from "typeorm";

export class FixUserRelationColumns1750615568045 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "doctorDoctorId"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "patientPatientId"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "doctorDoctorId" uuid`);
    await queryRunner.query(`ALTER TABLE "user" ADD "patientPatientId" uuid`);

    }

}
