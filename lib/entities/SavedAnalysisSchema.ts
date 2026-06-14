import { EntitySchema } from 'typeorm'

export interface SavedAnalysis {
  id: string
  user_id: string
  location: string
  category: string
  lat: number
  lng: number
  radius: number
  overall: number
  grade: string
  result_json: Record<string, unknown>
  created_at: Date
}

export const SavedAnalysisSchema = new EntitySchema<SavedAnalysis>({
  name: 'SavedAnalysis',
  tableName: 'saved_analyses',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    user_id: { type: 'uuid' },
    location: { type: 'text' },
    category: { type: 'text' },
    lat: { type: 'double precision' },
    lng: { type: 'double precision' },
    radius: { type: 'integer' },
    overall: { type: 'integer' },
    grade: { type: 'text' },
    result_json: { type: 'jsonb' },
    created_at: { type: 'timestamptz', createDate: true },
  },
  indices: [
    { name: 'saved_analyses_user_idx', columns: ['user_id', 'created_at'] },
  ],
})
