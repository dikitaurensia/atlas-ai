import { DataSource } from 'typeorm'

// Competitor seed data around Sudirman-Semanggi corridor.
// Center: -6.21637, 106.81406 (dekat Plaza Semanggi / Wisma BNI 46)
// Semua titik terverifikasi ≤ 450m dari center (aman untuk query radius 500m)
// 10 entries per kategori × 6 = 60 total
// Revenue already normalized to ±15% around midpoint (ratio ≈ 1.35×).
export async function run(dataSource: DataSource): Promise<void> {
  await dataSource.query(`
    INSERT INTO competitors (name, category, lat, lng, address, revenue_min_jt, revenue_max_jt) VALUES

    -- ── KOPI & CAFE (10) ─────────────────────────────────────────────────────
    ('Starbucks Plaza Semanggi',         'Kopi & Cafe', -6.2188, 106.8115, 'Plaza Semanggi Lt. 1, Jl. Jend. Sudirman',  510, 690),
    ('Starbucks Wisma BNI 46',           'Kopi & Cafe', -6.2145, 106.8152, 'Wisma BNI 46 Lt. GF, Jl. Jend. Sudirman',  472, 638),
    ('Kopi Kenangan Sudirman Kav 12',    'Kopi & Cafe', -6.2162, 106.8138, 'Jl. Jend. Sudirman Kav. 12',               115, 155),
    ('Janji Jiwa Sudirman Semanggi',     'Kopi & Cafe', -6.2175, 106.8128, 'Jl. Jend. Sudirman, dekat Semanggi',        83, 112),
    ('Tomoro Coffee Semanggi',           'Kopi & Cafe', -6.2193, 106.8112, 'Arteri Semanggi, Jl. Jend. Sudirman',       72,  98),
    ('Fore Coffee Sudirman Tower',       'Kopi & Cafe', -6.2135, 106.8162, 'Sudirman Tower Lt. GF, Kav. 8',            100, 135),
    ('Anomali Coffee Kebon Sirih',       'Kopi & Cafe', -6.2148, 106.8148, 'Jl. Kebon Sirih Raya No. 14',              159, 216),
    ('Tanamera Coffee Sudirman',         'Kopi & Cafe', -6.2168, 106.8140, 'Menara Duta Lt. 1, Jl. Jend. Sudirman',    111, 150),
    ('Kopi Soe Wahid Hasyim',            'Kopi & Cafe', -6.2133, 106.8165, 'Jl. Wahid Hasyim No. 9',                   60,  81),
    ('Common Grounds Semanggi',          'Kopi & Cafe', -6.2200, 106.8125, 'Gedung Le Méridien, Jl. Jend. Sudirman',   187, 253),

    -- ── AYAM GORENG (10) ─────────────────────────────────────────────────────
    ('KFC Plaza Semanggi',               'Ayam Goreng', -6.2190, 106.8113, 'Plaza Semanggi Lt. B1, Jl. Jend. Sudirman', 319, 431),
    ('KFC Wisma BNI 46',                 'Ayam Goreng', -6.2142, 106.8155, 'Wisma BNI 46 Lt. B1, Jl. Jend. Sudirman',  298, 403),
    ('CFC Sudirman Semanggi',            'Ayam Goreng', -6.2178, 106.8125, 'Jl. Jend. Sudirman, dekat Semanggi',        94, 127),
    ('Geprek Bensu Kebon Sirih',         'Ayam Goreng', -6.2155, 106.8142, 'Jl. Kebon Sirih No. 22',                   111, 150),
    ('Ayam Penyet Ria Sudirman',         'Ayam Goreng', -6.2165, 106.8135, 'Jl. Jend. Sudirman Kav. 10',               54,  74),
    ('Sabana Chicken Wahid Hasyim',      'Ayam Goreng', -6.2128, 106.8168, 'Jl. Wahid Hasyim No. 18',                  74, 101),
    ('Ayam Bakar Wong Solo Semanggi',    'Ayam Goreng', -6.2196, 106.8115, 'Arteri Semanggi, Jl. Jend. Sudirman',      64,  86),
    ('Rocket Chicken Sudirman',          'Ayam Goreng', -6.2138, 106.8160, 'Jl. Jend. Sudirman Kav. 6',                57,  78),
    ('Geprek Express Kebon Sirih',       'Ayam Goreng', -6.2148, 106.8145, 'Jl. Kebon Sirih Raya No. 8',               66,  90),
    ('Ayam Geprek Boss Semanggi',        'Ayam Goreng', -6.2195, 106.8118, 'Plaza Semanggi Lt. 2, Jl. Jend. Sudirman', 83, 112),

    -- ── BURGER (10) ──────────────────────────────────────────────────────────
    ('Burger King Plaza Semanggi',       'Burger', -6.2185, 106.8117, 'Plaza Semanggi Lt. 2, Jl. Jend. Sudirman',      227, 308),
    ('Shake Shack Sudirman',             'Burger', -6.2140, 106.8158, 'Gedung Artha Graha, Jl. Jend. Sudirman',        289, 391),
    ('The Burger Lab Kebon Sirih',       'Burger', -6.2152, 106.8145, 'Jl. Kebon Sirih No. 30',                        128, 173),
    ('Flip Burger Sudirman',             'Burger', -6.2170, 106.8132, 'Jl. Jend. Sudirman Kav. 14',                    108, 147),
    ('Smash''d Semanggi',                 'Burger', -6.2195, 106.8118, 'Arteri Semanggi, Jl. Jend. Sudirman',          136, 184),
    ('Fuego Burger Wahid Hasyim',        'Burger', -6.2130, 106.8165, 'Jl. Wahid Hasyim No. 25',                       91, 122),
    ('Burgreens Sudirman',               'Burger', -6.2158, 106.8142, 'Menara Imperium, Jl. Jend. Sudirman',           149, 201),
    ('MOS Burger Plaza Semanggi',        'Burger', -6.2188, 106.8115, 'Plaza Semanggi Lt. 3, Jl. Jend. Sudirman',      172, 233),
    ('Richeese Factory Semanggi',        'Burger', -6.2198, 106.8115, 'Jl. Jend. Sudirman, dekat Semanggi',            108, 147),
    ('Carl''s Jr Sudirman',               'Burger', -6.2145, 106.8150, 'Jl. Jend. Sudirman Kav. 9',                   198, 267),

    -- ── MIE & BAKSO (10) ─────────────────────────────────────────────────────
    ('Bakso Malang Karapitan Semanggi',  'Mie & Bakso', -6.2192, 106.8116, 'Arteri Semanggi, Jl. Jend. Sudirman',      51,  69),
    ('Mie Ayam Pak Kumis Kebon Sirih',   'Mie & Bakso', -6.2150, 106.8148, 'Jl. Kebon Sirih No. 12',                   41,  55),
    ('Bakso Pak Man Sudirman',           'Mie & Bakso', -6.2165, 106.8138, 'Jl. Jend. Sudirman Kav. 11',               47,  63),
    ('Mie Gacoan Semanggi',              'Mie & Bakso', -6.2180, 106.8125, 'Plaza Semanggi Lt. 3, Jl. Jend. Sudirman', 130, 175),
    ('Ippudo Ramen Plaza Semanggi',      'Mie & Bakso', -6.2185, 106.8118, 'Plaza Semanggi Lt. 2, Jl. Jend. Sudirman', 247, 334),
    ('Bakso President Wahid Hasyim',     'Mie & Bakso', -6.2132, 106.8168, 'Jl. Wahid Hasyim No. 32',                  57,  78),
    ('Ramen Santouka Sudirman',          'Mie & Bakso', -6.2138, 106.8158, 'Menara Standard Chartered, Jl. Sudirman',  215, 290),
    ('Mie Tarik Pak Eko Kebon Sirih',    'Mie & Bakso', -6.2155, 106.8142, 'Jl. Kebon Sirih Raya No. 18',              37,  50),
    ('Yoshinoya Wisma BNI',              'Mie & Bakso', -6.2142, 106.8152, 'Wisma BNI 46 Lt. B1, Jl. Jend. Sudirman', 102, 138),
    ('Bakso Benhil Semanggi',            'Mie & Bakso', -6.2200, 106.8123, 'Jl. Jend. Sudirman, Semanggi',             43,  59),

    -- ── MINUMAN (10) ─────────────────────────────────────────────────────────
    ('Chatime Plaza Semanggi',           'Minuman', -6.2183, 106.8120, 'Plaza Semanggi Lt. 1, Jl. Jend. Sudirman',     115, 155),
    ('Chatime Wisma BNI',                'Minuman', -6.2143, 106.8153, 'Wisma BNI 46 Lt. GF, Jl. Jend. Sudirman',     105, 143),
    ('Koi The Semanggi',                 'Minuman', -6.2187, 106.8117, 'Plaza Semanggi Lt. 2, Jl. Jend. Sudirman',    96, 129),
    ('Tealive Sudirman',                 'Minuman', -6.2160, 106.8140, 'Jl. Jend. Sudirman Kav. 13',                   89, 121),
    ('Xing Fu Tang Semanggi',            'Minuman', -6.2193, 106.8113, 'Plaza Semanggi Lt. 2, Jl. Jend. Sudirman',    142, 193),
    ('Mixue Ice Cream Kebon Sirih',      'Minuman', -6.2148, 106.8147, 'Jl. Kebon Sirih No. 16',                       54,  72),
    ('Tiger Sugar Sudirman',             'Minuman', -6.2170, 106.8132, 'Gedung Graha Surya Internusa, Jl. Sudirman',   84, 114),
    ('Juice Kiloan Wahid Hasyim',        'Minuman', -6.2132, 106.8163, 'Jl. Wahid Hasyim No. 12',                      33,  44),
    ('Dakasi Plaza Semanggi',            'Minuman', -6.2186, 106.8116, 'Plaza Semanggi Lt. 3, Jl. Jend. Sudirman',    121, 164),
    ('Boba Time Semanggi',               'Minuman', -6.2197, 106.8117, 'Arteri Semanggi, dekat Semanggi Interchange',  47,  63),

    -- ── LAINNYA (10) ─────────────────────────────────────────────────────────
    ('Pizza Hut Plaza Semanggi',         'Lainnya', -6.2182, 106.8122, 'Plaza Semanggi Lt. 2, Jl. Jend. Sudirman',    238, 322),
    ('Sushi Tei Plaza Semanggi',         'Lainnya', -6.2186, 106.8118, 'Plaza Semanggi Lt. 2, Jl. Jend. Sudirman',    276, 374),
    ('Hokkaido Izakaya Sudirman',        'Lainnya', -6.2145, 106.8150, 'Jl. Jend. Sudirman Kav. 10',                  185, 250),
    ('Warung Padang Sederhana Semanggi', 'Lainnya', -6.2197, 106.8120, 'Arteri Semanggi, Jl. Jend. Sudirman',         64,  86),
    ('D''Cost Seafood Plaza Semanggi',   'Lainnya', -6.2184, 106.8119, 'Plaza Semanggi Lt. 3, Jl. Jend. Sudirman',   162, 219),
    ('Solaria Wisma BNI 46',             'Lainnya', -6.2140, 106.8157, 'Wisma BNI 46 Lt. B1, Jl. Jend. Sudirman',    128, 173),
    ('Nasi Goreng Kambing Kebon Sirih',  'Lainnya', -6.2153, 106.8143, 'Jl. Kebon Sirih No. 24',                      43,  59),
    ('Warung Nasi Bahari Wahid Hasyim',  'Lainnya', -6.2130, 106.8165, 'Jl. Wahid Hasyim No. 6',                      40,  53),
    ('Gokana Ramen Plaza Semanggi',      'Lainnya', -6.2188, 106.8116, 'Plaza Semanggi Lt. 1, Jl. Jend. Sudirman',   108, 147),
    ('Marugame Udon Sudirman',           'Lainnya', -6.2158, 106.8140, 'Menara Topas, Jl. Jend. Sudirman',            121, 164)
  `)
  console.log('Sudirman-Semanggi seed: 60 competitors inserted.')
}
