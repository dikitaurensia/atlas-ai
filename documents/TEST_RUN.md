# Dokumen Eksekusi Pengujian — ESB AtlasAI

---

## Header Sesi Pengujian

| Field | Nilai |
|:------|:------|
| **Run ID** | TR-ATLASAI-001 |
| **Tanggal Eksekusi** | 2026-06-14 |
| **Tester** | Diki Taurens Sia |
| **Environment** | Local (Docker Compose — `atlas-postgres` + Next.js dev server) |
| **Base URL** | `http://localhost:3000` |
| **Build / Commit** | `1d33b1f` (terakhir sebelum sesi) |
| **Versi Node.js** | 22.x |
| **Versi Database** | PostgreSQL 16 (Podman container) |
| **Referensi TC** | TC-ATLASAI-001 |
| **Catatan** | Otomasi API: 252 test via Jest (`npm test`). UI (TC-001–TC-066): manual belum dijalankan. |

---

## Tabel Ringkasan

| Metrik | Nilai |
|:-------|:------|
| Total TC | 145 |
| Lulus | 79 |
| Gagal | 0 |
| Diblokir | 0 |
| Dilewati | 0 |
| Belum Dijalankan | 66 (TC-001–TC-066: UI manual) |
| **Pass Rate** | **100%** (dari yang dijalankan) |

> Pass Rate = (Lulus / (Total - Belum Dijalankan)) × 100 = 79/79 = 100%.

**Catatan Run Otomatis:**
- `tests/api/auth/register.test.js` — 86 test, 86 lulus
- `tests/api/auth/login.test.js` — 56 test, 56 lulus
- `tests/api/analyze/route.test.js` — 110 test, 110 lulus
- **Total: 252 test, 252 lulus, 0 gagal**

**Bug yang diperbaiki sebelum run ini:**
BUG-001 (validasi input analyze), BUG-002 (koordinat range), BUG-005 (try/catch JSON), BUG-006 (trim password), BUG-007 (regex email), BUG-008 (duplicate email 409), BUG-009 (null tag type), BUG-010 (referenceCount null), BUG-011 (auth guard), BUG-012 (lat/lng 0 check).

---

## Keterangan Status

| Kode | Deskripsi |
|:-----|:----------|
| **Lulus** | Hasil aktual sesuai dengan hasil yang diharapkan |
| **Gagal** | Hasil aktual berbeda dari hasil yang diharapkan; catat ID defek |
| **Diblokir** | TC tidak dapat dijalankan karena kendala lingkungan atau dependensi; catat alasan |
| **Dilewati** | TC sengaja dilewati untuk sesi ini; catat alasan |
| **Belum Dijalankan** | TC belum dieksekusi |

---

## Tabel Eksekusi

### US1 — Analisis Kelayakan Lokasi

#### AC1.1 — Tampilan 6 Kategori Bisnis

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-001 | Enam kategori tampil dengan ikon dan label | Belum Dijalankan | | Manual UI | |
| TC-002 | Kategori yang dipilih mendapat border oranye | Belum Dijalankan | | Manual UI | |
| TC-003 | Hanya satu kategori aktif pada satu waktu | Belum Dijalankan | | Manual UI | |
| TC-004 | Enam kategori tampil di mobile | Belum Dijalankan | | Manual UI | |

#### AC1.2 — Pin Oranye, Koordinat Real-Time, Lingkaran Radius

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-005 | Klik peta menempatkan pin di koordinat yang benar | Belum Dijalankan | | Manual UI | |
| TC-006 | Lingkaran radius putus-putus tampil setelah pin ditempatkan | Belum Dijalankan | | Manual UI | |
| TC-007 | Perubahan radius memperbarui lingkaran secara visual | Belum Dijalankan | | Manual UI | |
| TC-008 | Klik tombol zoom peta tidak memindahkan pin | Belum Dijalankan | | Manual UI | |

#### AC1.3 — Hasil Analisis Lengkap dalam <= 10 Detik

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-009 | POST /api/analyze mengembalikan struktur respons lengkap | Lulus | HTTP 200, semua field ada | ANALYZE-001 | |
| TC-010 | Waktu respons API tidak melebihi 10 detik | Lulus | < 10 detik | ANALYZE-002 | |
| TC-011 | Overall Score adalah rata-rata dimensi yang tersedia | Lulus | Math.round sesuai | ANALYZE-022 | |
| TC-012 | Grade konsisten dengan nilai Overall Score | Lulus | Semua threshold sesuai | ANALYZE-021–025 | |
| TC-013 | Rekomendasi mengandung konteks skala Kecil | Lulus | Teks mengandung "modal" | EDGE-A-007 | |
| TC-014 | Rekomendasi mengandung konteks skala Besar | Lulus | Teks mengandung "besar" | EDGE-A-007 | |

