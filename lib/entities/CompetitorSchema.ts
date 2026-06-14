import { EntitySchema } from 'typeorm'

export interface Competitor {
  id: string
  name: string
  category: string
  lat: number
  lng: number
  address?: string
  revenue_min_jt?: number
  revenue_max_jt?: number
  created_at: Date
}

export const CompetitorSchema = new EntitySchema<Competitor>({
  name: 'Competitor',
  tableName: 'competitors',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    name: { type: 'text' },
    category: { type: 'text' },
    lat: { type: 'double precision' },
    lng: { type: 'double precision' },
    address: { type: 'text', nullable: true },
    revenue_min_jt: { type: 'integer', nullable: true },
    revenue_max_jt: { type: 'integer', nullable: true },
    created_at: { type: 'timestamptz', createDate: true },
  },
  indices: [
    { name: 'competitors_category_idx', columns: ['category'] },
    { name: 'competitors_latlng_idx', columns: ['lat', 'lng'] },
  ],
})
