import { NextResponse } from 'next/server'

// Schema and seed data are now managed via TypeORM:
//   npm run migration:run   — create tables
//   npm run seed            — populate reference data
export async function GET() {
  return NextResponse.json({
    message: 'Database setup is now managed via TypeORM migrations. Run: npm run migration:run && npm run seed',
  })
}

export async function POST() {
  return NextResponse.json({
    message: 'Seed data is now managed via TypeORM seeders. Run: npm run seed',
  })
}
