import { DataSource } from 'typeorm'
import { UserSchema } from './entities/UserSchema'
import { SavedAnalysisSchema } from './entities/SavedAnalysisSchema'
import { CompetitorSchema } from './entities/CompetitorSchema'
import { ProfitBenchmarkSchema } from './entities/ProfitBenchmarkSchema'
import { AreaDemographicSchema } from './entities/AreaDemographicSchema'

const entities = [
  UserSchema,
  SavedAnalysisSchema,
  CompetitorSchema,
  ProfitBenchmarkSchema,
  AreaDemographicSchema,
]

function sslConfig() {
  const url = process.env.DATABASE_URL ?? ''
  // Neon and other cloud Postgres require SSL; local Docker postgres does not
  if (url.includes('neon.tech') || url.includes('sslmode=require')) {
    return { rejectUnauthorized: false }
  }
  return false
}

function createDataSource() {
  return new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: sslConfig(),
    entities,
    synchronize: false,
    logging: false,
  })
}

// Use globalThis to survive Next.js HMR in development
const g = globalThis as typeof globalThis & { _orm?: DataSource }

if (!g._orm) {
  g._orm = createDataSource()
}

const AppDataSource = g._orm

export async function getDataSource(): Promise<DataSource> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }
  return AppDataSource
}

export { AppDataSource }