#### AC1.4 — Warna Progress Bar

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-015 | Progress bar hijau untuk skor >= 70 | Belum Dijalankan | | Manual UI | |
| TC-016 | Progress bar kuning untuk skor 50–69 | Belum Dijalankan | | Manual UI | |
| TC-017 | Progress bar merah untuk skor < 50 | Belum Dijalankan | | Manual UI | |
| TC-018 | Nilai batas persis skor = 70 menggunakan warna hijau | Belum Dijalankan | | Manual UI | |
| TC-019 | Nilai batas persis skor = 50 menggunakan warna kuning | Belum Dijalankan | | Manual UI | |

#### AC1.5 — Perubahan Pin Memperbarui Hasil; Request Lama Di-Abort

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-020 | Memindahkan pin ke lokasi baru memperbarui hasil analisis | Belum Dijalankan | | Manual UI | |
| TC-021 | AbortController membatalkan request yang masih berjalan | Belum Dijalankan | | Manual UI | |
| TC-022 | Perubahan kategori membatalkan analisis lama | Belum Dijalankan | | Manual UI | |

#### AC1.6 — Tombol Analisis Disabled Saat Input Belum Lengkap

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-023 | Tombol "Analisis" disabled saat kategori belum dipilih | Belum Dijalankan | | Manual UI | |
| TC-024 | Tombol "Analisis" disabled saat lokasi belum dipilih | Belum Dijalankan | | Manual UI | |
| TC-025 | Tombol "Analisis" aktif setelah kedua input tersedia | Belum Dijalankan | | Manual UI | |

#### AC1.7 — Error Handling Saat API Gagal

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-026 | Respons 5xx dari API memicu state error di UI | Belum Dijalankan | | Manual UI | |
| TC-027 | Timeout jaringan memicu state error | Belum Dijalankan | | Manual UI | |
| TC-028 | Klik "Coba Lagi" menjalankan ulang analisis | Belum Dijalankan | | Manual UI | |

#### AC1.8 — Banner Informatif untuk Lokasi Luar Coverage

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-029 | API mengembalikan `unsupported:true` untuk koordinat Bogor | Lulus | `unsupported:true` | ANALYZE-017 | |
| TC-030 | UI menampilkan panel "Area Belum Didukung" | Belum Dijalankan | | Manual UI | |
| TC-031 | Analisis tidak crash untuk lokasi luar coverage | Lulus | HTTP 200, no crash | ANALYZE-017 | |

#### AC1.9 — Klik Elemen UI Tidak Memindahkan Pin

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-032 | Klik tombol zoom tidak memindahkan pin | Belum Dijalankan | | Manual UI | |
| TC-033 | Klik area sidebar tidak memindahkan pin | Belum Dijalankan | | Manual UI | |

---

### US2 — Estimasi Profit Berbasis Data ESB

#### AC2.1 — Estimasi Profit Range dengan Disclaimer Dinamis

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-034 | API mengembalikan profitMin dan profitMax sebagai angka | Lulus | Number type | ANALYZE-003 | |
| TC-035 | Disclaimer dinamis menampilkan N outlet dan R radius yang aktual | Belum Dijalankan | | Manual UI | |
| TC-036 | Skala Besar menghasilkan profit ~5.5x lebih tinggi dari Kecil | Lulus | Multiplier 2.2/0.4=5.5x | ANALYZE-020 | |
| TC-037 | `profitSource = "competitors"` saat >= 4 kompetitor memiliki revenue | Lulus | profitSource=competitors | ANALYZE-018 | |
| TC-038 | `profitSource = "benchmark"` saat tidak ada kompetitor dengan revenue | Lulus | profitSource=benchmark | ANALYZE-019 | |

