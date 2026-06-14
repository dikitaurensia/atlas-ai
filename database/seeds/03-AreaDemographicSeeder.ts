import { DataSource } from 'typeorm'

export async function run(dataSource: DataSource): Promise<void> {
  await dataSource.query(`TRUNCATE TABLE area_demographics`)

  await dataSource.query(`
    INSERT INTO area_demographics (name, lat_min, lat_max, lng_min, lng_max, population_density, income_index, area_type) VALUES
      -- JAKARTA PUSAT
      ('Gambir',              -6.188, -6.152, 106.792, 106.838, 12200, 82, 'mixed'),
      ('Sawah Besar',         -6.170, -6.140, 106.818, 106.860, 25800, 65, 'permukiman padat'),
      ('Kemayoran',           -6.200, -6.158, 106.842, 106.885, 43500, 60, 'permukiman padat'),
      ('Senen',               -6.195, -6.165, 106.840, 106.878, 28200, 65, 'mixed'),
      ('Cempaka Putih',       -6.200, -6.162, 106.865, 106.905, 28800, 68, 'mixed'),
      ('Menteng',             -6.220, -6.188, 106.822, 106.862, 13500, 88, 'permukiman menengah-atas'),
      ('Tanah Abang',         -6.225, -6.185, 106.788, 106.832, 32500, 72, 'commercial'),
      ('Johar Baru',          -6.200, -6.162, 106.855, 106.892, 44200, 55, 'permukiman padat'),
      -- JAKARTA UTARA
      ('Penjaringan',         -6.145, -6.088, 106.748, 106.852, 11800, 72, 'mixed'),
      ('Pademangan',          -6.165, -6.125, 106.830, 106.872, 17500, 60, 'mixed'),
      ('Tanjung Priok',       -6.160, -6.095, 106.850, 106.935, 14200, 55, 'mixed'),
      ('Koja',                -6.165, -6.105, 106.885, 106.948, 23500, 48, 'permukiman padat'),
      ('Kelapa Gading',       -6.182, -6.135, 106.890, 106.968, 10200, 82, 'commercial'),
      ('Cilincing',           -6.152, -6.078, 106.928, 106.995, 10500, 42, 'mixed'),
      -- JAKARTA BARAT
      ('Tambora',             -6.182, -6.135, 106.782, 106.832, 55800, 40, 'permukiman padat'),
      ('Taman Sari',          -6.172, -6.128, 106.810, 106.852, 35500, 60, 'mixed'),
      ('Grogol Petamburan',   -6.200, -6.152, 106.775, 106.825, 29200, 68, 'mixed'),
      ('Palmerah',            -6.232, -6.195, 106.775, 106.820, 31800, 65, 'mixed'),
      ('Kebon Jeruk',         -6.242, -6.192, 106.748, 106.802, 16200, 68, 'mixed'),
      ('Kembangan',           -6.245, -6.180, 106.708, 106.768,  8800, 62, 'mixed'),
      ('Cengkareng',          -6.192, -6.118, 106.715, 106.798, 12500, 58, 'mixed'),
      ('Kalideres',           -6.182, -6.112, 106.670, 106.755,  9200, 55, 'mixed'),
      -- JAKARTA SELATAN
      ('Tebet',               -6.255, -6.212, 106.842, 106.885, 22500, 70, 'mixed'),
      ('Setiabudi',           -6.245, -6.198, 106.798, 106.855, 11800, 88, 'commercial'),
      ('Mampang Prapatan',    -6.275, -6.232, 106.795, 106.848, 15200, 68, 'mixed'),
      ('Pancoran',            -6.278, -6.235, 106.835, 106.882, 15500, 65, 'mixed'),
      ('Kebayoran Baru',      -6.278, -6.228, 106.772, 106.820, 10800, 85, 'permukiman menengah-atas'),
      ('Kebayoran Lama',      -6.308, -6.255, 106.758, 106.812, 18200, 65, 'mixed'),
      ('Pesanggrahan',        -6.335, -6.275, 106.735, 106.795, 13800, 62, 'mixed'),
      ('Cilandak',            -6.335, -6.272, 106.785, 106.842,  7800, 78, 'mixed'),
      ('Pasar Minggu',        -6.335, -6.268, 106.828, 106.882, 12200, 62, 'mixed'),
      ('Jagakarsa',           -6.378, -6.305, 106.788, 106.868,  8800, 55, 'mixed'),
      -- JAKARTA TIMUR
      ('Matraman',            -6.235, -6.195, 106.855, 106.898, 25500, 65, 'mixed'),
      ('Jatinegara',          -6.258, -6.212, 106.868, 106.928, 24200, 60, 'mixed'),
      ('Kramat Jati',         -6.305, -6.255, 106.865, 106.928, 14200, 58, 'mixed'),
      ('Makassar',            -6.258, -6.205, 106.892, 106.948, 17500, 58, 'mixed'),
      ('Pulo Gadung',         -6.228, -6.178, 106.888, 106.948, 16500, 62, 'mixed'),
      ('Cakung',              -6.232, -6.145, 106.928, 107.015,  7800, 50, 'mixed'),
      ('Duren Sawit',         -6.285, -6.218, 106.905, 106.968, 16200, 58, 'mixed'),
      ('Cipayung',            -6.355, -6.278, 106.885, 106.965,  7500, 50, 'mixed'),
      ('Ciracas',             -6.328, -6.258, 106.862, 106.935,  9200, 52, 'mixed'),
      ('Pasar Rebo',          -6.365, -6.305, 106.845, 106.912, 12500, 55, 'mixed'),
      -- FINE-GRAINED: CBD & PREMIUM (smaller bbox = higher query priority)
      ('SCBD / Sudirman',     -6.235, -6.200, 106.798, 106.835,  6200, 95, 'CBD'),
      ('Thamrin / Monas',     -6.202, -6.182, 106.812, 106.835,  7800, 90, 'CBD'),
      ('Kuningan / Rasuna',   -6.248, -6.218, 106.820, 106.852,  9000, 88, 'commercial'),
      ('Kemang',              -6.282, -6.252, 106.806, 106.835,  9200, 85, 'commercial'),
      ('Pondok Indah',        -6.305, -6.272, 106.768, 106.800,  4200, 92, 'commercial'),
      ('PIK / Pantai Indah',  -6.138, -6.088, 106.725, 106.765,  3200, 90, 'commercial'),
      ('TB Simatupang',       -6.332, -6.295, 106.805, 106.840,  6500, 80, 'commercial'),
      ('Sunter / Pluit',      -6.175, -6.118, 106.855, 106.900, 13500, 70, 'mixed')
  `)

  const [{ count }] = await dataSource.query(`SELECT COUNT(*) FROM area_demographics`)
  console.log(`  ✓ area_demographics: ${count} rows inserted`)
}
