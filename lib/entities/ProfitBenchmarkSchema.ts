import { EntitySchema } from 'typeorm'

export interface ProfitBenchmark {
  id: string
  category: string
  min_jt: number
  max_jt: number
  outlet_count: number
  radius_km: number
}

export const ProfitBenchmarkSchema = new EntitySchema<ProfitBenchmark>({
  name: 'ProfitBenchmark',
  tableName: 'profit_benchmarks',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    category: { type: 'text', unique: true },
    min_jt: { type: 'integer' },
    max_jt: { type: 'integer' },
    outlet_count: { type: 'integer' },
    radius_km: { type: 'decimal', precision: 3, scale: 1 },
  },
})
