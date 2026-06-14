# ESB AtlasAI — Rencana Pengujian (Test Plan)

| Dokumen ID | TP-ATLASAI-001 |
| :---- | :---- |
| Versi | 1.0 |
| Tanggal | 14 Juni 2026 |
| Status | Draft |
| Referensi PRD | PRD-ATLASAI-001 |
| Quality Assurance | TBD |
| Engineer Lead | Diki Taurens Sia |

---

## Daftar Isi

1. [Tujuan Pengujian](#1-tujuan-pengujian)
2. [Ruang Lingkup](#2-ruang-lingkup)
3. [Persiapan Lingkungan](#3-persiapan-lingkungan)
4. [Peta Cakupan (Coverage Map)](#4-peta-cakupan-coverage-map)
5. [Suite Pengujian yang Sudah Ada](#5-suite-pengujian-yang-sudah-ada)
6. [Test Cases Berdasarkan AC PRD](#6-test-cases-berdasarkan-ac-prd)
7. [Analisis Gap dan Rekomendasi Suite Berikutnya](#7-analisis-gap-dan-rekomendasi-suite-berikutnya)
8. [Registri Bug](#8-registri-bug)
9. [Urutan Eksekusi Pengujian](#9-urutan-eksekusi-pengujian)
10. [Definisi Selesai (Definition of Done)](#10-definisi-selesai-definition-of-done)

---

## 1. Tujuan Pengujian

- Memverifikasi bahwa setiap User Story (US1–US3) dan seluruh Acceptance Criteria dari PRD-ATLASAI-001 terpenuhi sebelum soft launch beta pada 17 Agustus 2026.
- Memastikan engine skoring di `lib/analysis.js` menghasilkan nilai dimensi, grade, estimasi profit, dan penyesuaian kompetisi yang akurat secara numerik di seluruh tiga skala bisnis (Kecil / Menengah / Besar).
- Mendeteksi kerentanan keamanan — bypass autentikasi, IDOR, SQL injection, JWT algorithm confusion, dan resource amplification — sebelum setiap rilis.
- Menetapkan peta cakupan yang hidup sehingga setiap sprint dapat memprioritaskan permukaan yang belum diuji dengan risiko tertinggi.
- Menyediakan suite yang dapat dieksekusi (Jest + node-fetch) yang dapat berjalan di CI terhadap database nyata tanpa mock.

---

## 2. Ruang Lingkup

### Dalam Ruang Lingkup

- **US1 — Analisis Kelayakan Lokasi**: semua 9 AC (AC1.1–AC1.9), mencakup alur positif, negatif, dan edge case
- **US2 — Estimasi Profit**: semua 5 AC (AC2.1–AC2.5), termasuk data terbatas dan variance tinggi
- **US3 — Export Laporan PDF**: semua 5 AC (AC3.1–AC3.5), termasuk format nama file dan penanganan error
- `POST /api/auth/register` — registrasi, penerbitan JWT, deteksi duplikat, validasi
- `POST /api/auth/login` — autentikasi, penerbitan JWT, normalisasi email, pemeriksaan kredensial
- `POST /api/analyze` — pipeline analisis penuh, formula skoring, multiplier skala, Jakarta gate, degradasi Overpass
- `GET /api/analysis/history` — pengambilan histori terautentikasi, isolasi per-user, batas paginasi
- `POST /api/analysis/save` — persistensi hasil terautentikasi, validasi field, bentuk respons
- `DELETE /api/analysis/save` — penghapusan terautentikasi, penegakan IDOR per-user
- `POST /api/auth/logout` — pembersihan cookie
- `GET /api/auth/me` — resolusi token ke profil
- Engine skoring `lib/analysis.js` — lima formula dimensi, threshold grade, logika profit IQR, clamping skor kompetisi
- Properti keamanan JWT — HS256, kedaluwarsa 7 hari, penolakan alg:none, tampering signature
- Rate limiting (ketiadaan didokumentasikan sebagai temuan)

### Di Luar Ruang Lingkup

- Pengujian rendering piksel dan visual regression komponen React
- Kebenaran internal Overpass API (diperlakukan sebagai dependensi eksternal)
- Ketersediaan infrastruktur Neon/PostgreSQL dan latensi jaringan
- Fidelitas piksel output PDF (`html2canvas` + `jsPDF`)
- Rendering peta Leaflet dan loading tile

---

## 3. Persiapan Lingkungan

### Prasyarat

Jest dan dependensinya belum terinstal. Jalankan:

```bash
npm install --save-dev jest jest-environment-node node-fetch@2
```

Tambahkan blok konfigurasi Jest berikut ke `package.json`:

```json
"jest": {
  "testEnvironment": "node",
  "testMatch": ["tests/**/*.test.js"],
  "transform": {},
  "extensionsToTreatAsEsm": [".js"]
}
```

### Variabel Lingkungan

| Variabel | Tujuan | Contoh Nilai |
| :---- | :---- | :---- |
| `DATABASE_URL` | Connection string PostgreSQL untuk app dan TypeORM CLI | `postgres://user:pass@host/atlas_ai` |
| `JWT_SECRET` | Secret HMAC untuk menandatangani dan memverifikasi JWT `atlas_token` | `my-very-secret-key-32-chars-min` |
| `TEST_BASE_URL` | Base URL server Next.js yang sedang berjalan | `http://localhost:3000` |

### Persiapan Database

```bash
npm run migration:run   # membuat semua tabel (idempotent)
npm run seed            # mengisi profit_benchmarks, competitors, area_demographics
```

Data seed minimal yang diperlukan:

- `area_demographics` — mencakup minimal: MONAS (`-6.1754, 106.8272`), Sudirman CBD (`-6.2088, 106.8228`), Tanjung Priok (`-6.1053, 106.8827`); TIDAK boleh mencakup Bogor (`-6.5971, 106.8060`)
- `profit_benchmarks` — minimal satu baris untuk kategori `"Kopi & Cafe"` dengan kolom `min_jt`, `max_jt`, `outlet_count`, `radius_km`
- `competitors` — minimal 4 baris untuk kategori `"Kopi & Cafe"` dekat Sudirman dengan `revenue_min_jt` dan `revenue_max_jt` tidak null dalam radius 500 m (untuk menguji logika IQR)

### Menjalankan Suite

Mulai server Next.js terlebih dahulu, lalu di terminal kedua:

```bash
# Suite lengkap
NODE_OPTIONS=--experimental-vm-modules npx jest tests/api/ --testEnvironment node --runInBand

# Suite individual
NODE_OPTIONS=--experimental-vm-modules npx jest tests/api/auth/login.test.js
NODE_OPTIONS=--experimental-vm-modules npx jest tests/api/auth/register.test.js
NODE_OPTIONS=--experimental-vm-modules npx jest tests/api/analyze/route.test.js
```

---

## 4. Peta Cakupan (Coverage Map)

### Endpoint API

| Endpoint | Method | File Test | Jumlah Test | Prioritas | Status |
| :---- | :---- | :---- | :---- | :---- | :---- |
| `POST /api/auth/register` | POST | `tests/api/auth/register.test.js` | ~85 test (45 describe group) | P0 | Tercakup |
| `POST /api/auth/login` | POST | `tests/api/auth/login.test.js` | ~60 test (24 describe group) | P0 | Tercakup |
| `POST /api/analyze` | POST | `tests/api/analyze/route.test.js` | ~80 test (30 describe group) | P0 | Tercakup |
| `GET /api/analysis/history` | GET | Tidak ada | 0 | P0 | Belum tercakup |
| `POST /api/analysis/save` | POST | Tidak ada | 0 | P1 | Belum tercakup |
| `DELETE /api/analysis/save` | DELETE | Tidak ada | 0 | P1 | Belum tercakup |
| `POST /api/auth/logout` | POST | Tidak ada | 0 | P1 | Belum tercakup |
| `GET /api/auth/me` | GET | Tidak ada | 0 | P1 | Belum tercakup |
| `POST /api/setup` | POST | Tidak ada | 0 | P2 | Tidak tercakup (deprecated) |

### Komponen React

| Komponen | File Test | Jumlah Test | Prioritas | Status |
| :---- | :---- | :---- | :---- | :---- |
| `App.jsx` | Tidak ada | 0 | P1 | Belum tercakup |
| `Sidebar.jsx` | Tidak ada | 0 | P1 | Belum tercakup |
| `ResultPanel.jsx` | Tidak ada | 0 | P1 | Belum tercakup |
| `RiwayatSider.jsx` | Tidak ada | 0 | P1 | Belum tercakup |
| `CategoryPicker.jsx` | Tidak ada | 0 | P2 | Belum tercakup |
| `ScalePicker.jsx` | Tidak ada | 0 | P2 | Belum tercakup |
| `RadiusSlider.jsx` | Tidak ada | 0 | P2 | Belum tercakup |
| `EmptyState.jsx` | Tidak ada | 0 | P2 | Belum tercakup |
| `LoadingSteps.jsx` | Tidak ada | 0 | P2 | Belum tercakup |
| `MapView.jsx` | Tidak ada | 0 | P2 | Belum tercakup |
| `MobileBottomSheet.jsx` | Tidak ada | 0 | P2 | Belum tercakup |
| `PDFPreviewModal.jsx` | Tidak ada | 0 | P2 | Di luar ruang lingkup (output PDF piksel) |
| `Header.jsx` | Tidak ada | 0 | P2 | Belum tercakup |
| `MobileHeader.jsx` | Tidak ada | 0 | P2 | Belum tercakup |

### Logika Skoring / Business Logic

| Modul | Fungsi | Dicakup oleh | Status |
| :---- | :---- | :---- | :---- |
| `lib/analysis.js` | `generateAnalysis()` — rata-rata keseluruhan | `ANALYZE-027` | Tercakup |
| `lib/analysis.js` | `generateAnalysis()` — threshold grade | `ANALYZE-021` | Tercakup |
| `lib/analysis.js` | Formula skor Traffic (`20 + count * 0.95`, cap 95) | `ANALYZE-023` | Tercakup |
| `lib/analysis.js` | Formula skor Aksesibilitas (`20 + count * 3.5`, cap 95) | `ANALYZE-024` | Tercakup |
| `lib/analysis.js` | Formula skor Populasi (`25 + density / 310`, cap 90) | `ANALYZE-025` | Tercakup |
| `lib/analysis.js` | `calcProfitRange()` — threshold IQR vs min-max | `ANALYZE-026` | Tercakup |
| `lib/analysis.js` | `calcCompetitionScore()` — dengan benchmark | `ANALYZE-020` | Tercakup |
| `lib/analysis.js` | `calcCompetitionScore()` — tanpa benchmark | `EDGE-A-008` | Tercakup |
| `lib/analysis.js` | Aplikasi `SCALE_PROFIT_MULT` | `ANALYZE-018`, `ANALYZE-019` | Tercakup |
| `lib/analysis.js` | Aplikasi dan clamping `SCALE_COMP_ADJ` | `ANALYZE-020` | Tercakup |
| `lib/analysis.js` | `getRecommendation()` — string konteks skala | `EDGE-A-007` | Tercakup |
| `lib/analysis.js` | Null-safety tag untuk traffic/accessibility | `EDGE-A-003`, `EDGE-A-004` | Tercakup (bug terdokumentasi) |
| `lib/analysis.js` | Null template literal `referenceCount` | `EDGE-A-005` | Tercakup (bug terdokumentasi) |
| `lib/analysis.js` | Variance tinggi — flag SD > 60% mean (AC2.5) | Belum ada | Belum tercakup |
| `lib/analysis.js` | Warning data terbatas < 5 outlet (AC2.3) | Belum ada | Belum tercakup |

---

## 5. Suite Pengujian yang Sudah Ada

### auth/login

`tests/api/auth/login.test.js` mencakup 24 kelompok describe. Happy path (AUTH-L-001 hingga AUTH-L-004) memvalidasi respons HTTP 200, struktur JWT HS256, klaim payload, dan verifikasi tanda tangan. Normalisasi email (AUTH-L-005, AUTH-L-006) memastikan input huruf kapital dan spasi tetap dapat login. Kredensial salah dan pencegahan enumerasi user (AUTH-L-007, AUTH-L-008) memverifikasi pesan error yang identik. Semua permutasi field kosong dan missing (AUTH-L-011 hingga AUTH-L-017) diuji. Uji keamanan (SEC-L-001 hingga SEC-L-007) mencakup SQL injection, JWT algorithm confusion, signature tampering, kedaluwarsa token, dan missing cookie. Temuan penting: tidak ada rate limiting; penjaga password `!password` tidak melakukan trim sehingga password yang hanya spasi melewati guard; tidak ada validasi format email di rute login.

### auth/register

`tests/api/auth/register.test.js` mencakup 45 kelompok describe. Happy path dengan dan tanpa `bisnis_name` (AUTH-R-001 hingga AUTH-R-004), deteksi email duplikat termasuk varian ternormalisasi (AUTH-R-005 hingga AUTH-R-007), semua kombinasi field missing/empty/whitespace (AUTH-R-008 hingga AUTH-R-016), batas panjang password di 7, 8, dan 1 karakter (AUTH-R-017 hingga AUTH-R-019), validasi format email dan celahnya (AUTH-R-020 hingga AUTH-R-024), normalisasi email saat penyimpanan (AUTH-R-025), HTTP method salah (AUTH-R-027, AUTH-R-028), dan baterai keamanan lengkap termasuk SQL injection, XSS, non-exposure password, JWT algorithm confusion, token rusak, token kedaluwarsa, cookie hilang, dan mass assignment (SEC-R-001 hingga SEC-R-010). Suite mendokumentasikan tiga bug: password whitespace 8+ karakter diterima (EDGE-R-006); email seperti `"@"`, `"user@"`, dan `"a@@b.com"` lolos cek format (AUTH-R-021, AUTH-R-022, EDGE-R-012); registrasi konkuren dengan email yang sama dapat menghasilkan DB 500 alih-alih 409 bersih.

### analyze/route

`tests/api/analyze/route.test.js` mencakup 30 kelompok describe. Happy path (ANALYZE-001 hingga ANALYZE-004) memvalidasi bentuk respons lengkap, struktur lima dimensi, konsistensi grade, dan echo skala. Temuan validasi input (ANALYZE-008 hingga ANALYZE-016) mendokumentasikan ketiadaan guard validasi — lat/lng missing, radius di luar rentang, skala tidak valid, dan body non-JSON semuanya lolos tanpa 400. Jakarta gate diuji dengan koordinat Bogor (ANALYZE-017). Kebenaran multiplier skala diverifikasi dengan perbandingan rasio untuk Kecil/Menengah/Besar (ANALYZE-018 hingga ANALYZE-020). Pernyataan unit mencakup semua threshold grade, formula skoring, logika profit IQR, dan degradasi halus di bawah hasil Overpass null (ANALYZE-021 hingga ANALYZE-028). Uji keamanan mendokumentasikan bypass auth kritis (SEC-A-001), resistensi SQL injection, dan resource amplification via radius terlalu besar (SEC-A-005).

---

## 6. Test Cases Berdasarkan AC PRD

Bagian ini memetakan setiap Acceptance Criteria PRD ke test case yang diperlukan dengan ID berbasis AC.

---

### US1 — Analisis Kelayakan Lokasi Secara Lengkap

#### AC1.1 — Tampilan 6 kategori bisnis dengan ikon dan label, pemilihan ditandai border oranye

| ID | Skenario | Langkah | Hasil yang Diharapkan | Tipe | Prioritas |
| :---- | :---- | :---- | :---- | :---- | :---- |
| TC-AC1.1-01 | Semua 6 kategori tampil di halaman | Buka aplikasi di browser desktop | Terlihat 6 kartu: Ayam Goreng, Kopi & Cafe, Mie & Bakso, Minuman, Burger, Lainnya; masing-masing memiliki ikon dan label teks | Positif | P0 |
| TC-AC1.1-02 | Kategori yang dipilih mendapat border oranye | Klik satu kartu kategori | Kartu yang dipilih memiliki border `#FF6B2B` dan background tinted; kartu lain tidak memiliki border aktif | Positif | P0 |
| TC-AC1.1-03 | Hanya satu kategori yang aktif pada satu waktu | Klik kategori A, lalu klik kategori B | Hanya kategori B yang tampil aktif; kategori A kembali ke state normal | Positif | P0 |
| TC-AC1.1-04 | Kategori tersedia di tampilan mobile | Buka aplikasi di viewport < 768 px (MobileBottomSheet) | Sama seperti TC-AC1.1-01, enam kategori tampil lengkap di bottom sheet | Positif | P1 |

**Dicakup oleh suite yang ada:** Tidak ada test komponen. Diperlukan pengujian manual atau Playwright E2E.
**File terkait:** `components/CategoryPicker.jsx`, `components/Sidebar.jsx`, `components/MobileBottomSheet.jsx`

---

#### AC1.2 — Pin oranye dengan animasi pulse, koordinat real-time, lingkaran radius putus-putus

| ID | Skenario | Langkah | Hasil yang Diharapkan | Tipe | Prioritas |
| :---- | :---- | :---- | :---- | :---- | :---- |
| TC-AC1.2-01 | Klik peta menghasilkan pin di lokasi yang benar | Klik lokasi di dalam DKI Jakarta | Pin oranye muncul di koordinat yang diklik; koordinat (lat, lng) ditampilkan secara real-time di UI | Positif | P0 |
| TC-AC1.2-02 | Lingkaran radius ditampilkan | Klik lokasi, set radius ke 500 m | Lingkaran putus-putus tampil di sekitar pin dengan radius visual ~500 m | Positif | P0 |
| TC-AC1.2-03 | Perubahan radius memperbarui lingkaran | Geser slider radius dari 500 ke 1000 m | Lingkaran radius yang tampil meluas; nilai radius di UI diperbarui | Positif | P1 |
| TC-AC1.2-04 | Pin tidak berpindah saat klik UI (AC1.9) | Klik tombol zoom peta, legenda, atau label jalan | Pin tidak berpindah; koordinat tidak berubah | Edge Case | P1 |

**Dicakup oleh suite yang ada:** `components/MapView.jsx` belum memiliki test. Memerlukan test E2E atau uji manual Leaflet.
**File terkait:** `components/MapView.jsx`, `components/App.jsx`

---

#### AC1.3 — Hasil analisis dalam <= 10 detik: 5 dimensi skor, Overall Score, grade, rekomendasi AI 2 kalimat

| ID | Skenario | Langkah | Hasil yang Diharapkan | Tipe | Prioritas |
| :---- | :---- | :---- | :---- | :---- | :---- |
| TC-AC1.3-01 | Hasil lengkap kembali dari API | POST `/api/analyze` dengan koordinat Jakarta valid, kategori, radius, skala | HTTP 200; body berisi `overall` (0–100), `grade` (salah satu dari 4 nilai valid), array `dimensions` berisi 5 item, string `recommendation` tidak kosong | Positif | P0 |
| TC-AC1.3-02 | Waktu respons API <= 10 detik | POST `/api/analyze` dan catat durasi | Waktu respons end-to-end <= 10.000 ms (sesuai AC1.3) | Positif | P0 |
| TC-AC1.3-03 | Overall Score adalah rata-rata dari dimensi yang tersedia | POST dengan data seed yang diketahui; hitung ulang secara manual | `overall` = rata-rata dari dimensi dengan skor non-null, dibulatkan | Positif | P0 |
| TC-AC1.3-04 | Grade konsisten dengan Overall Score | POST dan bandingkan `overall` dengan `grade` | overall >= 75 → "Sangat Potensial"; >= 60 → "Potensi Bagus"; >= 45 → "Cukup Potensial"; < 45 → "Kurang Ideal" | Positif | P0 |
| TC-AC1.3-05 | Rekomendasi AI mengandung konteks skala bisnis | POST dengan scale="Kecil" dan scale="Besar" secara terpisah | Rekomendasi Kecil mengandung "modal < Rp 100jt"; rekomendasi Besar mengandung "modal > Rp 300jt" | Positif | P1 |

**Dicakup oleh suite yang ada:** TC-AC1.3-01 dicakup ANALYZE-001, ANALYZE-029. TC-AC1.3-04 dicakup ANALYZE-022. TC-AC1.3-05 dicakup EDGE-A-007. TC-AC1.3-02 (batas waktu 10 detik) belum diuji secara eksplisit.
**File terkait:** `app/api/analyze/route.js`, `lib/analysis.js`

---

#### AC1.4 — Warna progress bar: hijau >= 70, kuning 50–69, merah < 50

| ID | Skenario | Langkah | Hasil yang Diharapkan | Tipe | Prioritas |
| :---- | :---- | :---- | :---- | :---- | :---- |
| TC-AC1.4-01 | Skor >= 70 menampilkan warna hijau | Amati ResultPanel untuk dimensi dengan skor >= 70 | Progress bar berwarna `#10B981` | Positif | P1 |
| TC-AC1.4-02 | Skor 50–69 menampilkan warna kuning | Amati ResultPanel untuk dimensi dengan skor 50–69 | Progress bar berwarna `#F59E0B` | Positif | P1 |
| TC-AC1.4-03 | Skor < 50 menampilkan warna merah | Amati ResultPanel untuk dimensi dengan skor < 50 | Progress bar berwarna `#EF4444` | Positif | P1 |
| TC-AC1.4-04 | Nilai batas persis: skor = 70 | Rekayasa respons dengan skor = 70 | Warna hijau ditampilkan (bukan kuning) | Edge Case | P1 |
| TC-AC1.4-05 | Nilai batas persis: skor = 50 | Rekayasa respons dengan skor = 50 | Warna kuning ditampilkan (bukan merah) | Edge Case | P1 |

**Dicakup oleh suite yang ada:** Tidak ada. Fungsi `scoreColor` di `ResultPanel.jsx` menggunakan threshold >= 70 dan >= 50 yang berbeda dari AC1.4 (>= 70 dan 50–69), sesuai spesifikasi PRD.
**File terkait:** `components/ResultPanel.jsx` baris 14–17

---

#### AC1.5 — Perubahan pin memperbarui skor; request sebelumnya di-abort

| ID | Skenario | Langkah | Hasil yang Diharapkan | Tipe | Prioritas |
| :---- | :---- | :---- | :---- | :---- | :---- |
| TC-AC1.5-01 | Memindahkan pin memicu analisis baru | Klik lokasi A, tunggu hasil; klik lokasi B | Skor untuk lokasi B ditampilkan; bukan skor lokasi A | Positif | P0 |
| TC-AC1.5-02 | AbortController membatalkan request sebelumnya | Klik lokasi A, segera klik lokasi B sebelum respons A tiba | Hanya satu hasil analisis yang ditampilkan (lokasi B); tidak ada kondisi race condition yang menampilkan data lokasi A | Positif | P0 |
| TC-AC1.5-03 | Perubahan kategori memicu ulang analisis | Pilih kategori A, klik lokasi; pilih kategori B | Skor diperbarui untuk kombinasi lokasi + kategori B | Positif | P1 |
| TC-AC1.5-04 | Perubahan radius memicu ulang analisis | Set radius 500 m, jalankan analisis; ubah ke 1000 m | Analisis baru dijalankan dengan radius 1000 m; skor mungkin berbeda | Positif | P1 |

**Dicakup oleh suite yang ada:** Logika abort ada di `App.jsx` baris 60–61 dengan `abortRef`. Belum ada test komponen. Uji manual atau Playwright diperlukan.
**File terkait:** `components/App.jsx` fungsi `runAnalysis`

---

#### AC1.6 — Tombol Analisis disabled jika kategori belum dipilih

| ID | Skenario | Langkah | Hasil yang Diharapkan | Tipe | Prioritas |
| :---- | :---- | :---- | :---- | :---- | :---- |
| TC-AC1.6-01 | Tombol disabled saat belum ada kategori | Buka aplikasi, klik lokasi di peta tanpa memilih kategori | Tombol "Analisis" berstatus disabled; tooltip menampilkan "Pilih jenis bisnis terlebih dahulu" | Negatif | P0 |
| TC-AC1.6-02 | Tombol disabled saat belum ada lokasi | Pilih kategori tanpa klik peta | Tombol "Analisis" berstatus disabled | Negatif | P0 |
| TC-AC1.6-03 | Tombol aktif setelah keduanya tersedia | Pilih kategori DAN klik lokasi | Tombol "Analisis" menjadi enabled dan dapat diklik | Positif | P0 |

**Dicakup oleh suite yang ada:** Tidak ada. Logika ini ada di `EmptyState.jsx` dan `Sidebar.jsx`. Diperlukan uji manual atau E2E.
**File terkait:** `components/EmptyState.jsx`, `components/Sidebar.jsx`

---

#### AC1.7 — Error handling: API gagal menampilkan pesan dengan tombol "Coba Lagi"

| ID | Skenario | Langkah | Hasil yang Diharapkan | Tipe | Prioritas |
| :---- | :---- | :---- | :---- | :---- | :---- |
| TC-AC1.7-01 | Respons 5xx dari API menampilkan pesan error | Paksa API mengembalikan 500; jalankan analisis | Pesan error ditampilkan di UI; tombol "Coba Lagi" tersedia | Negatif | P0 |
| TC-AC1.7-02 | Timeout jaringan menampilkan pesan error | Simulasikan timeout jaringan; jalankan analisis | Pesan error ditampilkan; tidak ada partial data yang ditampilkan | Negatif | P0 |
| TC-AC1.7-03 | Klik "Coba Lagi" memicu ulang analisis | Setelah error, klik tombol "Coba Lagi" | Analisis dijalankan kembali dengan parameter yang sama | Positif | P1 |

**Dicakup oleh suite yang ada:** Tidak ada test UI. `App.jsx` memiliki blok `catch` di `runAnalysis` tetapi tidak ada state error yang terlihat dalam 80 baris yang dibaca. Perlu verifikasi apakah state `analysisError` telah diimplementasikan.
**File terkait:** `components/App.jsx`, `components/Sidebar.jsx`, `components/ResultPanel.jsx`

---

#### AC1.8 — Banner informatif untuk lokasi di luar coverage data ESB

| ID | Skenario | Langkah | Hasil yang Diharapkan | Tipe | Prioritas |
| :---- | :---- | :---- | :---- | :---- | :---- |
| TC-AC1.8-01 | API mengembalikan `unsupported: true` untuk lokasi luar Jakarta | POST `/api/analyze` dengan koordinat Bogor (`-6.5971, 106.8060`) | HTTP 200; body `{ unsupported: true, message: "Area ini berada di luar cakupan AtlasAI..." }` | Negatif | P0 |
| TC-AC1.8-02 | UI menampilkan state "Area Belum Didukung" | Klik lokasi luar DKI Jakarta | Komponen `ResultPanel` menampilkan panel "Area Belum Didukung" dengan pesan informatif | Negatif | P0 |
| TC-AC1.8-03 | Analisis tetap berjalan (tidak crash) saat di luar coverage | POST ke lokasi luar Jakarta | Respons HTTP 200 diterima (bukan 4xx atau 5xx); proses tidak berhenti total | Negatif | P0 |

**Dicakup oleh suite yang ada:** TC-AC1.8-01 dan TC-AC1.8-03 dicakup ANALYZE-017 dan API-A-002. TC-AC1.8-02 (tampilan UI) belum dicakup.
**File terkait:** `app/api/analyze/route.js` baris 126–131, `components/ResultPanel.jsx` baris 30–43

---

#### AC1.9 — Klik di atas elemen UI tidak memindahkan pin

| ID | Skenario | Langkah | Hasil yang Diharapkan | Tipe | Prioritas |
| :---- | :---- | :---- | :---- | :---- | :---- |
| TC-AC1.9-01 | Klik tombol zoom tidak memindahkan pin | Klik tombol "+" atau "-" zoom peta | Pin tidak berpindah; koordinat tidak berubah | Edge Case | P1 |
| TC-AC1.9-02 | Klik legenda peta tidak memindahkan pin | Klik elemen legenda peta jika ada | Pin tetap di posisi sebelumnya | Edge Case | P1 |
| TC-AC1.9-03 | Klik di luar batas peta tidak memindahkan pin | Klik area sidebar/header | Pin tidak berpindah | Edge Case | P1 |

**Dicakup oleh suite yang ada:** Tidak ada. Memerlukan uji manual atau Playwright E2E dengan interaksi Leaflet.
**File terkait:** `components/MapView.jsx`

---

### US2 — Estimasi Profit Berbasis Data ESB

#### AC2.1 — Estimasi profit sebagai range min-max dengan disclaimer dinamis

| ID | Skenario | Langkah | Hasil yang Diharapkan | Tipe | Prioritas |
| :---- | :---- | :---- | :---- | :---- | :---- |
| TC-AC2.1-01 | Range profit ditampilkan dalam format Rp X jt – Rp Y jt | Jalankan analisis dengan seed data valid | UI dan API menampilkan `profitMin` dan `profitMax` sebagai angka dalam jutaan rupiah | Positif | P0 |
| TC-AC2.1-02 | Disclaimer dinamis menampilkan N dan R aktual | Jalankan analisis; amati disclaimer di bawah estimasi profit | Disclaimer berbunyi "Berdasarkan data [N]+ outlet ESB sejenis dalam radius [R]km" dengan nilai nyata dari query | Positif | P0 |
| TC-AC2.1-03 | Profil profit berbeda antar skala bisnis | Jalankan analisis dengan skala Kecil, Menengah, Besar di lokasi yang sama | `profitMin` Besar / `profitMin` Kecil ≈ 5.5 (rasio 2.2/0.4); Menengah / Kecil ≈ 2.5 | Positif | P0 |
| TC-AC2.1-04 | `profitSource` yang tepat dikembalikan di API | POST dengan >= 4 kompetitor yang memiliki revenue | `profitSource = "competitors"` | Positif | P1 |
| TC-AC2.1-05 | Fallback ke benchmark saat tidak ada revenue kompetitor | POST dengan kategori yang memiliki benchmark tetapi tidak ada kompetitor dengan revenue | `profitSource = "benchmark"`; nilai diambil dari `min_jt`/`max_jt` benchmark dikalikan skala | Positif | P1 |

**Dicakup oleh suite yang ada:** TC-AC2.1-03 dicakup ANALYZE-018, ANALYZE-019. TC-AC2.1-04 dicakup API-A-010. TC-AC2.1-01 dan TC-AC2.1-02 (tampilan UI disclaimer dinamis) belum dicakup.
**File terkait:** `lib/analysis.js` fungsi `calcProfitRange`, `components/ResultPanel.jsx`

---

#### AC2.2 — Tag insight maks. 6 item dengan kode warna sesuai tipe

| ID | Skenario | Langkah | Hasil yang Diharapkan | Tipe | Prioritas |
| :---- | :---- | :---- | :---- | :---- | :---- |
| TC-AC2.2-01 | API mengembalikan maksimal 6 tag | POST analisis valid | `tags.length` = 6 | Positif | P0 |
| TC-AC2.2-02 | Setiap tag memiliki properti `label` dan `type` | Periksa array `tags` dari respons API | Setiap item berisi `{ label: string, type: string }` | Positif | P0 |
| TC-AC2.2-03 | Tipe tag valid | Periksa nilai `type` dari setiap tag | Nilai `type` adalah salah satu dari: `positive`, `neutral`, `warning`, `info`, `negative` | Positif | P1 |
| TC-AC2.2-04 | Warna UI sesuai tipe tag | Amati komponen tag di ResultPanel | Tag `positive` berwarna hijau (#059669); `warning` kuning (#D97706); `info` biru (#06B6D4) | Positif | P1 |
| TC-AC2.2-05 | Tag traffic null menampilkan tipe 'warning' (bug terdokumentasi) | POST dengan Overpass timeout; traffic=null | `tags[0].type = 'warning'` meski traffic null — perilaku ini saat ini salah; harus 'info' atau 'unavailable' | Edge Case | P1 |

**Dicakup oleh suite yang ada:** EDGE-A-003, EDGE-A-004 mendokumentasikan bug tag null. TC-AC2.2-01 hingga TC-AC2.2-04 tidak diuji secara eksplisit dari perspektif AC.
**File terkait:** `lib/analysis.js` baris 58–65, `components/ResultPanel.jsx`

---

#### AC2.3 — Warning data terbatas (< 5 outlet referensi)

| ID | Skenario | Langkah | Hasil yang Diharapkan | Tipe | Prioritas |
| :---- | :---- | :---- | :---- | :---- | :---- |
| TC-AC2.3-01 | PRD mensyaratkan warning jika < 5 outlet | POST dengan kategori yang benchmark-nya memiliki `outlet_count` < 5 | UI menampilkan pesan warning: "Data terbatas (< 5 outlet referensi). Estimasi bersifat indikatif."; styling angka profit diperhalus | Negatif | P1 |
| TC-AC2.3-02 | Tidak ada warning saat >= 5 outlet | POST dengan `outlet_count` >= 5 | Tidak ada warning data terbatas | Positif | P1 |

**Dicakup oleh suite yang ada:** Tidak ada. Logika ini belum diimplementasikan di `lib/analysis.js` maupun di `components/ResultPanel.jsx` berdasarkan pembacaan kode saat ini. Ini adalah GAP IMPLEMENTASI sekaligus gap pengujian.
**File terkait:** `lib/analysis.js`, `components/ResultPanel.jsx`

---

#### AC2.4 — Blok estimasi diganti pesan jika tidak ada data outlet ESB sama sekali

| ID | Skenario | Langkah | Hasil yang Diharapkan | Tipe | Prioritas |
| :---- | :---- | :---- | :---- | :---- | :---- |
| TC-AC2.4-01 | `profitSource = "none"` ketika tidak ada data | POST dengan kategori yang tidak memiliki benchmark dan tidak ada kompetitor dengan revenue | API mengembalikan `profitSource = "none"`, `profitMin = null`, `profitMax = null` | Negatif | P1 |
| TC-AC2.4-02 | UI menyembunyikan blok estimasi dan menampilkan pesan pengganti | Buka UI dengan result yang memiliki `profitSource = "none"` | Teks "Estimasi profit belum tersedia untuk area ini." ditampilkan alih-alih range angka | Negatif | P1 |

**Dicakup oleh suite yang ada:** TC-AC2.4-01 dicakup API-A-008 dan EDGE-A-002. TC-AC2.4-02 (tampilan UI) belum dicakup.
**File terkait:** `lib/analysis.js` baris 103–107, `components/ResultPanel.jsx`

---

#### AC2.5 — Flag variance tinggi jika SD > 60% mean

| ID | Skenario | Langkah | Hasil yang Diharapkan | Tipe | Prioritas |
| :---- | :---- | :---- | :---- | :---- | :---- |
| TC-AC2.5-01 | Flag variance tinggi ditampilkan saat SD > 60% mean | Seed data kompetitor dengan revenue sangat bervariasi (mis. 5 jt, 10 jt, 100 jt, 200 jt) | UI menampilkan flag: "Volatilitas data tinggi — estimasi memiliki tingkat ketidakpastian lebih besar." | Edge Case | P2 |
| TC-AC2.5-02 | Tidak ada flag saat variance normal | Seed data dengan spread revenue yang wajar | Flag volatilitas tidak muncul | Edge Case | P2 |

**Dicakup oleh suite yang ada:** Tidak ada. Logika kalkulasi SD belum ada di `lib/analysis.js` saat ini — ini adalah GAP IMPLEMENTASI. `calcProfitRange` hanya menghitung IQR, bukan SD.
**File terkait:** `lib/analysis.js` fungsi `calcProfitRange` (perlu penambahan logika SD)

---

### US3 — Export Laporan Analisis

#### AC3.1 — Tombol Export aktif hanya setelah analisis berhasil

| ID | Skenario | Langkah | Hasil yang Diharapkan | Tipe | Prioritas |
| :---- | :---- | :---- | :---- | :---- | :---- |
| TC-AC3.1-01 | Tombol Export disabled sebelum analisis | Buka aplikasi tanpa menjalankan analisis | Tombol "Export Laporan PDF" berstatus disabled; tooltip "Jalankan analisis terlebih dahulu" | Positif | P0 |
| TC-AC3.1-02 | Tombol Export aktif setelah analisis berhasil | Jalankan analisis hingga mendapat hasil | Tombol "Export Laporan PDF" menjadi enabled | Positif | P0 |
| TC-AC3.1-03 | Tombol Export tidak aktif untuk hasil `unsupported` | Klik lokasi luar Jakarta; terima respons unsupported | Tombol Export tetap disabled (tidak ada data yang bisa diexport) | Edge Case | P1 |

**Dicakup oleh suite yang ada:** Tidak ada. Kondisi ini dikendalikan oleh state `analysisResult` di `App.jsx`. Diperlukan uji manual atau E2E.
**File terkait:** `components/ResultPanel.jsx`, `components/PDFPreviewModal.jsx`, `components/App.jsx`

---

#### AC3.2 — Konten PDF memuat semua elemen yang disyaratkan

| ID | Skenario | Langkah | Hasil yang Diharapkan | Tipe | Prioritas |
| :---- | :---- | :---- | :---- | :---- | :---- |
| TC-AC3.2-01 | PDF memuat nama jenis bisnis | Generate PDF, buka file | Nama kategori (mis. "Kopi & Cafe") tercantum di PDF | Positif | P1 |
| TC-AC3.2-02 | PDF memuat koordinat lokasi | Generate PDF | Koordinat lat/lng tercantum | Positif | P1 |
| TC-AC3.2-03 | PDF memuat tanggal analisis | Generate PDF | Tanggal analisis dalam format lokal Indonesia tercantum | Positif | P1 |
| TC-AC3.2-04 | PDF memuat 5 dimensi skor dan Overall Score | Generate PDF | Semua 5 label dimensi, nilai skor, Overall Score, dan grade tercantum | Positif | P1 |
| TC-AC3.2-05 | PDF memuat estimasi profit dan tag insight | Generate PDF | Range profitMin–profitMax (dalam Rp jt) dan minimal 1 tag insight tercantum | Positif | P1 |
| TC-AC3.2-06 | PDF memuat rekomendasi AI | Generate PDF | Teks rekomendasi tidak kosong di PDF | Positif | P1 |
| TC-AC3.2-07 | PDF memuat disclaimer ESB AtlasAI | Generate PDF | Teks disclaimer "ESB AtlasAI" atau sejenisnya tercantum | Positif | P1 |

**Dicakup oleh suite yang ada:** Tidak ada. Konten PDF dirender di DOM terlebih dahulu oleh `PDFPreviewModal.jsx` sebelum di-capture `html2canvas`. Uji visual/E2E atau inspeksi DOM snapshot diperlukan.
**File terkait:** `components/PDFPreviewModal.jsx`

---

#### AC3.3 — Format nama file PDF yang benar

| ID | Skenario | Langkah | Hasil yang Diharapkan | Tipe | Prioritas |
| :---- | :---- | :---- | :---- | :---- | :---- |
| TC-AC3.3-01 | Format nama file sesuai spesifikasi | Klik Export untuk kategori "Ayam Goreng" di koordinat (-6.2088, 106.8456) | File tersimpan dengan nama `ESB_AtlasAI_AyamGoreng_[YYYYMMDD]_-6.2088_106.8456.pdf` | Positif | P1 |
| TC-AC3.3-02 | Spasi dalam nama kategori dihilangkan | Export untuk "Kopi & Cafe" | Nama file mengandung "Kopi&Cafe" atau "KopiCafe" (tanpa spasi) | Positif | P1 |
| TC-AC3.3-03 | Tanggal dalam format YYYYMMDD | Export | Bagian tanggal di nama file adalah 8 digit angka | Positif | P1 |

**Dicakup oleh suite yang ada:** Tidak ada. Logika penamaan ada di `PDFPreviewModal.jsx` baris 61–62. Berdasarkan kode: `pdf.save(\`ESB_AtlasAI_${(category ?? 'Analisis').replace(/\s/g, '')}_${ds}_${lat}_${lng}.pdf\`)`. Replace `/\s/g` menghilangkan semua spasi tetapi simbol `&` tetap ada, menghasilkan "Kopi&Cafe".
**File terkait:** `components/PDFPreviewModal.jsx` baris 61–62

---

#### AC3.4 — Pesan error jika generasi PDF gagal

| ID | Skenario | Langkah | Hasil yang Diharapkan | Tipe | Prioritas |
| :---- | :---- | :---- | :---- | :---- | :---- |
| TC-AC3.4-01 | Error html2canvas ditangani dengan graceful | Paksa `html2canvas` melempar error; klik Export | Pesan error "Gagal mengunduh laporan. Silakan coba lagi." ditampilkan; tidak ada file parsial yang terunduh | Negatif | P1 |
| TC-AC3.4-02 | Tidak ada file PDF parsial yang tersimpan saat error | Simulasikan error di tengah proses | File tidak muncul di direktori download | Negatif | P1 |

**Dicakup oleh suite yang ada:** Tidak ada. `PDFPreviewModal.jsx` menggunakan blok `try/finally` tetapi tidak terlihat ada penanganan error UI yang eksplisit (hanya `setDownloading(false)` di `finally`). Ini adalah GAP IMPLEMENTASI — pesan error belum diimplementasikan.
**File terkait:** `components/PDFPreviewModal.jsx` baris 44–67

---

#### AC3.5 — Debounce tombol Export saat PDF sedang dibuat

| ID | Skenario | Langkah | Hasil yang Diharapkan | Tipe | Prioritas |
| :---- | :---- | :---- | :---- | :---- | :---- |
| TC-AC3.5-01 | Klik ganda diabaikan selama proses generasi | Klik tombol Export dua kali dengan cepat | Hanya satu proses generasi PDF yang berjalan; tombol masuk loading state setelah klik pertama | Edge Case | P1 |
| TC-AC3.5-02 | Tombol kembali normal setelah PDF selesai | Tunggu PDF selesai diunduh | Tombol Export kembali ke state normal (tidak loading) | Positif | P1 |

**Dicakup oleh suite yang ada:** Tidak ada. State `downloading` di `PDFPreviewModal.jsx` memberikan perlindungan parsial tapi kondisi AC3.5 belum diuji secara eksplisit.
**File terkait:** `components/PDFPreviewModal.jsx` state `downloading`

---

## 7. Analisis Gap dan Rekomendasi Suite Berikutnya

### Gap 1 — `GET /api/analysis/history` — Prioritas: P0

Rute membaca cookie `atlas_token`, memverifikasinya, dan mengembalikan hingga 100 analisis tersimpan untuk user yang terautentikasi diurutkan berdasarkan `created_at DESC`. Tidak ada file test yang ada.

Skenario yang disarankan:
- HIS-001: Tidak ada cookie → HTTP 401, body `{ items: [] }`
- HIS-002: Cookie valid user A → hanya item user A yang dikembalikan (isolasi per-user; cek IDOR — item user B tidak boleh muncul)
- HIS-003: JWT yang dirusak → HTTP 401
- HIS-004: JWT kedaluwarsa → HTTP 401
- HIS-005: JWT `alg:none` → HTTP 401
- HIS-006: User baru tanpa analisis tersimpan → HTTP 200, body `{ items: [] }`
- HIS-007: User dengan tepat 100 analisis tersimpan → `items.length === 100`
- HIS-008: User dengan 101 analisis tersimpan → `items.length === 100` (batas hard via `take: 100`)
- HIS-009: Item dikembalikan dalam urutan `created_at` menurun — yang terbaru pertama
- HIS-010: Setiap item berisi `id`, `location`, `category`, `lat`, `lng`, `radius`, `overall`, `grade`, `result_json`, `created_at`
- HIS-011: `GET /api/analysis/history` dengan method POST → HTTP 405
- HIS-012: DB tidak tersedia → HTTP 500 atau graceful error (tidak ada try/catch yang membungkus panggilan `repo.find`)
- HIS-013 hingga HIS-020: Pemeriksaan IDOR — bangun JWT valid untuk user B, panggil endpoint; konfirmasi item yang dikembalikan hanya milik user B

ID yang disarankan: HIS-001 hingga HIS-020
**Catatan keamanan:** `history/route.js` tidak memiliki try/catch di sekitar `repo.find` (baris 19–23). Kegagalan DB akan menghasilkan unhandled 500.

---

### Gap 2 — `POST /api/analysis/save` — Prioritas: P1

Rute mengautentikasi, memvalidasi enam field yang diperlukan, menyimpan ke `saved_analyses`, dan mengembalikan `{ id, created_at }`.

Skenario yang disarankan:
- SAVE-001: POST terautentikasi valid dengan semua field → HTTP 200, body `{ id: <uuid>, created_at: <iso> }`
- SAVE-002: Tidak ada cookie → HTTP 401, body `{ error: 'Unauthorized' }`
- SAVE-003: Field `location` missing → HTTP 400, body `{ error: 'Missing fields' }`
- SAVE-004: Field `result` missing → HTTP 400, body `{ error: 'Missing fields' }`
- SAVE-005: BUG — validasi `!lat || !lng`; `lat=0` dan `lng=0` falsy → HTTP 400 untuk koordinat valid Null Island
- SAVE-006: Item tersimpan muncul di respons `GET /api/analysis/history` berikutnya untuk user yang sama
- SAVE-007: Item tersimpan TIDAK muncul di `GET /api/analysis/history` untuk user berbeda (isolasi)
- SAVE-008: Body non-JSON → tidak ada try/catch di sekitar `req.json()` → HTTP 500
- SAVE-009: JWT kedaluwarsa → HTTP 401
- SAVE-010: JWT dirusak → HTTP 401

ID yang disarankan: SAVE-001 hingga SAVE-020

---

### Gap 3 — `DELETE /api/analysis/save` — Prioritas: P1

Rute mengautentikasi, membaca `id` dari body request, dan memanggil `repo.delete({ id, user_id: payload.userId })`. Filter `user_id` adalah perlindungan IDOR.

Skenario yang disarankan:
- DEL-001: DELETE terautentikasi untuk record sendiri → HTTP 200, body `{ ok: true }`; record dihapus dari histori
- DEL-002: Tidak ada cookie → HTTP 401
- DEL-003: Field `id` missing → HTTP 400, body `{ error: 'Missing id' }`
- DEL-004: Pemeriksaan IDOR — user B mencoba DELETE record milik user A; filter TypeORM `{ id, user_id }` menyebabkan no-op; verifikasi record user A masih ada
- DEL-005: `id` tidak ada → `repo.delete` berhasil silently; HTTP 200 `{ ok: true }` (delete TypeORM pada kunci non-existent bukan error)
- DEL-006: Body non-JSON → HTTP 500 (tidak ada try/catch di sekitar `req.json()`)
- DEL-007: Record yang dihapus tidak lagi muncul di `GET /api/analysis/history`

ID yang disarankan: DEL-001 hingga DEL-015

---

### Gap 4 — `POST /api/auth/logout` — Prioritas: P1

Rute menetapkan cookie `atlas_token` dengan `maxAge: 0` untuk menghapusnya. Tidak diperlukan autentikasi sebelum penghapusan.

Skenario yang disarankan:
- LGOUT-001: POST → HTTP 200, body `{ ok: true }`; header `Set-Cookie` membersihkan `atlas_token` (`Max-Age=0`)
- LGOUT-002: Setelah logout, cookie yang dihapus ditolak oleh `GET /api/analysis/history` → HTTP 401
- LGOUT-003: Logout tanpa sesi sebelumnya (tidak ada cookie) → HTTP 200 (rute tidak memerlukan cookie)
- LGOUT-004: Method GET salah → HTTP 405

ID yang disarankan: LGOUT-001 hingga LGOUT-010

---

### Gap 5 — `GET /api/auth/me` — Prioritas: P1

Rute membaca cookie, memverifikasinya, dan mengembalikan `{ user: { userId, name, bisnis_name, email } }` atau `{ user: null }` dengan HTTP 401.

Skenario yang disarankan:
- ME-001: Cookie valid → HTTP 200, body `{ user: { userId, name, bisnis_name, email } }`
- ME-002: Tidak ada cookie → HTTP 401, body `{ user: null }`
- ME-003: JWT dirusak → HTTP 401, body `{ user: null }`
- ME-004: JWT kedaluwarsa → HTTP 401, body `{ user: null }`
- ME-005: JWT `alg:none` → HTTP 401, body `{ user: null }`
- ME-006: Respons TIDAK mengandung `password_hash` atau nilai password apapun
- ME-007: Method POST salah → HTTP 405

ID yang disarankan: ME-001 hingga ME-010

---

### Gap 6 — Unit Test Engine Skoring (`lib/analysis.js`) — Prioritas: P1

Test analyze yang ada menyematkan replika formula secara inline alih-alih mengimport dari `lib/analysis.js`. File unit test khusus akan menguji fungsi yang diekspor secara langsung.

Skenario yang disarankan:
- UNIT-001 hingga UNIT-010: `generateAnalysis()` dengan fixture `realData` terkontrol — verifikasi setiap skor dimensi, rata-rata keseluruhan, grade, range profit, dan tag
- UNIT-011: `calcProfitRange` dengan array revenues panjang 0, 1, 2, 3, 4, 5 — verifikasi pemilihan cabang IQR/min-max tepat di batas 4
- UNIT-012: `calcCompetitionScore` dengan dan tanpa benchmark — verifikasi formula rasio dan clamping di 15 dan 90
- UNIT-013: `getRecommendation` untuk masing-masing empat band skor dan masing-masing tiga skala
- UNIT-014: Variasi tinggi SD > 60% mean — validasi bahwa kalkulasi flag variance (AC2.5) menghasilkan output yang benar ketika diimplementasikan
- UNIT-015: Threshold warning data terbatas (AC2.3) — `referenceCount < 5` menghasilkan flag warning

ID yang disarankan: UNIT-001 hingga UNIT-030

---

### Gap 7 — Implementasi AC yang Belum Ada di Kode — Prioritas: P0 sebelum launch

Berikut adalah AC dari PRD yang belum diimplementasikan di kode berdasarkan inspeksi sumber:

| AC | Deskripsi Gap | Prioritas |
| :---- | :---- | :---- |
| AC1.7 | State error dengan tombol "Coba Lagi" tidak terlihat di `App.jsx` (hanya ada catch kosong) | P0 |
| AC2.3 | Warning "Data terbatas (< 5 outlet referensi)" tidak ada di `lib/analysis.js` maupun `ResultPanel.jsx` | P1 |
| AC2.5 | Logika kalkulasi SD dan flag volatilitas belum ada di `lib/analysis.js` | P2 |
| AC3.4 | Penanganan error PDF dengan pesan "Gagal mengunduh laporan" tidak ada di `PDFPreviewModal.jsx` (hanya `finally` tanpa tampilan pesan error) | P1 |

---

## 8. Registri Bug

| ID | Keparahan | Deskripsi | Lokasi | Test Reproduksi | Status |
| :---- | :---- | :---- | :---- | :---- | :---- |
| BUG-001 | Kritis | `POST /api/analyze` tidak memiliki guard autentikasi. Pemanggil anonim menerima hasil analisis lengkap, mengkonsumsi query DB dan anggaran Overpass API. | `app/api/analyze/route.js` baris 94 (seluruh handler — tidak ada verifikasi cookie) | SEC-A-001, ANALYZE-005 | Terbuka |
| BUG-002 | Tinggi | Tidak ada validasi input di `POST /api/analyze`. `lat`, `lng`, `radius` yang missing dan nilai di luar rentang tidak ditolak dengan HTTP 400; mereka masuk ke SQL dan dapat menghasilkan aritmetika NaN yang senyap. | `app/api/analyze/route.js` baris 95 (tidak ada blok validasi) | ANALYZE-008, ANALYZE-009, ANALYZE-011, ANALYZE-012, ANALYZE-013 | Terbuka |
| BUG-003 | Tinggi | Tidak ada rate limiting di `POST /api/auth/login`. Credential stuffing cepat mengembalikan 401 untuk setiap percobaan tanpa backoff 429. | `app/api/auth/login/route.js` (tidak ada middleware) | SEC-L-007 | Terbuka |
| BUG-004 | Tinggi | Tidak ada rate limiting di `POST /api/auth/register`. Pembuatan akun cepat atau enumerasi dimungkinkan. | `app/api/auth/register/route.js` (tidak ada middleware) | SEC-R-010 | Terbuka |
| BUG-005 | Tinggi | `POST /api/analyze` tidak memiliki `try/catch`. Body request non-JSON menyebabkan `request.json()` melempar error, menghasilkan unhandled HTTP 500 alih-alih respons error yang graceful. Rute auth membungkus semuanya dalam `try/catch`; rute ini tidak. | `app/api/analyze/route.js` baris 95 | ANALYZE-016, API-A-005 | Terbuka |
| BUG-006 | Sedang | Guard password di `POST /api/auth/register` adalah `!password` (falsy), bukan `!password.trim()`. Password yang hanya terdiri dari whitespace 8+ spasi lolos pemeriksaan keberadaan dan panjang lalu di-hash dan disimpan. | `app/api/auth/register/route.js` baris 10 | EDGE-R-006, TC-AC1.6-01 | Terbuka |
| BUG-007 | Sedang | Validasi format email di `POST /api/auth/register` hanya menggunakan `!email.includes('@')`. String `"@"`, `"user@"`, dan `"a@@b.com"` semua lolos meski merupakan alamat RFC 5321 tidak valid. | `app/api/auth/register/route.js` baris 16 | AUTH-R-021, AUTH-R-022, EDGE-R-012 | Terbuka |
| BUG-008 | Sedang | Race condition di `POST /api/auth/register`: dua request konkuren untuk email yang sama keduanya lolos pemeriksaan `findOne`, lalu `repo.save` kedua mengenai unique constraint DB dan mengembalikan HTTP 500 alih-alih 409 yang bersih. | `app/api/auth/register/route.js` baris 23–35 | API-R-010 | Terbuka |
| BUG-009 | Sedang | Perbandingan traffic dan accessibility null di `lib/analysis.js`: `null > 70` dan `null > 45` keduanya bernilai `false` di JS, sehingga skor null selalu menghasilkan tipe tag `'warning'`. Skor null seharusnya menghasilkan tipe `'info'` atau `'unavailable'`, bukan `'warning'`. Ini melanggar AC2.2. | `lib/analysis.js` baris 59, 61 | EDGE-A-003, EDGE-A-004, TC-AC2.2-05 | Terbuka |
| BUG-010 | Sedang | `referenceCount` diinterpolasi langsung ke dalam template literal tag: `` `${referenceCount} outlet referensi` ``. Ketika `referenceCount` adalah `null` (tidak ada benchmark yang cocok), label yang dirender adalah `"null outlet referensi"`. | `lib/analysis.js` baris 64 | EDGE-A-005 | Terbuka |
| BUG-011 | Sedang | Radius tidak divalidasi terhadap rentang 200–1500 m yang terdokumentasi di `POST /api/analyze`. Pemanggil dapat mengirimkan `radius=999999`, menyebabkan pemindaian bounding box Haversine yang sangat lebar di PostgreSQL dan query Overpass besar — vektor resource amplification DoS. | `app/api/analyze/route.js` (tidak ada pemeriksaan rentang) | SEC-A-005, ANALYZE-012, ANALYZE-013 | Terbuka |
| BUG-012 | Sedang | Guard validasi `POST /api/analysis/save` menggunakan pemeriksaan falsy: `!lat || !lng`. Koordinat `lat=0` dan `lng=0` (Null Island) secara numerik valid tetapi falsy di JS, menyebabkan rute mengembalikan HTTP 400 untuk pasangan koordinat yang sah. | `app/api/analysis/save/route.js` baris 18 | SAVE-005, TC-AC2.1-01 | Terbuka |
| BUG-013 | Sedang | AC1.7 (pesan error dengan tombol "Coba Lagi" saat API gagal) tidak diimplementasikan di `App.jsx`. Blok `catch` di `runAnalysis` tampaknya tidak menetapkan state error yang terlihat di UI. | `components/App.jsx` fungsi `runAnalysis` (baris ~68 dst.) | TC-AC1.7-01, TC-AC1.7-02 | Terbuka (gap implementasi) |
| BUG-014 | Sedang | AC2.3 (warning data terbatas < 5 outlet) tidak diimplementasikan di `lib/analysis.js` maupun `ResultPanel.jsx`. `referenceCount` tersedia di respons API tetapi tidak ada logika kondisional yang menghasilkan teks warning. | `lib/analysis.js`, `components/ResultPanel.jsx` | TC-AC2.3-01 | Terbuka (gap implementasi) |
| BUG-015 | Sedang | AC3.4 (pesan error PDF) tidak diimplementasikan. `PDFPreviewModal.jsx` menggunakan `try/finally` tetapi tidak ada state error yang mencegah tampilan pesan "Gagal mengunduh laporan". | `components/PDFPreviewModal.jsx` baris 44–67 | TC-AC3.4-01 | Terbuka (gap implementasi) |
| BUG-016 | Rendah | Guard password di `POST /api/auth/login` adalah `!password` tanpa `.trim()`. String password yang hanya terdiri dari whitespace melewati guard dan mencapai `bcrypt.compare`, yang dengan benar gagal (mengembalikan 401). Perilakunya akhirnya benar tetapi tidak konsisten dengan sisi email yang menggunakan `.trim()`. | `app/api/auth/login/route.js` baris 10 | AUTH-L-009 | Terbuka (Low) |
| BUG-017 | Rendah | Tidak ada perlindungan CSRF selain `SameSite: 'lax'` pada endpoint login dan register. Navigasi POST top-level lintas situs dapat berhasil di beberapa konfigurasi browser. | `lib/auth.js` fungsi `cookieOpts()` | Informasional | Terbuka |
| BUG-018 | Rendah | bcrypt secara diam-diam memotong password yang melebihi 72 byte. Dua password yang berbagi 72 byte pertama yang sama menghasilkan hash yang identik. Ini adalah perilaku bcrypt yang terdokumentasi tetapi menciptakan risiko kolisi yang tidak jelas untuk password yang sangat panjang. | `lib/auth.js` baris 8 (panggilan bcryptjs) | EDGE-L-002, EDGE-R-002 | Terbuka (Low) |
| BUG-019 | Rendah | `GET /api/analysis/history` tidak memiliki try/catch di sekitar `repo.find`. Kegagalan DB menghasilkan unhandled HTTP 500 alih-alih respons error yang graceful. | `app/api/analysis/history/route.js` baris 19–23 | HIS-012 | Terbuka |
| BUG-020 | Rendah | `POST /api/analysis/save` tidak memiliki try/catch di sekitar `req.json()`. Body non-JSON menghasilkan HTTP 500 alih-alih HTTP 400 yang graceful. | `app/api/analysis/save/route.js` baris 17 | SAVE-008 | Terbuka |

---

## 9. Urutan Eksekusi Pengujian

1. Mulai database PostgreSQL (Docker lokal atau Neon).
2. Jalankan `npm run migration:run` untuk menerapkan semua migrasi TypeORM.
3. Jalankan `npm run seed` untuk mengisi `profit_benchmarks`, `competitors`, dan `area_demographics`.
4. Mulai server Next.js (`npm run dev` atau `npm run start`) dan konfirmasi dapat diakses di `TEST_BASE_URL`.
5. Jalankan `tests/api/auth/register.test.js` — suite ini membuat user yang dibutuhkan oleh suite downstream dan menguji siklus hidup registrasi terlebih dahulu.
6. Jalankan `tests/api/auth/login.test.js` — bergantung pada registrasi yang berfungsi; menguji penerbitan JWT yang digunakan dalam semua test terautentikasi.
7. Jalankan `tests/api/analyze/route.test.js` — mendaftarkan dan login user sendiri di `beforeAll`; memerlukan data seed; harus mengikuti langkah 2–4.
8. Jalankan `tests/api/auth/me.test.js` (ketika dibuat) — bergantung pada JWT valid dari login.
9. Jalankan `tests/api/analysis/save.test.js` (ketika dibuat) — membuat record tersimpan yang dibutuhkan oleh test histori.
10. Jalankan `tests/api/analysis/history.test.js` (ketika dibuat) — harus mengikuti test save agar ada data yang bisa diambil.
11. Jalankan `tests/api/auth/logout.test.js` (ketika dibuat) — suite auth terakhir; memverifikasi pembersihan cookie.
12. Jalankan unit test untuk `lib/analysis.js` (ketika dibuat) — tidak memerlukan server; dapat berjalan secara terpisah kapan saja.
13. Lakukan pengujian manual atau Playwright E2E untuk semua AC komponen UI: AC1.1–AC1.9, AC2.1–AC2.5, AC3.1–AC3.5.

---

## 10. Definisi Selesai (Definition of Done)

- Semua suite P0 (auth/register, auth/login, analyze, history) lulus dengan nol kegagalan di lingkungan bersih.
- Semua suite P1 (save, delete, logout, me) lulus dengan nol kegagalan.
- Entri Bug Registry BUG-001 hingga BUG-005 (keparahan Kritis dan Tinggi) diselesaikan dan masing-masing memiliki test regresi yang sekarang lulus.
- Gap implementasi yang terkait AC PRD (BUG-013 hingga BUG-015: AC1.7, AC2.3, AC3.4) telah diimplementasikan di kode dan diverifikasi lulus test case masing-masing.
- Tidak ada test yang ditandai sebagai `skip` atau `todo` tanpa issue terkait yang melacak resolusinya.
- Test keamanan JWT (`alg:none`, signature rusak, token kedaluwarsa, cookie hilang) lulus untuk setiap endpoint terautentikasi.
- Test rate limiting informasional (SEC-L-007, SEC-R-010) baik mengkonfirmasi respons 429 ada atau secara eksplisit diterima sebagai temuan yang ditangguhkan dalam backlog proyek.
- Cakupan kode untuk `lib/analysis.js` mencapai 100% line coverage via suite unit test khusus.
- Seluruh 9 AC dari US1–US3 (AC1.1–AC1.9, AC2.1–AC2.5, AC3.1–AC3.5) telah diverifikasi — baik melalui test otomatis maupun sign-off pengujian manual yang terdokumentasi.
- Pipeline CI mengeksekusi suite lengkap (`NODE_OPTIONS=--experimental-vm-modules npx jest tests/api/ --runInBand`) dan memblokir merge pada kegagalan apapun.
- Dokumen ini diperbarui pada setiap sprint untuk mencerminkan perubahan cakupan, bug baru, dan AC baru.
