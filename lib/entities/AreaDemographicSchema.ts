import { EntitySchema } from 'typeorm'

export interface AreaDemographic {
  id: string
  name: string
  lat_min: number
  lat_max: number
  lng_min: number
  lng_max: number
  population_density: number
  income_index: number
  area_type: string
}

export const AreaDemographicSchema = new EntitySchema<AreaDemographic>({
  name: 'AreaDemographic',
  tableName: 'area_demographics',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    name: { type: 'text' },
    lat_min: { type: 'double precision' },
    lat_max: { type: 'double precision' },
    lng_min: { type: 'double precision' },
    lng_max: { type: 'double precision' },
    population_density: { type: 'integer' },
    income_index: { type: 'integer' },
    area_type: { type: 'text' },
  },
  indices: [
    { name: 'area_demographics_bbox_idx', columns: ['lat_min', 'lat_max', 'lng_min', 'lng_max'] },
  ],
})
