import { DataSource } from 'typeorm'

// Dense SCBD competitor data for testing.
// Area bbox: lat -6.235–-6.200, lng 106.798–106.835 (income_index 95, CBD)
// Revenue figures mencerminkan CBD premium pricing (lebih tinggi dari rata-rata Jakarta).
// Revenue already normalized to ±15% around midpoint (ratio ≈ 1.35×).
export async function run(dataSource: DataSource): Promise<void> {
  await dataSource.query(`
    INSERT INTO competitors (name, category, lat, lng, address, revenue_min_jt, revenue_max_jt) VALUES

    -- ── KOPI & CAFE (18 outlets) ─────────────────────────────────────────────
    ('Starbucks Pacific Place',          'Kopi & Cafe', -6.2241, 106.8098, 'Pacific Place Mall Lt. 1, SCBD',            612, 828),
    ('Starbucks District 8',             'Kopi & Cafe', -6.2278, 106.8065, 'District 8, SCBD Lot 28',                   570, 771),
    ('Starbucks Sudirman Kav 25',        'Kopi & Cafe', -6.2145, 106.8138, 'Jl. Jend. Sudirman Kav. 25',               599, 811),
    ('Kopi Kenangan SCBD Tower',         'Kopi & Cafe', -6.2260, 106.8085, 'SCBD Tower 2, Jl. Jend. Sudirman Kav. 52', 136, 184),
    ('Kopi Kenangan Energy Building',    'Kopi & Cafe', -6.2228, 106.8072, 'Energy Building, SCBD',                    125, 170),
    ('Janji Jiwa Pacific Place',         'Kopi & Cafe', -6.2245, 106.8100, 'Pacific Place Mall Lt. 2, SCBD',            94, 127),
    ('Janji Jiwa Sudirman Tower',        'Kopi & Cafe', -6.2100, 106.8172, 'Sudirman Tower, Jl. Jend. Sudirman Kav. 60', 87, 118),
    ('Fore Coffee Pacific Place',        'Kopi & Cafe', -6.2238, 106.8095, 'Pacific Place Mall Lt. 3, SCBD',           108, 147),
    ('Tomoro Coffee SCBD Lot 8',         'Kopi & Cafe', -6.2268, 106.8078, 'SCBD Lot 8, Jl. Jend. Sudirman',           79, 106),
    ('Anomali Coffee SCBD',              'Kopi & Cafe', -6.2255, 106.8090, 'SCBD, Jl. Jend. Sudirman Kav. 52',         170, 230),
    ('Kopi Soe Sudirman',                'Kopi & Cafe', -6.2138, 106.8145, 'Jl. Jend. Sudirman Kav. 29, SCBD',          67,  91),
    ('%Arabica Pacific Place',           'Kopi & Cafe', -6.2242, 106.8097, 'Pacific Place Mall Lt. GF, SCBD',           238, 322),
    ('PAUL Pacific Place',               'Kopi & Cafe', -6.2240, 106.8099, 'Pacific Place Mall Lt. 2, SCBD',            264, 357),
    ('Tanamera Coffee SCBD',             'Kopi & Cafe', -6.2215, 106.8108, 'Jl. Jend. Sudirman Kav. 40, SCBD',          121, 164),
    ('Common Grounds SCBD',              'Kopi & Cafe', -6.2272, 106.8070, 'District 8, SCBD',                          213, 288),
    ('Kopiku Sudirman',                  'Kopi & Cafe', -6.2158, 106.8128, 'Jl. Jend. Sudirman Kav. 32',                57,  78),
    ('Senopati Coffee Co.',              'Kopi & Cafe', -6.2340, 106.8058, 'Jl. Senopati No. 12',                       102, 138),
    ('Kiosk Koffie SCBD',                'Kopi & Cafe', -6.2292, 106.8062, 'SCBD Lot 28, Jl. Jend. Sudirman',           49,  66),

    -- ── AYAM GORENG (14 outlets) ─────────────────────────────────────────────
    ('KFC Pacific Place',                'Ayam Goreng', -6.2243, 106.8096, 'Pacific Place Mall Lt. B1, SCBD',           349, 472),
    ('KFC Sudirman Kav 52',              'Ayam Goreng', -6.2262, 106.8083, 'SCBD Tower 1, Jl. Jend. Sudirman Kav. 52', 332, 449),
    ('CFC SCBD',                         'Ayam Goreng', -6.2248, 106.8092, 'SCBD, Jl. Jend. Sudirman',                  104, 141),
    ('Geprek Bensu Pacific Place',       'Ayam Goreng', -6.2244, 106.8095, 'Pacific Place Mall Lt. 3, SCBD',            128, 173),
    ('Geprek Express SCBD',              'Ayam Goreng', -6.2275, 106.8068, 'District 8, SCBD',                           74, 101),
    ('Sabana Chicken Sudirman',          'Ayam Goreng', -6.2132, 106.8150, 'Jl. Jend. Sudirman Kav. 25',                81, 109),
    ('Rocket Chicken SCBD',              'Ayam Goreng', -6.2305, 106.8060, 'Jl. Senopati Raya, SCBD',                   64,  86),
    ('Ayam Penyet Ria SCBD',             'Ayam Goreng', -6.2258, 106.8082, 'SCBD Lot 8, Jl. Jend. Sudirman',            57,  78),
    ('Ayam Geprek Boss Sudirman',        'Ayam Goreng', -6.2108, 106.8168, 'Wisma Pondok Indah, Jl. Jend. Sudirman',    51,  69),
    ('Ayam Bakar Wong Solo SCBD',        'Ayam Goreng', -6.2318, 106.8055, 'Jl. Senopati No. 8',                        70,  95),
    ('Ayam Penyet Surabaya Sudirman',    'Ayam Goreng', -6.2175, 106.8118, 'Jl. Jend. Sudirman Kav. 36',                45,  60),
    ('Ayam Goreng Karawaci SCBD',        'Ayam Goreng', -6.2288, 106.8065, 'SCBD Lot 8',                                41,  55),
    ('KFC Ciputra World 1',              'Ayam Goreng', -6.2315, 106.8218, 'Ciputra World 1, Jl. Prof. Dr. Satrio',    312, 423),
    ('Geprek Bensu Ciputra World',       'Ayam Goreng', -6.2312, 106.8215, 'Ciputra World 1, Jl. Prof. Dr. Satrio',    117, 158),

    -- ── BURGER (13 outlets) ──────────────────────────────────────────────────
    ('Shake Shack Pacific Place',        'Burger', -6.2241, 106.8098, 'Pacific Place Mall Lt. 2, SCBD',                332, 449),
    ('Burger King Pacific Place',        'Burger', -6.2243, 106.8096, 'Pacific Place Mall Lt. B1, SCBD',               255, 345),
    ('MOS Burger Pacific Place',         'Burger', -6.2240, 106.8100, 'Pacific Place Mall Lt. 2, SCBD',                196, 265),
    ('Carl''s Jr SCBD',                  'Burger', -6.2268, 106.8080, 'District 8, SCBD',                              221, 299),
    ('The Burger Lab SCBD',              'Burger', -6.2255, 106.8085, 'SCBD Lot 8, Jl. Jend. Sudirman',                162, 219),
    ('Burgreens Pacific Place',          'Burger', -6.2244, 106.8097, 'Pacific Place Mall Lt. 3, SCBD',                174, 236),
    ('Flip Burger SCBD',                 'Burger', -6.2295, 106.8060, 'Jl. Senopati No. 5, SCBD',                      121, 164),
    ('MyBurgerLab Sudirman',             'Burger', -6.2128, 106.8155, 'Jl. Jend. Sudirman Kav. 22',                    113, 152),
    ('Smash''d SCBD',                     'Burger', -6.2275, 106.8070, 'District 8, SCBD',                             145, 196),
    ('Fuego Burger Senopati',            'Burger', -6.2338, 106.8052, 'Jl. Senopati No. 38',                           102, 138),
    ('Fat Burger SCBD',                  'Burger', -6.2252, 106.8090, 'One Pacific Place, SCBD',                       189, 256),
    ('Burger King Ciputra World',        'Burger', -6.2318, 106.8220, 'Ciputra World 1, Jl. Prof. Dr. Satrio',        238, 322),
    ('Richeese Factory SCBD',            'Burger', -6.2308, 106.8058, 'Jl. Senopati Raya, SCBD',                       123, 167),

    -- ── MIE & BAKSO (12 outlets) ─────────────────────────────────────────────
    ('Mie Gacoan SCBD',                  'Mie & Bakso', -6.2258, 106.8085, 'SCBD Tower 2, Jl. Jend. Sudirman',         185, 250),
    ('Mie Gacoan Pacific Place',         'Mie & Bakso', -6.2242, 106.8097, 'Pacific Place Mall Lt. B1, SCBD',          202, 273),
    ('Bakso Urat Solo SCBD',             'Mie & Bakso', -6.2272, 106.8072, 'SCBD Lot 8, Jl. Jend. Sudirman',           64,  86),
    ('Mie Tarik Sudirman',               'Mie & Bakso', -6.2145, 106.8138, 'Jl. Jend. Sudirman Kav. 27',               51,  69),
    ('Mie Gacoan Ciputra World',         'Mie & Bakso', -6.2315, 106.8218, 'Ciputra World 1, Jl. Prof. Dr. Satrio',   172, 233),
    ('Ramen Nagi Pacific Place',         'Mie & Bakso', -6.2240, 106.8099, 'Pacific Place Mall Lt. 3, SCBD',           230, 311),
    ('Ippudo SCBD',                      'Mie & Bakso', -6.2245, 106.8095, 'Pacific Place Mall Lt. 2, SCBD',           264, 357),
    ('Ichiban Sushi Ramen SCBD',         'Mie & Bakso', -6.2262, 106.8083, 'SCBD Tower 1',                             157, 213),
    ('Bakso Malang Cak Man SCBD',        'Mie & Bakso', -6.2295, 106.8063, 'Jl. Senopati No. 15',                       43,  59),
    ('Warung Bakso Pak Kumis Sudirman',  'Mie & Bakso', -6.2165, 106.8122, 'Jl. Jend. Sudirman Kav. 34',               33,  44),
    ('Mie Ayam & Bakso Mas Bro SCBD',   'Mie & Bakso', -6.2288, 106.8068, 'SCBD Lot 28',                               37,  50),
    ('Mie Goreng Sultan Senopati',       'Mie & Bakso', -6.2335, 106.8055, 'Jl. Senopati No. 25',                       41,  55),

    -- ── MINUMAN (13 outlets) ─────────────────────────────────────────────────
    ('KOI The Pacific Place',            'Minuman', -6.2241, 106.8098, 'Pacific Place Mall Lt. 1, SCBD',               293, 397),
    ('Gong Cha Pacific Place',           'Minuman', -6.2243, 106.8096, 'Pacific Place Mall Lt. GF, SCBD',              244, 331),
    ('Chatime SCBD Tower',               'Minuman', -6.2260, 106.8085, 'SCBD Tower 2, Jl. Jend. Sudirman',             145, 196),
    ('Chatime Sudirman Kav 40',          'Minuman', -6.2218, 106.8108, 'Jl. Jend. Sudirman Kav. 40',                   128, 173),
    ('Tiger Sugar SCBD',                 'Minuman', -6.2272, 106.8072, 'District 8, SCBD',                             196, 265),
    ('Boba Time Pacific Place',          'Minuman', -6.2244, 106.8097, 'Pacific Place Mall Lt. 2, SCBD',               157, 213),
    ('Serenitea SCBD',                   'Minuman', -6.2255, 106.8090, 'SCBD Lot 8',                                   108, 147),
    ('Xi Bo Ba SCBD',                    'Minuman', -6.2278, 106.8068, 'District 8, SCBD',                              77, 104),
    ('Mixue Ciputra World',              'Minuman', -6.2312, 106.8218, 'Ciputra World 1, Jl. Prof. Dr. Satrio',         89, 121),
    ('Coco Milk Tea Sudirman',           'Minuman', -6.2138, 106.8148, 'Jl. Jend. Sudirman Kav. 25',                   64,  86),
    ('Es Teh Indonesia SCBD',            'Minuman', -6.2295, 106.8062, 'Jl. Senopati Raya',                            51,  69),
    ('Dum Dum Thai Drinks Pacific Place','Minuman', -6.2242, 106.8099, 'Pacific Place Mall Lt. 3, SCBD',               121, 164),
    ('Let''s Talk About Coffee SCBD',    'Minuman', -6.2268, 106.8082, 'SCBD, Jl. Jend. Sudirman',                     59,  79),

    -- ── LAINNYA (16 outlets) ─────────────────────────────────────────────────
    ('Pizza Express Pacific Place',      'Lainnya', -6.2241, 106.8098, 'Pacific Place Mall Lt. 3, SCBD',               366, 495),
    ('Texas Roadhouse Pacific Place',    'Lainnya', -6.2243, 106.8096, 'Pacific Place Mall Lt. 3, SCBD',               595, 805),
    ('Sushi Tei Pacific Place',          'Lainnya', -6.2240, 106.8100, 'Pacific Place Mall Lt. 2, SCBD',               425, 575),
    ('Gyu-Kaku Pacific Place',           'Lainnya', -6.2244, 106.8097, 'Pacific Place Mall Lt. 3, SCBD',               510, 690),
    ('Pepper Lunch SCBD',                'Lainnya', -6.2262, 106.8083, 'SCBD Tower 1, Jl. Jend. Sudirman',             225, 305),
    ('Sate Senayan Pacific Place',       'Lainnya', -6.2242, 106.8099, 'Pacific Place Mall Lt. 2, SCBD',               327, 443),
    ('Nusantara Kitchen SCBD',           'Lainnya', -6.2258, 106.8088, 'SCBD Lot 8, Jl. Jend. Sudirman',              251, 339),
    ('Pizza Hut SCBD',                   'Lainnya', -6.2275, 106.8070, 'District 8, SCBD',                             268, 362),
    ('Pondok Laguna Senopati',           'Lainnya', -6.2342, 106.8055, 'Jl. Senopati No. 45',                          281, 380),
    ('Restoran Dapur Solo SCBD',         'Lainnya', -6.2305, 106.8060, 'Jl. Senopati Raya',                            164, 221),
    ('Warung Nasi Sudirman',             'Lainnya', -6.2168, 106.8120, 'Jl. Jend. Sudirman Kav. 36',                   44,  59),
    ('Padang Merdeka Sudirman',          'Lainnya', -6.2182, 106.8112, 'Jl. Jend. Sudirman Kav. 38',                   59,  79),
    ('Waroeng SS Senopati',              'Lainnya', -6.2328, 106.8052, 'Jl. Senopati No. 30',                          149, 201),
    ('El Asador Senopati',               'Lainnya', -6.2348, 106.8058, 'Jl. Senopati No. 55',                          404, 546),
    ('Plataran Senopati',                'Lainnya', -6.2352, 106.8060, 'Jl. Senopati No. 60',                          561, 759),
    ('Kintan Buffet SCBD',               'Lainnya', -6.2248, 106.8092, 'One Pacific Place, SCBD',                      468, 633)
  `)

  const [{ count }] = await dataSource.query(
    `SELECT COUNT(*) FROM competitors WHERE address LIKE '%SCBD%' OR address LIKE '%Sudirman%' OR address LIKE '%Senopati%' OR address LIKE '%Pacific Place%' OR address LIKE '%Ciputra World%' OR address LIKE '%District 8%'`
  )
  console.log(`  ✓ scbd_competitors: ${count} rows (includes prior seeder entries)`)
}
