import { DataSource } from 'typeorm'

// Competitor seed data around Sudirman-Semanggi corridor.
// Center: -6.21637, 106.81406 (dekat Plaza Semanggi / Wisma BNI 46)
// Semua titik terverifikasi ≤ 450m dari center (aman untuk query radius 500m)
// 10 entries per kategori × 6 = 60 total
// Revenue already normalized to ±15% around midpoint (ratio ≈ 1.35×).
export async function run(dataSource: DataSource): Promise<void> {
  await dataSource.query(`
    INSERT INTO competitors (name, category, lat, lng, address, revenue_jt) VALUES

    -- ── KOPI & CAFE (10) ─────────────────────────────────────────────────────
    ('Starbucks Plaza Semanggi',         'Kopi & Cafe', -6.2188, 106.8115, 'Plaza Semanggi Lt. 1, Jl. Jend. Sudirman',  600),
    ('Starbucks Wisma BNI 46',           'Kopi & Cafe', -6.2145, 106.8152, 'Wisma BNI 46 Lt. GF, Jl. Jend. Sudirman',  555),
    ('Kopi Kenangan Sudirman Kav 12',    'Kopi & Cafe', -6.2162, 106.8138, 'Jl. Jend. Sudirman Kav. 12',               135),
    ('Janji Jiwa Sudirman Semanggi',     'Kopi & Cafe', -6.2175, 106.8128, 'Jl. Jend. Sudirman, dekat Semanggi',        98),
    ('Tomoro Coffee Semanggi',           'Kopi & Cafe', -6.2193, 106.8112, 'Arteri Semanggi, Jl. Jend. Sudirman',       85),
    ('Fore Coffee Sudirman Tower',       'Kopi & Cafe', -6.2135, 106.8162, 'Sudirman Tower Lt. GF, Kav. 8',            118),
    ('Anomali Coffee Kebon Sirih',       'Kopi & Cafe', -6.2148, 106.8148, 'Jl. Kebon Sirih Raya No. 14',              188),
    ('Tanamera Coffee Sudirman',         'Kopi & Cafe', -6.2168, 106.8140, 'Menara Duta Lt. 1, Jl. Jend. Sudirman',    131),
    ('Kopi Soe Wahid Hasyim',            'Kopi & Cafe', -6.2133, 106.8165, 'Jl. Wahid Hasyim No. 9',                   71),
    ('Common Grounds Semanggi',          'Kopi & Cafe', -6.2200, 106.8125, 'Gedung Le Méridien, Jl. Jend. Sudirman',   220),

    -- ── AYAM GORENG (10) ─────────────────────────────────────────────────────
    ('KFC Plaza Semanggi',               'Ayam Goreng', -6.2190, 106.8113, 'Plaza Semanggi Lt. B1, Jl. Jend. Sudirman', 375),
    ('KFC Wisma BNI 46',                 'Ayam Goreng', -6.2142, 106.8155, 'Wisma BNI 46 Lt. B1, Jl. Jend. Sudirman',  351),
    ('CFC Sudirman Semanggi',            'Ayam Goreng', -6.2178, 106.8125, 'Jl. Jend. Sudirman, dekat Semanggi',        111),
    ('Geprek Bensu Kebon Sirih',         'Ayam Goreng', -6.2155, 106.8142, 'Jl. Kebon Sirih No. 22',                   131),
    ('Ayam Penyet Ria Sudirman',         'Ayam Goreng', -6.2165, 106.8135, 'Jl. Jend. Sudirman Kav. 10',               64),
    ('Sabana Chicken Wahid Hasyim',      'Ayam Goreng', -6.2128, 106.8168, 'Jl. Wahid Hasyim No. 18',                  88),
    ('Ayam Bakar Wong Solo Semanggi',    'Ayam Goreng', -6.2196, 106.8115, 'Arteri Semanggi, Jl. Jend. Sudirman',      75),
    ('Rocket Chicken Sudirman',          'Ayam Goreng', -6.2138, 106.8160, 'Jl. Jend. Sudirman Kav. 6',                68),
    ('Geprek Express Kebon Sirih',       'Ayam Goreng', -6.2148, 106.8145, 'Jl. Kebon Sirih Raya No. 8',               78),
    ('Ayam Geprek Boss Semanggi',        'Ayam Goreng', -6.2195, 106.8118, 'Plaza Semanggi Lt. 2, Jl. Jend. Sudirman', 98),

    -- ── BURGER (10) ──────────────────────────────────────────────────────────
    ('Burger King Plaza Semanggi',       'Burger', -6.2185, 106.8117, 'Plaza Semanggi Lt. 2, Jl. Jend. Sudirman',      268),
    ('Shake Shack Sudirman',             'Burger', -6.2140, 106.8158, 'Gedung Artha Graha, Jl. Jend. Sudirman',        340),
    ('The Burger Lab Kebon Sirih',       'Burger', -6.2152, 106.8145, 'Jl. Kebon Sirih No. 30',                        151),
    ('Flip Burger Sudirman',             'Burger', -6.2170, 106.8132, 'Jl. Jend. Sudirman Kav. 14',                    128),
    ('Smash''d Semanggi',                 'Burger', -6.2195, 106.8118, 'Arteri Semanggi, Jl. Jend. Sudirman',          160),
    ('Fuego Burger Wahid Hasyim',        'Burger', -6.2130, 106.8165, 'Jl. Wahid Hasyim No. 25',                       107),
    ('Burgreens Sudirman',               'Burger', -6.2158, 106.8142, 'Menara Imperium, Jl. Jend. Sudirman',           175),
    ('MOS Burger Plaza Semanggi',        'Burger', -6.2188, 106.8115, 'Plaza Semanggi Lt. 3, Jl. Jend. Sudirman',      203),
    ('Richeese Factory Semanggi',        'Burger', -6.2198, 106.8115, 'Jl. Jend. Sudirman, dekat Semanggi',            128),
    ('Carl''s Jr Sudirman',               'Burger', -6.2145, 106.8150, 'Jl. Jend. Sudirman Kav. 9',                   233),

    -- ── MIE & BAKSO (10) ─────────────────────────────────────────────────────
    ('Bakso Malang Karapitan Semanggi',  'Mie & Bakso', -6.2192, 106.8116, 'Arteri Semanggi, Jl. Jend. Sudirman',      60),
    ('Mie Ayam Pak Kumis Kebon Sirih',   'Mie & Bakso', -6.2150, 106.8148, 'Jl. Kebon Sirih No. 12',                   48),
    ('Bakso Pak Man Sudirman',           'Mie & Bakso', -6.2165, 106.8138, 'Jl. Jend. Sudirman Kav. 11',               55),
    ('Mie Gacoan Semanggi',              'Mie & Bakso', -6.2180, 106.8125, 'Plaza Semanggi Lt. 3, Jl. Jend. Sudirman', 153),
    ('Ippudo Ramen Plaza Semanggi',      'Mie & Bakso', -6.2185, 106.8118, 'Plaza Semanggi Lt. 2, Jl. Jend. Sudirman', 291),
    ('Bakso President Wahid Hasyim',     'Mie & Bakso', -6.2132, 106.8168, 'Jl. Wahid Hasyim No. 32',                  68),
    ('Ramen Santouka Sudirman',          'Mie & Bakso', -6.2138, 106.8158, 'Menara Standard Chartered, Jl. Sudirman',  253),
    ('Mie Tarik Pak Eko Kebon Sirih',    'Mie & Bakso', -6.2155, 106.8142, 'Jl. Kebon Sirih Raya No. 18',              44),
    ('Yoshinoya Wisma BNI',              'Mie & Bakso', -6.2142, 106.8152, 'Wisma BNI 46 Lt. B1, Jl. Jend. Sudirman', 120),
    ('Bakso Benhil Semanggi',            'Mie & Bakso', -6.2200, 106.8123, 'Jl. Jend. Sudirman, Semanggi',             51),

    -- ── MINUMAN (10) ─────────────────────────────────────────────────────────
    ('Chatime Plaza Semanggi',           'Minuman', -6.2183, 106.8120, 'Plaza Semanggi Lt. 1, Jl. Jend. Sudirman',     135),
    ('Chatime Wisma BNI',                'Minuman', -6.2143, 106.8153, 'Wisma BNI 46 Lt. GF, Jl. Jend. Sudirman',     124),
    ('Koi The Semanggi',                 'Minuman', -6.2187, 106.8117, 'Plaza Semanggi Lt. 2, Jl. Jend. Sudirman',    113),
    ('Tealive Sudirman',                 'Minuman', -6.2160, 106.8140, 'Jl. Jend. Sudirman Kav. 13',                   105),
    ('Xing Fu Tang Semanggi',            'Minuman', -6.2193, 106.8113, 'Plaza Semanggi Lt. 2, Jl. Jend. Sudirman',    168),
    ('Mixue Ice Cream Kebon Sirih',      'Minuman', -6.2148, 106.8147, 'Jl. Kebon Sirih No. 16',                       63),
    ('Tiger Sugar Sudirman',             'Minuman', -6.2170, 106.8132, 'Gedung Graha Surya Internusa, Jl. Sudirman',   99),
    ('Juice Kiloan Wahid Hasyim',        'Minuman', -6.2132, 106.8163, 'Jl. Wahid Hasyim No. 12',                      39),
    ('Dakasi Plaza Semanggi',            'Minuman', -6.2186, 106.8116, 'Plaza Semanggi Lt. 3, Jl. Jend. Sudirman',    143),
    ('Boba Time Semanggi',               'Minuman', -6.2197, 106.8117, 'Arteri Semanggi, dekat Semanggi Interchange',  55),

    -- ── LAINNYA (10) ─────────────────────────────────────────────────────────
    ('Pizza Hut Plaza Semanggi',         'Lainnya', -6.2182, 106.8122, 'Plaza Semanggi Lt. 2, Jl. Jend. Sudirman',    280),
    ('Sushi Tei Plaza Semanggi',         'Lainnya', -6.2186, 106.8118, 'Plaza Semanggi Lt. 2, Jl. Jend. Sudirman',    325),
    ('Hokkaido Izakaya Sudirman',        'Lainnya', -6.2145, 106.8150, 'Jl. Jend. Sudirman Kav. 10',                  218),
    ('Warung Padang Sederhana Semanggi', 'Lainnya', -6.2197, 106.8120, 'Arteri Semanggi, Jl. Jend. Sudirman',         75),
    ('D''Cost Seafood Plaza Semanggi',   'Lainnya', -6.2184, 106.8119, 'Plaza Semanggi Lt. 3, Jl. Jend. Sudirman',   191),
    ('Solaria Wisma BNI 46',             'Lainnya', -6.2140, 106.8157, 'Wisma BNI 46 Lt. B1, Jl. Jend. Sudirman',    151),
    ('Nasi Goreng Kambing Kebon Sirih',  'Lainnya', -6.2153, 106.8143, 'Jl. Kebon Sirih No. 24',                      51),
    ('Warung Nasi Bahari Wahid Hasyim',  'Lainnya', -6.2130, 106.8165, 'Jl. Wahid Hasyim No. 6',                      47),
    ('Gokana Ramen Plaza Semanggi',      'Lainnya', -6.2188, 106.8116, 'Plaza Semanggi Lt. 1, Jl. Jend. Sudirman',   128),
    ('Marugame Udon Sudirman',           'Lainnya', -6.2158, 106.8140, 'Menara Topas, Jl. Jend. Sudirman',            143)
  `)
  console.log('Sudirman-Semanggi seed: 60 competitors inserted.')
}