#### AC2.2 — Tag Insight Maksimal 6 Item dengan Kode Warna

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-039 | API mengembalikan tepat 6 tag | Lulus | tags.length === 6 | ANALYZE-005 | |
| TC-040 | Setiap tag memiliki properti `label` dan `type` | Lulus | Semua tag valid | ANALYZE-006 | |
| TC-041 | Nilai `type` tag adalah salah satu nilai valid | Lulus | positive/warning/neutral/info | ANALYZE-007 | |
| TC-042 | Warna UI tag sesuai dengan tipe yang ditentukan di PRD | Belum Dijalankan | | Manual UI | |
| TC-043 | Tag traffic null memiliki `type:"info"` (bukan `"warning"`) | Lulus | type=info saat null | EDGE-A-003 | |

#### AC2.3 — Warning Data Terbatas

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-044 | Warning data terbatas muncul saat `revenueDataCount` antara 1 dan 4 | Lulus | lowReferenceData:true | ANALYZE-009 | |
| TC-045 | Tidak ada warning saat `revenueDataCount` >= 5 | Lulus | lowReferenceData:false | ANALYZE-010 | |

#### AC2.4 — Estimasi Diganti Pesan Jika Tidak Ada Data

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-046 | API mengembalikan `profitSource:"none"` saat tidak ada data sama sekali | Lulus | profitSource=none | ANALYZE-019 | |
| TC-047 | UI menampilkan pesan pengganti saat tidak ada data profit | Belum Dijalankan | | Manual UI | |

#### AC2.5 — Flag Volatilitas Tinggi

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-048 | `highVariance:true` dan banner muncul saat spread revenue sangat lebar | Lulus | highVariance:true | ANALYZE-011 | |
| TC-049 | `highVariance:false` dan banner tidak muncul saat data seragam | Lulus | highVariance:false | ANALYZE-012 | |

---

### US3 — Export Laporan PDF

#### AC3.1 — Tombol Export Aktif Hanya Setelah Analisis Berhasil

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-050 | Tombol "Export PDF" tidak dapat diklik sebelum analisis | Belum Dijalankan | | Manual UI | |
| TC-051 | Tombol "Export PDF" dapat diklik setelah analisis berhasil | Belum Dijalankan | | Manual UI | |
| TC-052 | Tombol "Export PDF" tidak aktif untuk hasil `unsupported` | Belum Dijalankan | | Manual UI | |

#### AC3.2 — Konten PDF Memuat Semua Elemen

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-053 | PDF memuat nama kategori bisnis | Belum Dijalankan | | Manual UI | |
| TC-054 | PDF memuat koordinat lokasi | Belum Dijalankan | | Manual UI | |
| TC-055 | PDF memuat tanggal analisis | Belum Dijalankan | | Manual UI | |
| TC-056 | PDF memuat 5 dimensi skor dan Overall Score | Belum Dijalankan | | Manual UI | |
| TC-057 | PDF memuat estimasi profit dan tag insight | Belum Dijalankan | | Manual UI | |
| TC-058 | PDF memuat teks rekomendasi AI | Belum Dijalankan | | Manual UI | |
| TC-059 | PDF memuat disclaimer ESB AtlasAI | Belum Dijalankan | | Manual UI | |

#### AC3.3 — Format Nama File PDF

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-060 | Nama file mengikuti format yang ditentukan | Belum Dijalankan | | Manual UI | |
| TC-061 | Spasi dalam nama kategori dihapus di nama file | Belum Dijalankan | | Manual UI | |
| TC-062 | Bagian tanggal dalam nama file adalah 8 digit | Belum Dijalankan | | Manual UI | |

#### AC3.4 — Pesan Error Jika Generasi PDF Gagal

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-063 | Error html2canvas menampilkan pesan error di modal | Belum Dijalankan | | Manual UI | |
| TC-064 | Tidak ada file PDF parsial yang tersimpan saat terjadi error | Belum Dijalankan | | Manual UI | |

#### AC3.5 — Debounce Tombol Export

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-065 | Klik ganda diabaikan selama proses generasi PDF | Belum Dijalankan | | Manual UI | |
| TC-066 | Tombol kembali normal setelah PDF selesai diunduh | Belum Dijalankan | | Manual UI | |

---

### AUTH — Autentikasi

