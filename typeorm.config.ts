import 'dotenv/config'
import { DataSource } from 'typeorm'
import { UserSchema } from './lib/entities/UserSchema'
import { SavedAnalysisSchema } from './lib/entities/SavedAnalysisSchema'
import { CompetitorSchema } from './lib/entities/CompetitorSchema'
import { ProfitBenchmarkSchema } from './lib/entities/ProfitBenchmarkSchema'
import { AreaDemographicSchema } from './lib/entities/AreaDemographicSchema'

const url = process.env.DATABASE_URL ?? ''
const ssl = url.includes('neon.tech') || url.includes('sslmode=require')
  ? { rejectUnauthorized: false }
  : false

export default new DataSource({
  type: 'postgres',
  url,
  ssl,
  entities: [
    UserSchema,
    SavedAnalysisSchema,
    CompetitorSchema,
    ProfitBenchmarkSchema,
    AreaDemographicSchema,
  ],
  migrations: ['database/migrations/*.ts'],
  synchronize: false,
  logging: true,
})
