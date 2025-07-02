import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1750428488265 implements MigrationInterface {
    name = 'Init1750428488265'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "patient" DROP COLUMN "password"`);
        await queryRunner.query(`ALTER TABLE "patient" DROP COLUMN "refreshToken"`);
        await queryRunner.query(`ALTER TABLE "doctor" DROP COLUMN "password"`);
        await queryRunner.query(`ALTER TABLE "doctor" DROP COLUMN "refreshToken"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "doctor" ADD "refreshToken" text`);
        await queryRunner.query(`ALTER TABLE "doctor" ADD "password" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "patient" ADD "refreshToken" text`);
        await queryRunner.query(`ALTER TABLE "patient" ADD "password" character varying NOT NULL`);
    }

}
