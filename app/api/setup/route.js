import { NextResponse } from 'next/server'
import sql from '@/lib/db'

// Call this endpoint once to initialize the database schema.
// Idempotent — safe to run multiple times.
export async function GET(req) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('token') !== process.env.SETUP_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        TEXT NOT NULL,
        bisnis_name TEXT,
        email       TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `
    await sql`CREATE INDEX IF NOT EXISTS users_email_idx ON users (email)`

    await sql`
      CREATE TABLE IF NOT EXISTS saved_analyses (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        location    TEXT NOT NULL,
        category    TEXT NOT NULL,
        lat         DOUBLE PRECISION NOT NULL,
        lng         DOUBLE PRECISION NOT NULL,
        radius      INTEGER NOT NULL,
        overall     INTEGER NOT NULL,
        grade       TEXT NOT NULL,
        result_json JSONB NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `
    await sql`CREATE INDEX IF NOT EXISTS saved_analyses_user_idx ON saved_analyses (user_id, created_at DESC)`

    await sql`
      CREATE TABLE IF NOT EXISTS competitors (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name       TEXT NOT NULL,
        category   TEXT NOT NULL,
        lat        DOUBLE PRECISION NOT NULL,
        lng        DOUBLE PRECISION NOT NULL,
        address    TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
    await sql`CREATE INDEX IF NOT EXISTS competitors_category_idx ON competitors (category)`
    await sql`CREATE INDEX IF NOT EXISTS competitors_latlng_idx ON competitors (lat, lng)`

    await sql`
      CREATE TABLE IF NOT EXISTS profit_benchmarks (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category      TEXT NOT NULL UNIQUE,
        min_jt        INTEGER NOT NULL,
        max_jt        INTEGER NOT NULL,
        outlet_count  INTEGER NOT NULL,
        radius_km     DECIMAL(3,1) NOT NULL
      )
    `

    return NextResponse.json({ ok: true, message: 'Database initialized (users + saved_analyses + competitors + profit_benchmarks)' })
  } catch (err) {
    console.error('[setup]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/setup?token=... — seed competitor & benchmark data (idempotent)
export async function POST(req) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('token') !== process.env.SETUP_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Upsert profit benchmarks
    await sql`
      INSERT INTO profit_benchmarks (category, min_jt, max_jt, outlet_count, radius_km) VALUES
        ('Burger',      25, 80,  87,  2.5),
        ('Ayam Goreng', 20, 70,  124, 2.5),
        ('Kopi & Cafe', 15, 65,  98,  2.5),
        ('Mie & Bakso', 18, 55,  76,  2.5),
        ('Minuman',     12, 45,  93,  2.5),
        ('Lainnya',     15, 60,  210, 2.5)
      ON CONFLICT (category) DO UPDATE SET
        min_jt = EXCLUDED.min_jt, max_jt = EXCLUDED.max_jt,
        outlet_count = EXCLUDED.outlet_count, radius_km = EXCLUDED.radius_km
    `

    // Clear and re-seed competitors
    await sql`TRUNCATE TABLE competitors`
    await sql`
      INSERT INTO competitors (name, category, lat, lng, address) VALUES
        -- BURGER
        ('McDonalds Sudirman',         'Burger', -6.2088, 106.8221, 'Jl. Jend. Sudirman'),
        ('Burger King SCBD',           'Burger', -6.2241, 106.8098, 'SCBD Jakarta'),
        ('McDonalds Kelapa Gading',    'Burger', -6.1583, 106.9063, 'Kelapa Gading'),
        ('Burger King Kemang',         'Burger', -6.2622, 106.8129, 'Jl. Kemang Raya'),
        ('Richeese Blok M',            'Burger', -6.2441, 106.7983, 'Blok M Plaza'),
        ('McDonalds Senayan',          'Burger', -6.2183, 106.8025, 'Senayan City'),
        ('Shake Shack SCBD',           'Burger', -6.2260, 106.8090, 'Pacific Place SCBD'),
        ('Burger King Kuningan',       'Burger', -6.2310, 106.8318, 'Kuningan City'),
        ('McDonalds Tebet',            'Burger', -6.2264, 106.8583, 'Jl. Tebet Raya'),
        ('Wendys Kelapa Gading',       'Burger', -6.1600, 106.9080, 'Mall Kelapa Gading'),
        ('Burger King Fatmawati',      'Burger', -6.2897, 106.7960, 'Jl. RS. Fatmawati'),
        ('Flame Burger Kemang',        'Burger', -6.2650, 106.8150, 'Kemang Village'),
        ('McDonalds PIK',              'Burger', -6.1197, 106.7449, 'PIK Avenue'),
        ('Burger Bangor Cikini',       'Burger', -6.1948, 106.8449, 'Jl. Cikini Raya'),
        ('Burgushi Menteng',           'Burger', -6.1944, 106.8389, 'Jl. HOS. Cokroaminoto'),

        -- AYAM GORENG
        ('KFC Sudirman',               'Ayam Goreng', -6.2095, 106.8215, 'Jl. Jend. Sudirman'),
        ('CFC Blok M',                 'Ayam Goreng', -6.2450, 106.7990, 'Blok M Square'),
        ('Geprek Bensu Kemang',        'Ayam Goreng', -6.2640, 106.8140, 'Jl. Kemang Raya'),
        ('Sabana Kelapa Gading',       'Ayam Goreng', -6.1590, 106.9070, 'Kelapa Gading'),
        ('Ayam Geprek Senayan',        'Ayam Goreng', -6.2190, 106.8030, 'Senayan'),
        ('KFC Kelapa Gading',          'Ayam Goreng', -6.1575, 106.9055, 'Mall Kelapa Gading'),
        ('CFC Kuningan',               'Ayam Goreng', -6.2320, 106.8330, 'Kuningan'),
        ('Geprek Express Fatmawati',   'Ayam Goreng', -6.2890, 106.7970, 'Jl. Fatmawati'),
        ('Ayam Bakar Mas Boy Tebet',   'Ayam Goreng', -6.2280, 106.8590, 'Jl. Tebet Barat'),
        ('Ayam Penyet Ria Menteng',    'Ayam Goreng', -6.1955, 106.8395, 'Jl. Menteng'),
        ('KFC Pondok Indah',           'Ayam Goreng', -6.2825, 106.7895, 'Pondok Indah Mall'),
        ('CFC PIK',                    'Ayam Goreng', -6.1205, 106.7455, 'PIK'),
        ('Sabana Tebet',               'Ayam Goreng', -6.2270, 106.8575, 'Tebet'),
        ('KFC SCBD',                   'Ayam Goreng', -6.2245, 106.8100, 'SCBD'),
        ('Geprek Express Cikini',      'Ayam Goreng', -6.1950, 106.8440, 'Jl. Cikini'),

        -- KOPI & CAFE
        ('Kopi Kenangan Sudirman',     'Kopi & Cafe', -6.2082, 106.8218, 'Jl. Jend. Sudirman'),
        ('Janji Jiwa SCBD',            'Kopi & Cafe', -6.2235, 106.8092, 'SCBD'),
        ('Fore Coffee Senayan',        'Kopi & Cafe', -6.2178, 106.8022, 'Senayan'),
        ('Tomoro Coffee Kemang',       'Kopi & Cafe', -6.2618, 106.8125, 'Kemang'),
        ('Kopi Soe Blok M',            'Kopi & Cafe', -6.2438, 106.7978, 'Blok M'),
        ('Starbucks Sudirman',         'Kopi & Cafe', -6.2090, 106.8228, 'Jl. Jend. Sudirman'),
        ('Starbucks Senayan',          'Kopi & Cafe', -6.2186, 106.8028, 'Senayan City'),
        ('Starbucks Kelapa Gading',    'Kopi & Cafe', -6.1580, 106.9060, 'Mall Kelapa Gading'),
        ('Janji Jiwa Tebet',           'Kopi & Cafe', -6.2258, 106.8580, 'Tebet'),
        ('Kopi Kenangan Kelapa Gading','Kopi & Cafe', -6.1588, 106.9068, 'Kelapa Gading'),
        ('Tomoro Coffee Kuningan',     'Kopi & Cafe', -6.2315, 106.8322, 'Kuningan'),
        ('Fore Coffee Menteng',        'Kopi & Cafe', -6.1948, 106.8392, 'Menteng'),
        ('Kopi Soe PIK',               'Kopi & Cafe', -6.1200, 106.7452, 'PIK'),
        ('Starbucks Pondok Indah',     'Kopi & Cafe', -6.2828, 106.7898, 'Pondok Indah Mall'),
        ('Janji Jiwa Fatmawati',       'Kopi & Cafe', -6.2893, 106.7965, 'Fatmawati'),
        ('Kopi Kenangan Cikini',       'Kopi & Cafe', -6.1945, 106.8445, 'Jl. Cikini Raya'),

        -- MIE & BAKSO
        ('Mie Gacoan Blok M',          'Mie & Bakso', -6.2442, 106.7982, 'Blok M'),
        ('Bakso Malang Kelapa Gading', 'Mie & Bakso', -6.1582, 106.9062, 'Kelapa Gading'),
        ('Mie Gacoan Kemang',          'Mie & Bakso', -6.2625, 106.8132, 'Kemang'),
        ('Bakso Pak Man Tebet',        'Mie & Bakso', -6.2268, 106.8588, 'Tebet'),
        ('Mie Ayam Solo Menteng',      'Mie & Bakso', -6.1950, 106.8394, 'Menteng'),
        ('Bakso Urat Sudirman',        'Mie & Bakso', -6.2085, 106.8220, 'Sudirman'),
        ('Mie Gacoan Senayan',         'Mie & Bakso', -6.2182, 106.8024, 'Senayan'),
        ('Bakso Malang Fatmawati',     'Mie & Bakso', -6.2895, 106.7968, 'Fatmawati'),
        ('Mie Gacoan PIK',             'Mie & Bakso', -6.1202, 106.7453, 'PIK'),
        ('Bakso Urat Kuningan',        'Mie & Bakso', -6.2312, 106.8320, 'Kuningan'),
        ('Mie Gacoan Cikini',          'Mie & Bakso', -6.1952, 106.8448, 'Cikini'),

        -- MINUMAN
        ('Chatime Sudirman',           'Minuman', -6.2087, 106.8222, 'Sudirman'),
        ('Mixue Kelapa Gading',        'Minuman', -6.1585, 106.9065, 'Kelapa Gading'),
        ('Chatime Senayan',            'Minuman', -6.2185, 106.8027, 'Senayan'),
        ('Mixue Blok M',               'Minuman', -6.2440, 106.7980, 'Blok M'),
        ('KOI The SCBD',               'Minuman', -6.2238, 106.8095, 'SCBD'),
        ('Chatime Kemang',             'Minuman', -6.2620, 106.8128, 'Kemang'),
        ('Mixue Tebet',                'Minuman', -6.2262, 106.8582, 'Tebet'),
        ('Xi Bo Ba Menteng',           'Minuman', -6.1946, 106.8390, 'Menteng'),
        ('Chatime PIK',                'Minuman', -6.1198, 106.7450, 'PIK'),
        ('Mixue Fatmawati',            'Minuman', -6.2892, 106.7962, 'Fatmawati'),
        ('Boba Time Kuningan',         'Minuman', -6.2318, 106.8325, 'Kuningan'),
        ('Chatime Cikini',             'Minuman', -6.1947, 106.8442, 'Cikini'),

        -- LAINNYA
        ('Nusantara Kitchen Sudirman', 'Lainnya', -6.2083, 106.8216, 'Sudirman'),
        ('Restoran Kemang Village',    'Lainnya', -6.2622, 106.8130, 'Kemang'),
        ('Warung Makan Tebet',         'Lainnya', -6.2266, 106.8585, 'Tebet'),
        ('Kafe Menteng',               'Lainnya', -6.1942, 106.8388, 'Menteng'),
        ('Restoran Senayan',           'Lainnya', -6.2188, 106.8026, 'Senayan'),
        ('Warung Blok M',              'Lainnya', -6.2436, 106.7976, 'Blok M'),
        ('Kafe PIK',                   'Lainnya', -6.1195, 106.7448, 'PIK'),
        ('Resto Kelapa Gading',        'Lainnya', -6.1578, 106.9058, 'Kelapa Gading'),
        ('Warung Fatmawati',           'Lainnya', -6.2888, 106.7958, 'Fatmawati'),
        ('Kafe Kuningan',              'Lainnya', -6.2308, 106.8315, 'Kuningan')
    `

    const [{ count }] = await sql`SELECT COUNT(*) FROM competitors`
    return NextResponse.json({ ok: true, message: `Seeded ${count} competitors + 6 profit benchmarks` })
  } catch (err) {
    console.error('[seed]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
