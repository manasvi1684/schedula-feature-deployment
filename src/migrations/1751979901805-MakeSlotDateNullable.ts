import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeSlotDateNullable1751979901805 implements MigrationInterface {
    name = 'MakeSlotDateNullable1751979901805'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "doctor_time_slots" ALTER COLUMN "date" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "doctor_time_slots" ALTER COLUMN "date" SET NOT NULL`);
    }

}
