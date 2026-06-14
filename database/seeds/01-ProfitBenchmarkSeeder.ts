import { DataSource } from 'typeorm'
import { ProfitBenchmarkSchema, ProfitBenchmark } from '../../lib/entities/ProfitBenchmarkSchema'

const benchmarks: Omit<ProfitBenchmark, 'id'>[] = [
  { category: 'Burger',      min_jt: 25, max_jt: 80,  outlet_count: 87,  radius_km: 2.5 },
  { category: 'Ayam Goreng', min_jt: 20, max_jt: 70,  outlet_count: 124, radius_km: 2.5 },
  { category: 'Kopi & Cafe', min_jt: 15, max_jt: 65,  outlet_count: 98,  radius_km: 2.5 },
  { category: 'Mie & Bakso', min_jt: 18, max_jt: 55,  outlet_count: 76,  radius_km: 2.5 },
  { category: 'Minuman',     min_jt: 12, max_jt: 45,  outlet_count: 93,  radius_km: 2.5 },
  { category: 'Lainnya',     min_jt: 15, max_jt: 60,  outlet_count: 210, radius_km: 2.5 },
]

export async function run(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(ProfitBenchmarkSchema)

  for (const b of benchmarks) {
    await repo.upsert(b as ProfitBenchmark, { conflictPaths: ['category'] })
  }

  console.log(`  ✓ profit_benchmarks: ${benchmarks.length} rows upserted`)
}
