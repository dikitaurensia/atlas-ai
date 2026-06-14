import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitialSchema1749900000000 implements MigrationInterface {
  name = 'InitialSchema1749900000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name          TEXT NOT NULL,
        bisnis_name   TEXT,
        email         TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS users_email_idx ON users (email)`)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS saved_analyses (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        location    TEXT NOT NULL,
        category    TEXT NOT NULL,
        lat         DOUBLE PRECISION NOT NULL,
        lng         DOUBLE PRECISION NOT NULL,
        radius      INTEGER NOT NULL,
        overall     INTEGER NOT NULL,
        grade       TEXT NOT NULL,
        result_json JSONB NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS saved_analyses_user_idx ON saved_analyses (user_id, created_at DESC)`)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS competitors (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name           TEXT NOT NULL,
        category       TEXT NOT NULL,
        lat            DOUBLE PRECISION NOT NULL,
        lng            DOUBLE PRECISION NOT NULL,
        address        TEXT,
        revenue_min_jt INTEGER,
        revenue_max_jt INTEGER,
        created_at     TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS competitors_category_idx ON competitors (category)`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS competitors_latlng_idx ON competitors (lat, lng)`)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS profit_benchmarks (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category     TEXT NOT NULL UNIQUE,
        min_jt       INTEGER NOT NULL,
        max_jt       INTEGER NOT NULL,
        outlet_count INTEGER NOT NULL,
        radius_km    DECIMAL(3,1) NOT NULL
      )
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS area_demographics (
        id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name               TEXT NOT NULL,
        lat_min            DOUBLE PRECISION NOT NULL,
        lat_max            DOUBLE PRECISION NOT NULL,
        lng_min            DOUBLE PRECISION NOT NULL,
        lng_max            DOUBLE PRECISION NOT NULL,
        population_density INTEGER NOT NULL,
        income_index       INTEGER NOT NULL,
        area_type          TEXT NOT NULL
      )
    `)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS area_demographics_bbox_idx ON area_demographics (lat_min, lat_max, lng_min, lng_max)`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS saved_analyses`)
    await queryRunner.query(`DROP TABLE IF EXISTS users`)
    await queryRunner.query(`DROP TABLE IF EXISTS competitors`)
    await queryRunner.query(`DROP TABLE IF EXISTS profit_benchmarks`)
    await queryRunner.query(`DROP TABLE IF EXISTS area_demographics`)
  }
}