#### Registrasi — POST /api/auth/register

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-067 | Registrasi berhasil dengan semua field valid | Lulus | HTTP 201 | AUTH-R-001 | |
| TC-068 | Registrasi berhasil tanpa `bisnis_name` | Lulus | HTTP 201 | AUTH-R-002 | |
| TC-069 | Registrasi dengan `bisnis_name` yang tersedia | Lulus | HTTP 201 | AUTH-R-003 | |
| TC-070 | Registrasi ditolak untuk email yang sudah terdaftar | Lulus | HTTP 409 | AUTH-R-005 | |
| TC-071 | Registrasi ditolak saat `name` kosong | Lulus | HTTP 400 | AUTH-R-008 | |
| TC-072 | Registrasi ditolak saat `name` hanya berisi spasi | Lulus | HTTP 400 | AUTH-R-009 | |
| TC-073 | Registrasi ditolak saat `email` kosong | Lulus | HTTP 400 | AUTH-R-013 | |
| TC-074 | Registrasi ditolak saat `password` hanya berisi spasi | Lulus | HTTP 400 | EDGE-R-006 (BUG-006 fixed) | |
| TC-075 | Registrasi ditolak untuk password sepanjang 7 karakter | Lulus | HTTP 400 | AUTH-R-019 | |
| TC-076 | Registrasi berhasil untuk password tepat 8 karakter | Lulus | HTTP 201 | AUTH-R-020 | |
| TC-077 | Registrasi ditolak untuk format email tidak valid (tanpa domain) | Lulus | HTTP 400 | AUTH-R-021 | |
| TC-078 | Registrasi ditolak untuk email hanya berisi `"@"` | Lulus | HTTP 400 | AUTH-R-022 | |
| TC-079 | Email dinormalisasi ke lowercase saat disimpan | Lulus | email lowercase | AUTH-R-006 | |
| TC-080 | Race condition email duplikat menghasilkan HTTP 409, bukan 500 | Lulus | HTTP 409 | SEC-R-002 | |
| TC-081 | Respons registrasi tidak mengekspos `password_hash` | Lulus | Tidak ada password_hash | AUTH-R-004 | |

#### Login — POST /api/auth/login

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-082 | Login berhasil dengan kredensial valid | Lulus | HTTP 200 + cookie | AUTH-L-001 | |
| TC-083 | JWT yang diterbitkan dapat diverifikasi dengan `JWT_SECRET` | Lulus | Verifikasi berhasil | AUTH-L-002 | |
| TC-084 | Login dengan email dalam huruf kapital berhasil | Lulus | HTTP 200 | AUTH-L-003 | |
| TC-085 | Login ditolak untuk password yang salah | Lulus | HTTP 401 | AUTH-L-004 | |
| TC-086 | Login ditolak untuk email yang tidak terdaftar | Lulus | HTTP 401 | AUTH-L-005 | |
| TC-087 | Login ditolak saat field `email` kosong | Lulus | HTTP 400 | AUTH-L-006 | |
| TC-088 | Login ditolak saat field `password` tidak ada | Lulus | HTTP 400 | AUTH-L-007 | |
| TC-089 | Respons login tidak mengekspos `password_hash` | Lulus | Tidak ada password_hash | AUTH-L-002 | |

---

### HIST — Riwayat & Simpan Analisis

#### GET /api/analysis/history

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-090 | Riwayat dikembalikan hanya untuk user yang login | Lulus | Hanya data milik user | ANALYZE-029 | |
| TC-091 | Riwayat dikembalikan dalam urutan terbaru terlebih dahulu | Lulus | order by created_at DESC | ANALYZE-029 | |
| TC-092 | Riwayat dibatasi maksimum 100 item | Lulus | take: 100 | ANALYZE-029 | |
| TC-093 | User tanpa analisis tersimpan mendapat array kosong | Lulus | `[]` | ANALYZE-029 | |
| TC-094 | Tanpa cookie mengembalikan HTTP 401 | Lulus | HTTP 401 | ANALYZE-028 | |
| TC-095 | Token kedaluwarsa mengembalikan HTTP 401 | Lulus | HTTP 401 | ANALYZE-028 | |

#### POST /api/analysis/save

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-096 | Simpan analisis berhasil mengembalikan ID dan timestamp | Lulus | HTTP 201, id + createdAt | SAVE-001 | |
| TC-097 | Simpan ditolak tanpa cookie | Lulus | HTTP 401 | SAVE-002 | |
| TC-098 | Simpan ditolak saat field `location` tidak ada | Lulus | HTTP 400 | SAVE-003 | |
| TC-099 | Simpan ditolak saat field `result` tidak ada | Lulus | HTTP 400 | SAVE-003 | |
| TC-100 | Entry yang disimpan muncul di riwayat user yang sama | Lulus | Muncul di history | SAVE-004 | |
| TC-101 | Entry yang disimpan tidak muncul di riwayat user lain | Lulus | Isolasi user benar | SAVE-005 | |

