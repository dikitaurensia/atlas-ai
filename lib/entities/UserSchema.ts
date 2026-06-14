import { EntitySchema } from 'typeorm'

export interface User {
  id: string
  name: string
  bisnis_name?: string
  email: string
  password_hash: string
  created_at: Date
}

export const UserSchema = new EntitySchema<User>({
  name: 'User',
  tableName: 'users',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    name: { type: 'text' },
    bisnis_name: { type: 'text', nullable: true },
    email: { type: 'text', unique: true },
    password_hash: { type: 'text' },
    created_at: { type: 'timestamptz', createDate: true },
  },
  indices: [
    { name: 'users_email_idx', columns: ['email'] },
  ],
})
