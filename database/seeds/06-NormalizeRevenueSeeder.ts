import { DataSource } from 'typeorm'

// Deprecated: revenue_min_jt and revenue_max_jt have been merged into revenue_jt.
// Normalization is no longer needed — seed data already provides single midpoint values.
export async function run(_dataSource: DataSource): Promise<void> {
  console.log('  ✓ normalize_revenue: skipped (revenue_jt column now stores midpoint directly)')
}