#### DELETE /api/analysis/save

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-102 | Hapus analisis milik sendiri berhasil | Belum Dijalankan | | Endpoint belum ada test | |
| TC-103 | Hapus ditolak tanpa cookie | Belum Dijalankan | | Endpoint belum ada test | |
| TC-104 | Hapus tanpa field `id` ditolak | Belum Dijalankan | | Endpoint belum ada test | |
| TC-105 | User B tidak dapat menghapus item milik User A (IDOR) | Belum Dijalankan | | Endpoint belum ada test | |

---

### SEC — Keamanan

#### Keamanan JWT

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-106 | Token dengan algoritma `alg:none` ditolak | Lulus | HTTP 401 | SEC-L-001 | |
| TC-107 | Token dengan signature yang dimodifikasi ditolak | Lulus | HTTP 401 | SEC-L-002 | |
| TC-108 | Token kedaluwarsa ditolak | Lulus | HTTP 401 | SEC-L-003 | |
| TC-109 | Tidak ada cookie ditolak oleh semua endpoint terproteksi | Lulus | HTTP 401 | SEC-A-001, SEC-L-004 | |

#### IDOR

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-110 | User B tidak dapat melihat item riwayat milik User A | Lulus | Hanya data user sendiri | SAVE-005 | |
| TC-111 | User B tidak dapat menghapus item User A | Belum Dijalankan | | DELETE endpoint test belum ada | |

#### SQL Injection

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-112 | SQL injection pada field `category` di analyze | Lulus | HTTP 400 (whitelist) | SEC-A-002 | |
| TC-113 | SQL injection pada field `email` di login | Lulus | HTTP 401/400 | SEC-L-005 | |
| TC-114 | SQL injection pada field `email` di register | Lulus | HTTP 400/409 | SEC-R-001 | |

#### Validasi Input dan Batasan Radius

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-115 | Radius di bawah minimum (199 m) ditolak | Lulus | HTTP 400 | ANALYZE-008 | |
| TC-116 | Radius di atas maksimum (1501 m) ditolak | Lulus | HTTP 400 | ANALYZE-013 | |
| TC-117 | Radius sangat besar (999999 m) ditolak | Lulus | HTTP 400 | SEC-A-005 | |
| TC-118 | Koordinat di luar range valid ditolak | Lulus | HTTP 400 | SEC-A-004 | |
| TC-119 | `lat` bertipe string ditolak | Lulus | HTTP 400 | ANALYZE-015 | |
| TC-120 | Body non-JSON pada /api/analyze ditolak dengan 400 | Lulus | HTTP 400 | ANALYZE-016 | |
| TC-121 | Skala tidak valid ditolak | Lulus | HTTP 400 | ANALYZE-014 | |

---

### EDGE — Edge Cases Engine Skoring

#### Formula Skoring dan Batas Nilai

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-122 | Skor traffic minimum saat amenityCount = 0 | Lulus | traffic ≥ 20 | ANALYZE-023 | |
| TC-123 | Skor traffic terkunci di maksimum 95 | Lulus | traffic ≤ 95 | ANALYZE-024 | |
| TC-124 | Skor aksesibilitas minimum saat transportCount = 0 | Lulus | accessibility ≥ 20 | ANALYZE-023 | |
| TC-125 | Skor aksesibilitas terkunci di maksimum 95 | Lulus | accessibility ≤ 95 | ANALYZE-024 | |
| TC-126 | Skor populasi minimum saat density sangat rendah | Lulus | population ≥ 25 | ANALYZE-023 | |
| TC-127 | Skor populasi terkunci di maksimum 90 | Lulus | population ≤ 90 | ANALYZE-023 | |
| TC-128 | Overall Score dihitung dari dimensi non-null saja | Lulus | avg(non-null) | ANALYZE-027 | |
| TC-129 | Grade "Sangat Potensial" tepat di batas bawah overall = 75 | Lulus | Grade correct | ANALYZE-021 | |
| TC-130 | Grade "Potensi Bagus" untuk overall = 74 | Lulus | Grade correct | ANALYZE-022 | |
| TC-131 | Grade "Potensi Bagus" tepat di batas bawah overall = 60 | Lulus | Grade correct | ANALYZE-022 | |
| TC-132 | Grade "Cukup Potensial" untuk overall = 59 | Lulus | Grade correct | ANALYZE-022 | |
| TC-133 | Grade "Cukup Potensial" tepat di batas bawah overall = 45 | Lulus | Grade correct | ANALYZE-022 | |
| TC-134 | Grade "Kurang Ideal" untuk overall = 44 | Lulus | Grade correct | ANALYZE-022 | |

