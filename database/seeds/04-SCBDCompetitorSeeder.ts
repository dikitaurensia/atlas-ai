import { DataSource } from 'typeorm'

// Dense SCBD competitor data for testing.
// Area bbox: lat -6.235–-6.200, lng 106.798–106.835 (income_index 95, CBD)
// Revenue figures mencerminkan CBD premium pricing (lebih tinggi dari rata-rata Jakarta).
// Revenue already normalized to ±15% around midpoint (ratio ≈ 1.35×).
export async function run(dataSource: DataSource): Promise<void> {
  await dataSource.query(`
    INSERT INTO competitors (name, category, lat, lng, address, revenue_jt) VALUES

    -- ── KOPI & CAFE (18 outlets) ─────────────────────────────────────────────
    ('Starbucks Pacific Place',          'Kopi & Cafe', -6.2241, 106.8098, 'Pacific Place Mall Lt. 1, SCBD',            720),
    ('Starbucks District 8',             'Kopi & Cafe', -6.2278, 106.8065, 'District 8, SCBD Lot 28',                   671),
    ('Starbucks Sudirman Kav 25',        'Kopi & Cafe', -6.2145, 106.8138, 'Jl. Jend. Sudirman Kav. 25',               705),
    ('Kopi Kenangan SCBD Tower',         'Kopi & Cafe', -6.2260, 106.8085, 'SCBD Tower 2, Jl. Jend. Sudirman Kav. 52', 160),
    ('Kopi Kenangan Energy Building',    'Kopi & Cafe', -6.2228, 106.8072, 'Energy Building, SCBD',                    148),
    ('Janji Jiwa Pacific Place',         'Kopi & Cafe', -6.2245, 106.8100, 'Pacific Place Mall Lt. 2, SCBD',            111),
    ('Janji Jiwa Sudirman Tower',        'Kopi & Cafe', -6.2100, 106.8172, 'Sudirman Tower, Jl. Jend. Sudirman Kav. 60', 103),
    ('Fore Coffee Pacific Place',        'Kopi & Cafe', -6.2238, 106.8095, 'Pacific Place Mall Lt. 3, SCBD',            128),
    ('Tomoro Coffee SCBD Lot 8',         'Kopi & Cafe', -6.2268, 106.8078, 'SCBD Lot 8, Jl. Jend. Sudirman',            93),
    ('Anomali Coffee SCBD',              'Kopi & Cafe', -6.2255, 106.8090, 'SCBD, Jl. Jend. Sudirman Kav. 52',          200),
    ('Kopi Soe Sudirman',                'Kopi & Cafe', -6.2138, 106.8145, 'Jl. Jend. Sudirman Kav. 29, SCBD',           79),
    ('%Arabica Pacific Place',           'Kopi & Cafe', -6.2242, 106.8097, 'Pacific Place Mall Lt. GF, SCBD',            280),
    ('PAUL Pacific Place',               'Kopi & Cafe', -6.2240, 106.8099, 'Pacific Place Mall Lt. 2, SCBD',             311),
    ('Tanamera Coffee SCBD',             'Kopi & Cafe', -6.2215, 106.8108, 'Jl. Jend. Sudirman Kav. 40, SCBD',          143),
    ('Common Grounds SCBD',              'Kopi & Cafe', -6.2272, 106.8070, 'District 8, SCBD',                           251),
    ('Kopiku Sudirman',                  'Kopi & Cafe', -6.2158, 106.8128, 'Jl. Jend. Sudirman Kav. 32',                 68),
    ('Senopati Coffee Co.',              'Kopi & Cafe', -6.2340, 106.8058, 'Jl. Senopati No. 12',                        120),
    ('Kiosk Koffie SCBD',                'Kopi & Cafe', -6.2292, 106.8062, 'SCBD Lot 28, Jl. Jend. Sudirman',            58),

    -- ── AYAM GORENG (14 outlets) ─────────────────────────────────────────────
    ('KFC Pacific Place',                'Ayam Goreng', -6.2243, 106.8096, 'Pacific Place Mall Lt. B1, SCBD',            411),
    ('KFC Sudirman Kav 52',              'Ayam Goreng', -6.2262, 106.8083, 'SCBD Tower 1, Jl. Jend. Sudirman Kav. 52',  391),
    ('CFC SCBD',                         'Ayam Goreng', -6.2248, 106.8092, 'SCBD, Jl. Jend. Sudirman',                   123),
    ('Geprek Bensu Pacific Place',       'Ayam Goreng', -6.2244, 106.8095, 'Pacific Place Mall Lt. 3, SCBD',             151),
    ('Geprek Express SCBD',              'Ayam Goreng', -6.2275, 106.8068, 'District 8, SCBD',                            88),
    ('Sabana Chicken Sudirman',          'Ayam Goreng', -6.2132, 106.8150, 'Jl. Jend. Sudirman Kav. 25',                 95),
    ('Rocket Chicken SCBD',              'Ayam Goreng', -6.2305, 106.8060, 'Jl. Senopati Raya, SCBD',                    75),
    ('Ayam Penyet Ria SCBD',             'Ayam Goreng', -6.2258, 106.8082, 'SCBD Lot 8, Jl. Jend. Sudirman',             68),
    ('Ayam Geprek Boss Sudirman',        'Ayam Goreng', -6.2108, 106.8168, 'Wisma Pondok Indah, Jl. Jend. Sudirman',     60),
    ('Ayam Bakar Wong Solo SCBD',        'Ayam Goreng', -6.2318, 106.8055, 'Jl. Senopati No. 8',                         83),
    ('Ayam Penyet Surabaya Sudirman',    'Ayam Goreng', -6.2175, 106.8118, 'Jl. Jend. Sudirman Kav. 36',                 53),
    ('Ayam Goreng Karawaci SCBD',        'Ayam Goreng', -6.2288, 106.8065, 'SCBD Lot 8',                                 48),
    ('KFC Ciputra World 1',              'Ayam Goreng', -6.2315, 106.8218, 'Ciputra World 1, Jl. Prof. Dr. Satrio',      368),
    ('Geprek Bensu Ciputra World',       'Ayam Goreng', -6.2312, 106.8215, 'Ciputra World 1, Jl. Prof. Dr. Satrio',      138),

    -- ── BURGER (13 outlets) ──────────────────────────────────────────────────
    ('Shake Shack Pacific Place',        'Burger', -6.2241, 106.8098, 'Pacific Place Mall Lt. 2, SCBD',                  391),
    ('Burger King Pacific Place',        'Burger', -6.2243, 106.8096, 'Pacific Place Mall Lt. B1, SCBD',                 300),
    ('MOS Burger Pacific Place',         'Burger', -6.2240, 106.8100, 'Pacific Place Mall Lt. 2, SCBD',                  231),
    ('Carl''s Jr SCBD',                  'Burger', -6.2268, 106.8080, 'District 8, SCBD',                                260),
    ('The Burger Lab SCBD',              'Burger', -6.2255, 106.8085, 'SCBD Lot 8, Jl. Jend. Sudirman',                  191),
    ('Burgreens Pacific Place',          'Burger', -6.2244, 106.8097, 'Pacific Place Mall Lt. 3, SCBD',                  205),
    ('Flip Burger SCBD',                 'Burger', -6.2295, 106.8060, 'Jl. Senopati No. 5, SCBD',                        143),
    ('MyBurgerLab Sudirman',             'Burger', -6.2128, 106.8155, 'Jl. Jend. Sudirman Kav. 22',                      133),
    ('Smash''d SCBD',                     'Burger', -6.2275, 106.8070, 'District 8, SCBD',                               171),
    ('Fuego Burger Senopati',            'Burger', -6.2338, 106.8052, 'Jl. Senopati No. 38',                             120),
    ('Fat Burger SCBD',                  'Burger', -6.2252, 106.8090, 'One Pacific Place, SCBD',                         223),
    ('Burger King Ciputra World',        'Burger', -6.2318, 106.8220, 'Ciputra World 1, Jl. Prof. Dr. Satrio',           280),
    ('Richeese Factory SCBD',            'Burger', -6.2308, 106.8058, 'Jl. Senopati Raya, SCBD',                         145),

    -- ── MIE & BAKSO (12 outlets) ─────────────────────────────────────────────
    ('Mie Gacoan SCBD',                  'Mie & Bakso', -6.2258, 106.8085, 'SCBD Tower 2, Jl. Jend. Sudirman',           218),
    ('Mie Gacoan Pacific Place',         'Mie & Bakso', -6.2242, 106.8097, 'Pacific Place Mall Lt. B1, SCBD',             238),
    ('Bakso Urat Solo SCBD',             'Mie & Bakso', -6.2272, 106.8072, 'SCBD Lot 8, Jl. Jend. Sudirman',              75),
    ('Mie Tarik Sudirman',               'Mie & Bakso', -6.2145, 106.8138, 'Jl. Jend. Sudirman Kav. 27',                  60),
    ('Mie Gacoan Ciputra World',         'Mie & Bakso', -6.2315, 106.8218, 'Ciputra World 1, Jl. Prof. Dr. Satrio',      203),
    ('Ramen Nagi Pacific Place',         'Mie & Bakso', -6.2240, 106.8099, 'Pacific Place Mall Lt. 3, SCBD',              271),
    ('Ippudo SCBD',                      'Mie & Bakso', -6.2245, 106.8095, 'Pacific Place Mall Lt. 2, SCBD',              311),
    ('Ichiban Sushi Ramen SCBD',         'Mie & Bakso', -6.2262, 106.8083, 'SCBD Tower 1',                                185),
    ('Bakso Malang Cak Man SCBD',        'Mie & Bakso', -6.2295, 106.8063, 'Jl. Senopati No. 15',                         51),
    ('Warung Bakso Pak Kumis Sudirman',  'Mie & Bakso', -6.2165, 106.8122, 'Jl. Jend. Sudirman Kav. 34',                  39),
    ('Mie Ayam & Bakso Mas Bro SCBD',   'Mie & Bakso', -6.2288, 106.8068, 'SCBD Lot 28',                                 44),
    ('Mie Goreng Sultan Senopati',       'Mie & Bakso', -6.2335, 106.8055, 'Jl. Senopati No. 25',                         48),

    -- ── MINUMAN (13 outlets) ─────────────────────────────────────────────────
    ('KOI The Pacific Place',            'Minuman', -6.2241, 106.8098, 'Pacific Place Mall Lt. 1, SCBD',                 345),
    ('Gong Cha Pacific Place',           'Minuman', -6.2243, 106.8096, 'Pacific Place Mall Lt. GF, SCBD',                288),
    ('Chatime SCBD Tower',               'Minuman', -6.2260, 106.8085, 'SCBD Tower 2, Jl. Jend. Sudirman',               171),
    ('Chatime Sudirman Kav 40',          'Minuman', -6.2218, 106.8108, 'Jl. Jend. Sudirman Kav. 40',                     151),
    ('Tiger Sugar SCBD',                 'Minuman', -6.2272, 106.8072, 'District 8, SCBD',                                231),
    ('Boba Time Pacific Place',          'Minuman', -6.2244, 106.8097, 'Pacific Place Mall Lt. 2, SCBD',                 185),
    ('Serenitea SCBD',                   'Minuman', -6.2255, 106.8090, 'SCBD Lot 8',                                      128),
    ('Xi Bo Ba SCBD',                    'Minuman', -6.2278, 106.8068, 'District 8, SCBD',                                 91),
    ('Mixue Ciputra World',              'Minuman', -6.2312, 106.8218, 'Ciputra World 1, Jl. Prof. Dr. Satrio',           105),
    ('Coco Milk Tea Sudirman',           'Minuman', -6.2138, 106.8148, 'Jl. Jend. Sudirman Kav. 25',                      75),
    ('Es Teh Indonesia SCBD',            'Minuman', -6.2295, 106.8062, 'Jl. Senopati Raya',                               60),
    ('Dum Dum Thai Drinks Pacific Place','Minuman', -6.2242, 106.8099, 'Pacific Place Mall Lt. 3, SCBD',                  143),
    ('Let''s Talk About Coffee SCBD',    'Minuman', -6.2268, 106.8082, 'SCBD, Jl. Jend. Sudirman',                        69),

    -- ── LAINNYA (16 outlets) ─────────────────────────────────────────────────
    ('Pizza Express Pacific Place',      'Lainnya', -6.2241, 106.8098, 'Pacific Place Mall Lt. 3, SCBD',                  431),
    ('Texas Roadhouse Pacific Place',    'Lainnya', -6.2243, 106.8096, 'Pacific Place Mall Lt. 3, SCBD',                  700),
    ('Sushi Tei Pacific Place',          'Lainnya', -6.2240, 106.8100, 'Pacific Place Mall Lt. 2, SCBD',                  500),
    ('Gyu-Kaku Pacific Place',           'Lainnya', -6.2244, 106.8097, 'Pacific Place Mall Lt. 3, SCBD',                  600),
    ('Pepper Lunch SCBD',                'Lainnya', -6.2262, 106.8083, 'SCBD Tower 1, Jl. Jend. Sudirman',                265),
    ('Sate Senayan Pacific Place',       'Lainnya', -6.2242, 106.8099, 'Pacific Place Mall Lt. 2, SCBD',                  385),
    ('Nusantara Kitchen SCBD',           'Lainnya', -6.2258, 106.8088, 'SCBD Lot 8, Jl. Jend. Sudirman',                 295),
    ('Pizza Hut SCBD',                   'Lainnya', -6.2275, 106.8070, 'District 8, SCBD',                                315),
    ('Pondok Laguna Senopati',           'Lainnya', -6.2342, 106.8055, 'Jl. Senopati No. 45',                             331),
    ('Restoran Dapur Solo SCBD',         'Lainnya', -6.2305, 106.8060, 'Jl. Senopati Raya',                               193),
    ('Warung Nasi Sudirman',             'Lainnya', -6.2168, 106.8120, 'Jl. Jend. Sudirman Kav. 36',                      52),
    ('Padang Merdeka Sudirman',          'Lainnya', -6.2182, 106.8112, 'Jl. Jend. Sudirman Kav. 38',                      69),
    ('Waroeng SS Senopati',              'Lainnya', -6.2328, 106.8052, 'Jl. Senopati No. 30',                             175),
    ('El Asador Senopati',               'Lainnya', -6.2348, 106.8058, 'Jl. Senopati No. 55',                             475),
    ('Plataran Senopati',                'Lainnya', -6.2352, 106.8060, 'Jl. Senopati No. 60',                             660),
    ('Kintan Buffet SCBD',               'Lainnya', -6.2248, 106.8092, 'One Pacific Place, SCBD',                         551)
  `)

  const [{ count }] = await dataSource.query(
    `SELECT COUNT(*) FROM competitors WHERE address LIKE '%SCBD%' OR address LIKE '%Sudirman%' OR address LIKE '%Senopati%' OR address LIKE '%Pacific Place%' OR address LIKE '%Ciputra World%' OR address LIKE '%District 8%'`
  )
  console.log(`  ✓ scbd_competitors: ${count} rows (includes prior seeder entries)`)
}
