import 'dotenv/config'
import AppDataSource from '../../typeorm.config'
import { run as seedProfitBenchmarks } from './01-ProfitBenchmarkSeeder'
import { run as seedCompetitors } from './02-CompetitorSeeder'
import { run as seedAreaDemographics } from './03-AreaDemographicSeeder'

async function main() {
  console.log('Connecting to database...')
  await AppDataSource.initialize()

  console.log('Running seeders...')
  await seedProfitBenchmarks(AppDataSource)
  await seedCompetitors(AppDataSource)
  await seedAreaDemographics(AppDataSource)

  console.log('All seeds complete.')
  await AppDataSource.destroy()
}

main().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
