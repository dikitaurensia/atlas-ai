import { MigrationInterface, QueryRunner } from 'typeorm'

export class MergeRevenueColumn1750000000000 implements MigrationInterface {
  name = 'MergeRevenueColumn1750000000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE competitors ADD COLUMN revenue_jt INTEGER`)
    await queryRunner.query(`
      UPDATE competitors
      SET revenue_jt = GREATEST(5, ROUND((COALESCE(revenue_min_jt, 0) + COALESCE(revenue_max_jt, 0)) / 2.0))
      WHERE revenue_min_jt IS NOT NULL OR revenue_max_jt IS NOT NULL
    `)
    await queryRunner.query(`ALTER TABLE competitors DROP COLUMN IF EXISTS revenue_min_jt`)
    await queryRunner.query(`ALTER TABLE competitors DROP COLUMN IF EXISTS revenue_max_jt`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE competitors ADD COLUMN revenue_min_jt INTEGER`)
    await queryRunner.query(`ALTER TABLE competitors ADD COLUMN revenue_max_jt INTEGER`)
    await queryRunner.query(`
      UPDATE competitors
      SET
        revenue_min_jt = GREATEST(5, ROUND(revenue_jt * 0.85)),
        revenue_max_jt = GREATEST(5, ROUND(revenue_jt * 1.15))
      WHERE revenue_jt IS NOT NULL
    `)
    await queryRunner.query(`ALTER TABLE competitors DROP COLUMN IF EXISTS revenue_jt`)
  }
}
