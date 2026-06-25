import { DataSource } from 'typeorm'

// Normalize all competitor revenue ranges to ±15% around the midpoint.
// Formula: new_min = ROUND(mid * 0.85), new_max = ROUND(mid * 1.15)
// Result: ratio ≈ 1.35× (down from 1.77–2.48× in original data).
// Idempotent: running twice produces the same result.
export async function run(dataSource: DataSource): Promise<void> {
  const result = await dataSource.query(`
    UPDATE competitors
    SET
      revenue_min_jt = GREATEST(5, ROUND(((revenue_min_jt + revenue_max_jt) / 2.0) * 0.85)),
      revenue_max_jt = GREATEST(5, ROUND(((revenue_min_jt + revenue_max_jt) / 2.0) * 1.15))
  `)
  console.log(`  ✓ normalize_revenue: ${result[1] ?? 'all'} rows updated (ratio normalized to ≈1.35×)`)
}