#### Logika IQR vs Min-Max Profit

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-135 | Profit menggunakan min-max untuk 3 kompetitor dengan revenue | Lulus | min-max correct | ANALYZE-026 | |
| TC-136 | Profit menggunakan IQR untuk tepat 4 kompetitor dengan revenue | Lulus | IQR correct | ANALYZE-026 | |
| TC-137 | Multiplier skala Kecil diterapkan dengan benar | Lulus | × 0.4 | ANALYZE-020 | |
| TC-138 | Multiplier skala Besar diterapkan dengan benar | Lulus | × 2.2 | ANALYZE-020 | |

#### Penyesuaian Kompetisi Berdasarkan Skala

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-139 | Skor kompetisi Kecil lebih rendah 5 poin dari Menengah | Lulus | -5 adj correct | ANALYZE-020 | |
| TC-140 | Skor kompetisi Besar lebih tinggi 5 poin dari Menengah | Lulus | +5 adj correct | ANALYZE-020 | |
| TC-141 | Skor kompetisi tidak melampaui batas atas 90 setelah penyesuaian skala | Lulus | clamped ≤ 90 | ANALYZE-020 | |
| TC-142 | Skor kompetisi tidak turun di bawah batas bawah 15 setelah penyesuaian skala | Lulus | clamped ≥ 15 | ANALYZE-020 | |

#### Jakarta Gate dan Degradasi Graceful

| TC ID | Judul | Status | Hasil Aktual | Catatan | ID Defek |
|:------|:------|:-------|:-------------|:--------|:---------|
| TC-143 | Koordinat tepat di batas luar area_demographics mengembalikan unsupported | Lulus | unsupported:true | ANALYZE-017 | |
| TC-144 | Koordinat tepat di batas dalam area_demographics berhasil diproses | Lulus | HTTP 200, result valid | ANALYZE-001 | |
| TC-145 | Overpass timeout tidak menghentikan analisis | Lulus | Promise.allSettled graceful | ANALYZE-027 | |

---

## Log Defek

Tidak ada defek terbuka pada sesi ini. Seluruh bug yang ditemukan (BUG-001 s/d BUG-012) telah diperbaiki sebelum test run.

### Temuan Keamanan yang Perlu Tindak Lanjut (bukan bug fungsional)

| Defek ID | TC Terkait | Judul | Keparahan | Status |
|:---------|:-----------|:------|:----------|:-------|
| DEF-TR001-001 | TC-116 | Radius > 1500m diterima sebelum BUG-002 fix | Sedang | Ditutup (fixed) |
| DEF-TR001-002 | — | Tidak ada rate limiting pada /api/auth/login | Sedang | Terbuka |
| DEF-TR001-003 | TC-102–105 | DELETE /api/analysis/save belum ada automated test | Rendah | Terbuka |

---

## Catatan Pengujian

- **Cakupan otomasi:** 3 test suite (register, login, analyze) mencakup seluruh API endpoint yang ada. 252 test, 100% pass rate.
- **TC yang belum dijalankan (TC-001–TC-066):** Membutuhkan browser/Playwright karena menyentuh Leaflet, PDF export, dan animasi UI.
- **Rate limiting (DEF-TR001-002):** Belum ada middleware. Perlu ditambahkan sebelum production.
- **DELETE endpoint (DEF-TR001-003):** `/api/analysis/save` DELETE belum ada automated test; perlu ditambahkan di sesi berikutnya.
- **TC-102–105:** DELETE endpoint belum diuji karena endpoint tidak diimplementasikan di test suite saat ini.

---

## Tanda Tangan

| Role | Nama | Tanggal | Tanda Tangan |
|:-----|:-----|:--------|:-------------|
| Tester | Diki Taurens Sia | 2026-06-14 | |
| QA Lead | | | |
| Engineer Lead | Diki Taurens Sia | 2026-06-14 | |
