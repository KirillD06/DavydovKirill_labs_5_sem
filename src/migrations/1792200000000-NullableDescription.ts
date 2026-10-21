import { MigrationInterface, QueryRunner } from 'typeorm';

export class NullableDescription1792200000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE soil_types ALTER COLUMN description DROP NOT NULL, ALTER COLUMN description DROP DEFAULT`);
    await queryRunner.query(`UPDATE soil_types SET description = NULL WHERE status = 'draft' AND description = ''`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE soil_types SET description = '' WHERE description IS NULL`);
    await queryRunner.query(`ALTER TABLE soil_types ALTER COLUMN description SET DEFAULT '', ALTER COLUMN description SET NOT NULL`);
  }
}
