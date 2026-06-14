# Katalog Test Case — ESB AtlasAI

| Dokumen ID | TC-ATLASAI-001 |
| :---- | :---- |
| Versi | 1.0 |
| Tanggal | 14 Juni 2026 |
| Status | Draft |
| Referensi PRD | PRD-ATLASAI-001 |
| Referensi Test Plan | TP-ATLASAI-001 |
| Engineer Lead | Diki Taurens Sia |

---

## Daftar Isi

1. [US1 — Analisis Kelayakan Lokasi](#us1--analisis-kelayakan-lokasi)
2. [US2 — Estimasi Profit Berbasis Data ESB](#us2--estimasi-profit-berbasis-data-esb)
3. [US3 — Export Laporan PDF](#us3--export-laporan-pdf)
4. [AUTH — Autentikasi (Register & Login)](#auth--autentikasi-register--login)
5. [HIST — Riwayat & Simpan Analisis](#hist--riwayat--simpan-analisis)
6. [SEC — Keamanan](#sec--keamanan)
7. [EDGE — Edge Cases Engine Skoring](#edge--edge-cases-engine-skoring)

---

## Konvensi

| Istilah | Keterangan |
| :---- | :---- |
| Koordinat Jakarta valid | lat: -6.2088, lng: 106.8228 (Sudirman CBD) |
| Koordinat luar Jakarta | lat: -6.5971, lng: 106.8060 (Bogor) |
| Token valid | JWT HS256 diperoleh dari login berhasil; belum kedaluwarsa |
| Token kedaluwarsa | JWT dengan klaim `exp` di masa lalu |
| Token palsu | String `Bearer invalid.token.here` |
| Token alg:none | JWT dengan header `{"alg":"none"}`, tanpa signature |

---

## US1 — Analisis Kelayakan Lokasi

### AC1.1 — Tampilan 6 Kategori Bisnis

| ID | Judul | AC | Prakondisi | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---|:-----------|:------------|:----------------------|:-----|:---------|
| TC-001 | Enam kategori tampil dengan ikon dan label | AC1.1 | Aplikasi terbuka di browser desktop (viewport >= 768 px) | 1. Buka `http://localhost:3000` tanpa login. | Terlihat 6 kartu kategori: Ayam Goreng, Kopi & Cafe, Mie & Bakso, Minuman, Burger, Lainnya. Setiap kartu memiliki ikon emoji dan label teks yang terbaca. | Positif | P0 |
| TC-002 | Kategori yang dipilih mendapat border oranye | AC1.1 | Halaman awal terbuka | 1. Klik kartu "Kopi & Cafe". | Kartu "Kopi & Cafe" menampilkan border warna `#FF6B2B` dan background tinted oranye. Kartu lain tidak memiliki indikator aktif. | Positif | P0 |
| TC-003 | Hanya satu kategori aktif pada satu waktu | AC1.1 | Kategori "Kopi & Cafe" sudah dipilih | 1. Klik kartu "Burger". | Kartu "Burger" menjadi aktif dengan border oranye. Kartu "Kopi & Cafe" kembali ke tampilan normal tanpa border oranye. | Positif | P0 |
| TC-004 | Enam kategori tampil di mobile | AC1.1 | Viewport diatur ke lebar < 768 px | 1. Buka aplikasi di browser mobile atau resize window. 2. Geser MobileBottomSheet ke posisi terbuka. | Enam kartu kategori tampil lengkap di dalam bottom sheet dengan ikon dan label yang sama seperti desktop. | Positif | P1 |

### AC1.2 — Pin Oranye, Koordinat Real-Time, Lingkaran Radius

| ID | Judul | AC | Prakondisi | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---|:-----------|:------------|:----------------------|:-----|:---------|
| TC-005 | Klik peta menempatkan pin di koordinat yang benar | AC1.2 | Peta Jakarta terbuka | 1. Klik satu titik di dalam wilayah DKI Jakarta pada peta. | Pin oranye muncul tepat di titik yang diklik. Koordinat (lat, lng) ditampilkan secara real-time di UI sidebar. | Positif | P0 |
| TC-006 | Lingkaran radius putus-putus tampil setelah pin ditempatkan | AC1.2 | Pin sudah ditempatkan, radius default 500 m | 1. Amati peta setelah pin ditempatkan. | Lingkaran putus-putus tampil mengelilingi pin dengan radius visual yang proporsional terhadap 500 m di skala peta saat ini. | Positif | P0 |
| TC-007 | Perubahan radius memperbarui lingkaran secara visual | AC1.2 | Pin sudah ditempatkan, radius 500 m | 1. Geser slider radius dari 500 m ke 1000 m. | Lingkaran radius pada peta meluas secara visual. Nilai radius yang ditampilkan di UI berubah menjadi 1000 m. | Positif | P1 |
| TC-008 | Klik tombol zoom peta tidak memindahkan pin | AC1.2 / AC1.9 | Pin sudah ditempatkan di koordinat A | 1. Catat koordinat pin saat ini. 2. Klik tombol zoom "+" pada kontrol peta. | Pin tetap berada di koordinat A. Koordinat yang ditampilkan di UI tidak berubah. | Edge Case | P1 |

### AC1.3 — Hasil Analisis Lengkap dalam <= 10 Detik

| ID | Judul | AC | Prakondisi | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---|:-----------|:------------|:----------------------|:-----|:---------|
| TC-009 | POST /api/analyze mengembalikan struktur respons lengkap | AC1.3 | Seed data tersedia; user sudah login dan memiliki cookie `atlas_token` valid | 1. Kirim `POST /api/analyze` dengan body: `{"lat":-6.2088,"lng":106.8228,"category":"Kopi & Cafe","radius":500,"scale":"Menengah"}`. | HTTP 200. Body mengandung: `overall` (angka 0–100), `grade` (salah satu dari 4 nilai valid), array `dimensions` dengan 5 item, string `recommendation` tidak kosong, array `tags`, `profitMin`, `profitMax`, `scale`. | Positif | P0 |
| TC-010 | Waktu respons API tidak melebihi 10 detik | AC1.3 | Sama dengan TC-009; koneksi jaringan normal | 1. Kirim request yang sama seperti TC-009. 2. Catat waktu mulai dan waktu respons diterima. | Durasi end-to-end dari pengiriman request hingga body respons diterima tidak melebihi 10.000 ms. | Positif | P0 |
| TC-011 | Overall Score adalah rata-rata dimensi yang tersedia | AC1.3 | Seed data menghasilkan semua 5 dimensi tidak null | 1. Kirim `POST /api/analyze` dan catat nilai `dimensions[*].score` serta `overall`. 2. Hitung manual: `Math.round(sum(scores) / count)`. | Nilai `overall` sama dengan hasil kalkulasi manual rata-rata seluruh skor dimensi yang tidak null. | Positif | P0 |
| TC-012 | Grade konsisten dengan nilai Overall Score | AC1.3 | - | 1. Jalankan analisis dan catat `overall` serta `grade`. | Jika `overall` >= 75 maka `grade` = "Sangat Potensial". Jika >= 60 maka "Potensi Bagus". Jika >= 45 maka "Cukup Potensial". Jika < 45 maka "Kurang Ideal". | Positif | P0 |
| TC-013 | Rekomendasi mengandung konteks skala Kecil | AC1.3 | User login; seed data tersedia | 1. Kirim request dengan `"scale":"Kecil"`. 2. Baca nilai `recommendation` dalam respons. | String `recommendation` mengandung teks "modal < Rp 100jt" (dari konstanta `SCALE_CTX.Kecil` di `lib/analysis.js`). | Positif | P1 |
| TC-014 | Rekomendasi mengandung konteks skala Besar | AC1.3 | User login; seed data tersedia | 1. Kirim request dengan `"scale":"Besar"`. | String `recommendation` mengandung teks "modal > Rp 300jt" (dari konstanta `SCALE_CTX.Besar` di `lib/analysis.js`). | Positif | P1 |

### AC1.4 — Warna Progress Bar Berdasarkan Skor

| ID | Judul | AC | Prakondisi | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---|:-----------|:------------|:----------------------|:-----|:---------|
| TC-015 | Progress bar hijau untuk skor >= 70 | AC1.4 | Analisis berhasil dijalankan; minimal satu dimensi memiliki skor >= 70 | 1. Amati kartu "5 Dimensi Analisis" di ResultPanel untuk dimensi dengan skor >= 70. | Progress bar dimensi tersebut berwarna `#10B981` (hijau). Nilai skor ditampilkan dengan warna yang sama. | Positif | P1 |
| TC-016 | Progress bar kuning untuk skor 50–69 | AC1.4 | Minimal satu dimensi memiliki skor antara 50 dan 69 | 1. Amati kartu dimensi tersebut. | Progress bar berwarna `#F59E0B` (kuning/amber). | Positif | P1 |
| TC-017 | Progress bar merah untuk skor < 50 | AC1.4 | Minimal satu dimensi memiliki skor < 50 | 1. Amati kartu dimensi tersebut. | Progress bar berwarna `#EF4444` (merah). | Positif | P1 |
| TC-018 | Nilai batas persis skor = 70 menggunakan warna hijau | AC1.4 | Hasil analisis dengan skor dimensi tepat 70 | 1. Gunakan lokasi/data seed yang menghasilkan skor dimensi tepat 70. 2. Amati warna progress bar. | Warna hijau `#10B981` ditampilkan (bukan kuning). Fungsi `scoreColor(70)` di `ResultPanel.jsx` mengembalikan `#10B981` karena kondisi `s >= 70` terpenuhi. | Edge Case | P1 |
| TC-019 | Nilai batas persis skor = 50 menggunakan warna kuning | AC1.4 | Hasil analisis dengan skor dimensi tepat 50 | 1. Gunakan data seed yang menghasilkan skor dimensi tepat 50. 2. Amati warna progress bar. | Warna kuning `#F59E0B` ditampilkan (bukan merah). Fungsi `scoreColor(50)` mengembalikan `#F59E0B` karena kondisi `s >= 50` terpenuhi. | Edge Case | P1 |

### AC1.5 — Perubahan Pin Memperbarui Hasil; Request Lama Di-Abort

| ID | Judul | AC | Prakondisi | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---|:-----------|:------------|:----------------------|:-----|:---------|
| TC-020 | Memindahkan pin ke lokasi baru memperbarui hasil analisis | AC1.5 | Analisis lokasi A sudah selesai | 1. Catat skor Overall untuk lokasi A. 2. Klik lokasi B (koordinat berbeda). 3. Klik tombol "Analisis". 4. Tunggu hasil. | Hasil analisis yang ditampilkan adalah untuk lokasi B. Skor Overall merefleksikan data lokasi B, bukan lokasi A. | Positif | P0 |
| TC-021 | AbortController membatalkan request yang masih berjalan | AC1.5 | Aplikasi dalam kondisi analisis berjalan untuk lokasi A | 1. Klik tombol "Analisis" untuk lokasi A. 2. Segera (sebelum respons tiba) klik lokasi B di peta dan klik "Analisis" lagi. | Hanya satu hasil analisis yang muncul di UI, yaitu untuk lokasi B. Tidak terjadi race condition yang menampilkan data lokasi A secara terlambat. | Positif | P0 |
| TC-022 | Perubahan kategori membatalkan analisis lama | AC1.5 | Analisis sedang berjalan | 1. Pilih kategori A dan jalankan analisis. 2. Sebelum respons tiba, ubah kategori ke B. 3. Klik "Analisis" lagi. | Hasil yang ditampilkan adalah untuk kategori B. | Positif | P1 |

### AC1.6 — Tombol Analisis Disabled Saat Input Belum Lengkap

| ID | Judul | AC | Prakondisi | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---|:-----------|:------------|:----------------------|:-----|:---------|
| TC-023 | Tombol "Analisis" disabled saat kategori belum dipilih | AC1.6 | Aplikasi baru dibuka; lokasi sudah dipilih di peta | 1. Klik satu titik di peta tanpa memilih kategori. 2. Amati tombol "Analisis". | Tombol "Analisis" tidak dapat diklik (disabled). Prop `canAnalyze` di `App.jsx` bernilai `false` karena `!selectedCategory`. | Negatif | P0 |
| TC-024 | Tombol "Analisis" disabled saat lokasi belum dipilih | AC1.6 | Kategori sudah dipilih; peta belum diklik | 1. Pilih kategori "Ayam Goreng". 2. Amati tombol "Analisis". | Tombol "Analisis" tidak dapat diklik. Prop `canAnalyze` bernilai `false` karena `!selectedLocation`. | Negatif | P0 |
| TC-025 | Tombol "Analisis" aktif setelah kedua input tersedia | AC1.6 | Aplikasi baru dibuka | 1. Pilih kategori "Minuman". 2. Klik satu titik di peta di dalam Jakarta. | Tombol "Analisis" menjadi enabled dan dapat diklik. | Positif | P0 |

### AC1.7 — Error Handling Saat API Gagal

| ID | Judul | AC | Prakondisi | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---|:-----------|:------------|:----------------------|:-----|:---------|
| TC-026 | Respons 5xx dari API memicu state error di UI | AC1.7 | Kategori dan lokasi sudah dipilih | 1. Matikan server database atau paksa API mengembalikan error 500. 2. Klik "Analisis". | State `analysisError` di `App.jsx` menjadi `true`. UI menampilkan pesan error. Tombol "Coba Lagi" atau mekanisme retry tersedia. Tidak ada data parsial yang ditampilkan. | Negatif | P0 |
| TC-027 | Timeout jaringan memicu state error | AC1.7 | Kategori dan lokasi sudah dipilih | 1. Blokir request ke `/api/analyze` menggunakan DevTools atau proxy. 2. Klik "Analisis". | Setelah timeout, state `analysisError` menjadi `true`. UI menampilkan indikasi error, bukan loading yang terus berjalan. | Negatif | P0 |
| TC-028 | Klik "Coba Lagi" menjalankan ulang analisis | AC1.7 | State error sudah aktif (TC-026 atau TC-027) | 1. Pastikan server kembali normal. 2. Klik tombol retry/coba lagi di UI. | `runAnalysis` dipanggil kembali dengan parameter yang sama. State error direset. Analisis berjalan normal. | Positif | P1 |

### AC1.8 — Banner Informatif untuk Lokasi Luar Coverage

| ID | Judul | AC | Prakondisi | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---|:-----------|:------------|:----------------------|:-----|:---------|
| TC-029 | API mengembalikan `unsupported:true` untuk koordinat Bogor | AC1.8 | User login; seed `area_demographics` tidak mencakup Bogor | 1. Kirim `POST /api/analyze` dengan `{"lat":-6.5971,"lng":106.8060,"category":"Burger","radius":500,"scale":"Menengah"}`. | HTTP 200. Body: `{ "unsupported": true, "message": "Area ini berada di luar cakupan AtlasAI. Saat ini kami mendukung analisis untuk wilayah DKI Jakarta." }`. | Negatif | P0 |
| TC-030 | UI menampilkan panel "Area Belum Didukung" | AC1.8 | User menempatkan pin di luar DKI Jakarta | 1. Klik lokasi di luar Jakarta (mis. wilayah Bogor). 2. Klik "Analisis". | `ResultPanel` merender kondisi `result.unsupported === true`: tampil judul "Area Belum Didukung", deskripsi dari `result.message`, dan hint "Coba pilih lokasi di dalam wilayah DKI Jakarta." | Negatif | P0 |
| TC-031 | Analisis tidak crash untuk lokasi luar coverage | AC1.8 | User login | 1. Kirim request ke koordinat Bogor. | HTTP 200 diterima (bukan 4xx atau 5xx). Proses server tidak berhenti dengan unhandled exception. | Negatif | P0 |

### AC1.9 — Klik Elemen UI Tidak Memindahkan Pin

| ID | Judul | AC | Prakondisi | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---|:-----------|:------------|:----------------------|:-----|:---------|
| TC-032 | Klik tombol zoom tidak memindahkan pin | AC1.9 | Pin sudah ditempatkan | 1. Catat koordinat pin. 2. Klik tombol zoom "+" dan "-" di sudut peta. | Koordinat pin tidak berubah. Nilai lat/lng di UI sama seperti sebelum klik. | Edge Case | P1 |
| TC-033 | Klik area sidebar tidak memindahkan pin | AC1.9 | Pin sudah ditempatkan | 1. Klik area panel sidebar (bukan peta). | Pin tidak berpindah. | Edge Case | P1 |

---

## US2 — Estimasi Profit Berbasis Data ESB

### AC2.1 — Estimasi Profit Range min-max dengan Disclaimer Dinamis

| ID | Judul | AC | Prakondisi | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---|:-----------|:------------|:----------------------|:-----|:---------|
| TC-034 | API mengembalikan profitMin dan profitMax sebagai angka | AC2.1 | Seed data `profit_benchmarks` tersedia untuk "Kopi & Cafe"; >= 4 kompetitor dengan revenue di sekitar Sudirman | 1. Kirim `POST /api/analyze` untuk Sudirman, kategori "Kopi & Cafe", radius 500 m. | `profitMin` dan `profitMax` dalam respons adalah angka positif (dalam jutaan rupiah). `profitSource` adalah `"competitors"` atau `"benchmark"`. | Positif | P0 |
| TC-035 | Disclaimer dinamis menampilkan N outlet dan R radius yang aktual | AC2.1 | Seed data tersedia | 1. Jalankan analisis dan amati teks di bawah estimasi profit di UI. | Teks disclaimer menampilkan nilai `referenceCount` dan `referenceRadius` yang aktual dari respons API, bukan nilai hardcoded. Contoh: "Referensi 15+ outlet ESB dalam radius 1.0 km". | Positif | P0 |
| TC-036 | Skala Besar menghasilkan profit ~5.5x lebih tinggi dari Kecil | AC2.1 | Seed data tersedia; analisis dijalankan di koordinat yang sama | 1. Kirim request dengan `"scale":"Kecil"`, catat `profitMin`. 2. Kirim request yang sama dengan `"scale":"Besar"`, catat `profitMin`. 3. Hitung rasio Besar/Kecil. | Rasio `profitMin(Besar) / profitMin(Kecil)` ≈ 5.5 (yaitu 2.2 / 0.4 = 5.5). Selisih dapat diterima ± 1% karena pembulatan `Math.round`. | Positif | P0 |
| TC-037 | `profitSource = "competitors"` saat >= 4 kompetitor memiliki revenue | AC2.1 | Seed >= 4 kompetitor dengan `revenue_min_jt` dan `revenue_max_jt` tidak null | 1. Kirim request untuk area dengan seed yang sesuai. | Respons mengandung `"profitSource": "competitors"`. | Positif | P1 |
| TC-038 | `profitSource = "benchmark"` saat tidak ada kompetitor dengan revenue | AC2.1 | Tidak ada kompetitor dengan revenue; benchmark kategori ada | 1. Kirim request untuk area atau kategori yang kompetitornya tidak memiliki data revenue. | Respons mengandung `"profitSource": "benchmark"`. Nilai `profitMin`/`profitMax` berasal dari kolom `min_jt`/`max_jt` di tabel `profit_benchmarks`, dikalikan multiplier skala. | Positif | P1 |

### AC2.2 — Tag Insight Maksimal 6 Item dengan Kode Warna

| ID | Judul | AC | Prakondisi | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---|:-----------|:------------|:----------------------|:-----|:---------|
| TC-039 | API mengembalikan tepat 6 tag | AC2.2 | Analisis berhasil | 1. Jalankan `POST /api/analyze`. 2. Hitung panjang array `tags`. | `tags.length === 6`. Sesuai dengan 6 entri yang dikonstruksi di `lib/analysis.js` baris 60–69. | Positif | P0 |
| TC-040 | Setiap tag memiliki properti `label` dan `type` | AC2.2 | Respons analisis tersedia | 1. Iterasi seluruh item di array `tags`. | Setiap item adalah objek dengan `label` bertipe string tidak kosong dan `type` bertipe string tidak kosong. | Positif | P0 |
| TC-041 | Nilai `type` tag adalah salah satu nilai valid | AC2.2 | Respons analisis tersedia | 1. Periksa nilai `type` setiap tag. | Setiap `type` adalah salah satu dari: `"positive"`, `"neutral"`, `"warning"`, `"info"`, `"negative"`. | Positif | P1 |
| TC-042 | Warna UI tag sesuai dengan tipe yang ditentukan di PRD | AC2.2 | Analisis berhasil; UI menampilkan ResultPanel | 1. Amati rendering tag di layar. | Tag dengan `type:"positive"` berwarna `#059669` (hijau). Tag `"warning"` berwarna `#D97706` (kuning). Tag `"info"` berwarna `#06B6D4` (biru). Sesuai konstanta `TAG_COLORS` di `ResultPanel.jsx`. | Positif | P1 |
| TC-043 | Tag traffic null memiliki `type:"info"` (bukan `"warning"`) | AC2.2 | Overpass API tidak dapat dijangkau sehingga `footTraffic=null` | 1. Blokir akses ke `overpass-api.de`. 2. Jalankan analisis. 3. Periksa `tags[0].type`. | `tags[0].type === "info"`. Sesuai perbaikan BUG-009 di `lib/analysis.js` baris 62 yang menggunakan `traffic === null ? 'info' : ...`. | Edge Case | P1 |

### AC2.3 — Warning Data Terbatas (< 5 Outlet)

| ID | Judul | AC | Prakondisi | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---|:-----------|:------------|:----------------------|:-----|:---------|
| TC-044 | Warning data terbatas muncul saat `revenueDataCount` antara 1 dan 4 | AC2.3 | Seed dengan 1–4 kompetitor yang memiliki revenue di radius yang digunakan | 1. Jalankan analisis di area dengan seed tersebut. 2. Periksa `lowReferenceData` di respons API. 3. Amati UI. | Respons API: `lowReferenceData === true`. UI menampilkan banner peringatan: "Data terbatas (< 5 outlet referensi). Estimasi bersifat indikatif." Angka profit ditampilkan dengan styling muted (warna `#94A3B8`). Sesuai logika `ResultPanel.jsx` baris 105–109 dan `s.profitRangeMuted`. | Negatif | P1 |
| TC-045 | Tidak ada warning saat `revenueDataCount` >= 5 | AC2.3 | Seed >= 5 kompetitor dengan revenue | 1. Jalankan analisis. 2. Amati UI. | Respons API: `lowReferenceData === false`. Banner peringatan tidak muncul. Angka profit ditampilkan dengan styling normal. | Positif | P1 |

### AC2.4 — Estimasi Diganti Pesan Jika Tidak Ada Data

| ID | Judul | AC | Prakondisi | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---|:-----------|:------------|:----------------------|:-----|:---------|
| TC-046 | API mengembalikan `profitSource:"none"` saat tidak ada data sama sekali | AC2.4 | Tidak ada kompetitor dengan revenue DAN tidak ada benchmark untuk kategori yang diuji | 1. Kirim `POST /api/analyze` dengan kategori yang tidak memiliki benchmark dan tidak ada kompetitor dengan revenue. | Respons mengandung `"profitSource": "none"`, `profitMin: null`, `profitMax: null`. | Negatif | P1 |
| TC-047 | UI menampilkan pesan pengganti saat tidak ada data profit | AC2.4 | Kondisi sama dengan TC-046 | 1. Amati blok profit di UI. | Teks "Estimasi profit belum tersedia untuk area ini." ditampilkan. Range angka profit tidak ditampilkan. | Negatif | P1 |

### AC2.5 — Flag Volatilitas Tinggi (SD > 60% Mean)

| ID | Judul | AC | Prakondisi | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---|:-----------|:------------|:----------------------|:-----|:---------|
| TC-048 | `highVariance:true` dan banner muncul saat spread revenue sangat lebar | AC2.5 | Seed kompetitor dengan revenue sangat bervariasi, contoh: 5, 8, 90, 180 jt (SD >> 60% mean) | 1. Jalankan analisis di area tersebut. 2. Periksa `highVariance` di respons API. 3. Amati UI. | Respons API: `highVariance === true`. UI menampilkan banner: "Volatilitas data tinggi — estimasi memiliki tingkat ketidakpastian lebih besar." Sesuai `ResultPanel.jsx` baris 112–115. | Edge Case | P2 |
| TC-049 | `highVariance:false` dan banner tidak muncul saat data seragam | AC2.5 | Seed kompetitor dengan revenue yang konsisten, contoh: 20, 22, 23, 25 jt | 1. Jalankan analisis. | Respons API: `highVariance === false`. Banner volatilitas tidak muncul. | Edge Case | P2 |

---

## US3 — Export Laporan PDF

### AC3.1 — Tombol Export Aktif Hanya Setelah Analisis Berhasil

| ID | Judul | AC | Prakondisi | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---|:-----------|:------------|:----------------------|:-----|:---------|
| TC-050 | Tombol "Export PDF" tidak dapat diklik sebelum analisis | AC3.1 | Aplikasi baru dibuka; belum ada analisis | 1. Amati tombol "Export PDF" di ResultPanel (atau area yang relevan). | Tombol tidak tampil atau berada dalam state disabled sebelum `analysisResult` tersedia di `App.jsx`. | Positif | P0 |
| TC-051 | Tombol "Export PDF" dapat diklik setelah analisis berhasil | AC3.1 | Analisis sudah berhasil dan ResultPanel menampilkan skor | 1. Amati tombol "Export PDF" di ResultPanel. | Tombol "Export PDF" aktif (enabled) dan dapat diklik. | Positif | P0 |
| TC-052 | Tombol "Export PDF" tidak aktif untuk hasil `unsupported` | AC3.1 | Analisis menghasilkan `unsupported:true` | 1. Klik lokasi luar Jakarta dan jalankan analisis. 2. Amati ketersediaan tombol Export. | Tombol Export tidak tampil atau tetap disabled karena `ResultPanel` merender view "Area Belum Didukung" yang tidak memiliki tombol Export. | Edge Case | P1 |

### AC3.2 — Konten PDF Memuat Semua Elemen yang Disyaratkan

| ID | Judul | AC | Prakondisi | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---|:-----------|:------------|:----------------------|:-----|:---------|
| TC-053 | PDF memuat nama kategori bisnis | AC3.2 | Analisis berhasil untuk kategori "Ayam Goreng" | 1. Klik "Export PDF". 2. Klik "Unduh PDF". 3. Buka file PDF yang terunduh. | Teks "Ayam Goreng" tampil di bagian header/lokasi laporan PDF (dari `locStrip` di `PDFPreviewModal.jsx`). | Positif | P1 |
| TC-054 | PDF memuat koordinat lokasi | AC3.2 | Analisis berhasil di koordinat -6.2088, 106.8228 | 1. Generate dan buka PDF. | Koordinat lat/lng terbaca di PDF (ditampilkan hingga 5 desimal sesuai `location.lat?.toFixed(5)`). | Positif | P1 |
| TC-055 | PDF memuat tanggal analisis | AC3.2 | Analisis berhasil | 1. Generate dan buka PDF. | Tanggal dalam format Indonesia (contoh: "14 Juni 2026") tampil di area header PDF. | Positif | P1 |
| TC-056 | PDF memuat 5 dimensi skor dan Overall Score | AC3.2 | Analisis berhasil | 1. Generate dan buka PDF. | Label kelima dimensi, nilai skor masing-masing, nilai Overall Score, dan grade tampil di bagian "5 Dimensi Analisis" PDF. | Positif | P1 |
| TC-057 | PDF memuat estimasi profit dan tag insight | AC3.2 | Analisis berhasil dengan data profit tersedia | 1. Generate dan buka PDF. | Range "Rp X jt – Rp Y jt" dan minimal satu tag insight tampil di bagian metrics PDF. | Positif | P1 |
| TC-058 | PDF memuat teks rekomendasi AI | AC3.2 | Analisis berhasil | 1. Generate dan buka PDF. | Paragraf rekomendasi AI tidak kosong di bagian "REKOMENDASI AI" PDF. | Positif | P1 |
| TC-059 | PDF memuat disclaimer ESB AtlasAI | AC3.2 | Analisis berhasil | 1. Generate dan buka PDF. | Teks disclaimer yang diawali "Disclaimer: Laporan ini dihasilkan secara otomatis oleh ESB AtlasAI..." tampil di footer PDF. | Positif | P1 |

### AC3.3 — Format Nama File PDF

| ID | Judul | AC | Prakondisi | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---|:-----------|:------------|:----------------------|:-----|:---------|
| TC-060 | Nama file mengikuti format yang ditentukan | AC3.3 | Analisis berhasil untuk "Ayam Goreng" di koordinat -6.2088, 106.8456 | 1. Klik "Unduh PDF". 2. Periksa nama file yang tersimpan di folder download. | Nama file mengikuti pola `ESB_AtlasAI_AyamGoreng_YYYYMMDD_-6.2088_106.8456.pdf`. Bagian YYYYMMDD adalah 8 digit tanggal hari ini. | Positif | P1 |
| TC-061 | Spasi dalam nama kategori dihapus di nama file | AC3.3 | Analisis berhasil untuk "Kopi & Cafe" | 1. Klik "Unduh PDF". 2. Periksa nama file. | Nama file mengandung "Kopi&Cafe" (spasi dihapus oleh `.replace(/\s/g, '')`, simbol `&` tetap ada). Tidak ada spasi di bagian nama kategori dalam nama file. | Positif | P1 |
| TC-062 | Bagian tanggal dalam nama file adalah 8 digit | AC3.3 | Analisis berhasil | 1. Periksa nama file hasil unduhan. | Segmen tanggal di nama file adalah 8 digit berturutan (format YYYYMMDD), dihasilkan oleh `new Date().toISOString().slice(0,10).replace(/-/g,'')`. | Positif | P1 |

### AC3.4 — Pesan Error Jika Generasi PDF Gagal

| ID | Judul | AC | Prakondisi | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---|:-----------|:------------|:----------------------|:-----|:---------|
| TC-063 | Error html2canvas menampilkan pesan error di modal | AC3.4 | Modal PDF terbuka; `html2canvas` gagal (contoh: diblokir CSP atau elemen tidak ditemukan) | 1. Paksa `html2canvas` gagal (mis. hapus `previewRef` secara sementara melalui DevTools). 2. Klik "Unduh PDF". | State `downloadError` menjadi `true`. Teks "Gagal mengunduh laporan. Silakan coba lagi." tampil di area chrome modal PDF (elemen `s.dlError`). Tombol "Unduh PDF" kembali aktif setelah proses selesai. | Negatif | P1 |
| TC-064 | Tidak ada file PDF parsial yang tersimpan saat terjadi error | AC3.4 | Sama dengan TC-063 | 1. Amati folder download setelah error. | Tidak ada file `.pdf` baru yang muncul di folder download. | Negatif | P1 |

### AC3.5 — Debounce Tombol Export

| ID | Judul | AC | Prakondisi | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---|:-----------|:------------|:----------------------|:-----|:---------|
| TC-065 | Klik ganda diabaikan selama proses generasi PDF | AC3.5 | Modal PDF terbuka | 1. Klik tombol "Unduh PDF" dua kali dengan cepat (kurang dari 500 ms). | Hanya satu proses `html2canvas` yang berjalan. Setelah klik pertama, tombol langsung menampilkan state loading ("Generating...") dan atribut `disabled` ditetapkan, sehingga klik kedua tidak berefek. | Edge Case | P1 |
| TC-066 | Tombol kembali normal setelah PDF selesai diunduh | AC3.5 | Proses unduh berhasil | 1. Klik "Unduh PDF". 2. Tunggu file PDF selesai tersimpan. | Tombol kembali menampilkan teks "Unduh PDF" (bukan "Generating...") dan tidak lagi disabled. State `downloading` kembali ke `false` melalui blok `finally`. | Positif | P1 |

---

## AUTH — Autentikasi (Register & Login)

### Registrasi — POST /api/auth/register

| ID | Judul | AC | Prakondisi | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---|:-----------|:------------|:----------------------|:-----|:---------|
| TC-067 | Registrasi berhasil dengan semua field valid | — | Email belum terdaftar di database | 1. Kirim `POST /api/auth/register` dengan `{"name":"Budi","email":"budi@test.com","password":"password123"}`. | HTTP 201. Body: `{ "ok": true, "user": { "id": <uuid>, "name": "Budi", "email": "budi@test.com" } }`. Header `Set-Cookie` mengandung `atlas_token` dengan atribut `HttpOnly; SameSite=Lax; Path=/`. | Positif | P0 |
| TC-068 | Registrasi berhasil tanpa `bisnis_name` | — | Email belum terdaftar | 1. Kirim request tanpa field `bisnis_name`. | HTTP 201. `user.bisnis_name` bernilai `null` di respons. Cookie `atlas_token` ditetapkan. | Positif | P0 |
| TC-069 | Registrasi dengan `bisnis_name` yang tersedia | — | Email belum terdaftar | 1. Kirim request dengan `"bisnis_name":"Warung Kopi Jaya"`. | HTTP 201. `user.bisnis_name` = "Warung Kopi Jaya" di respons. | Positif | P0 |
| TC-070 | Registrasi ditolak untuk email yang sudah terdaftar | — | Email `budi@test.com` sudah ada di database | 1. Kirim request dengan email yang sama persis. | HTTP 409. Body: `{ "error": "Email sudah terdaftar" }`. | Negatif | P0 |
| TC-071 | Registrasi ditolak saat `name` kosong | — | — | 1. Kirim request dengan `"name":""`. | HTTP 400. Body: `{ "error": "Nama, email, dan password wajib diisi" }`. | Negatif | P0 |
| TC-072 | Registrasi ditolak saat `name` hanya berisi spasi | — | — | 1. Kirim request dengan `"name":"   "`. | HTTP 400. Body: `{ "error": "Nama, email, dan password wajib diisi" }`. Perbaikan BUG-006: `!name?.trim()` bernilai `true`. | Negatif | P0 |
| TC-073 | Registrasi ditolak saat `email` kosong | — | — | 1. Kirim request tanpa field `email`. | HTTP 400. Body: `{ "error": "Nama, email, dan password wajib diisi" }`. | Negatif | P0 |
| TC-074 | Registrasi ditolak saat `password` hanya berisi spasi | — | — | 1. Kirim request dengan `"password":"        "` (8 spasi). | HTTP 400. Body: `{ "error": "Nama, email, dan password wajib diisi" }`. Perbaikan BUG-006: `!password?.trim()` bernilai `true` karena string hanya spasi. | Negatif | P0 |
| TC-075 | Registrasi ditolak untuk password sepanjang 7 karakter | — | — | 1. Kirim request dengan `"password":"abc1234"` (7 karakter). | HTTP 400. Body: `{ "error": "Password minimal 8 karakter" }`. | Negatif | P0 |
| TC-076 | Registrasi berhasil untuk password tepat 8 karakter | — | — | 1. Kirim request dengan `"password":"abc12345"` (8 karakter). | HTTP 201. Registrasi berhasil. | Edge Case | P0 |
| TC-077 | Registrasi ditolak untuk format email tidak valid (tanpa domain) | — | — | 1. Kirim request dengan `"email":"user@"`. | HTTP 400. Body: `{ "error": "Format email tidak valid" }`. Perbaikan BUG-007: regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` menolak `"user@"`. | Negatif | P0 |
| TC-078 | Registrasi ditolak untuk email hanya berisi `"@"` | — | — | 1. Kirim request dengan `"email":"@"`. | HTTP 400. Body: `{ "error": "Format email tidak valid" }`. | Negatif | P0 |
| TC-079 | Email dinormalisasi ke lowercase saat disimpan | — | — | 1. Kirim request dengan `"email":"Budi@Test.COM"`. 2. Coba login dengan `"email":"budi@test.com"`. | Registrasi berhasil. Login berhasil. Email disimpan sebagai `"budi@test.com"`. | Edge Case | P1 |
| TC-080 | Race condition email duplikat menghasilkan HTTP 409, bukan 500 | — | — | 1. Kirim dua request registrasi konkuren dengan email yang sama dalam waktu bersamaan. | Salah satu request mendapat HTTP 201. Yang lain mendapat HTTP 409 dengan body `{ "error": "Email sudah terdaftar" }`. Tidak ada HTTP 500. Perbaikan BUG-008: menangkap `dbErr.code === '23505'`. | Edge Case | P1 |
| TC-081 | Respons registrasi tidak mengekspos `password_hash` | — | — | 1. Periksa seluruh body respons HTTP 201. | Tidak ada field `password_hash`, `password`, atau turunannya dalam respons JSON. | Negatif | P0 |

### Login — POST /api/auth/login

| ID | Judul | AC | Prakondisi | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---|:-----------|:------------|:----------------------|:-----|:---------|
| TC-082 | Login berhasil dengan kredensial valid | — | User `budi@test.com` sudah terdaftar | 1. Kirim `POST /api/auth/login` dengan `{"email":"budi@test.com","password":"password123"}`. | HTTP 200. Body: `{ "ok": true, "user": { ... } }`. Header `Set-Cookie` mengandung `atlas_token` JWT yang valid dan tidak kedaluwarsa. | Positif | P0 |
| TC-083 | JWT yang diterbitkan dapat diverifikasi dengan `JWT_SECRET` | — | Login berhasil | 1. Ambil nilai cookie `atlas_token` dari respons. 2. Decode dan verifikasi signature dengan `JWT_SECRET` menggunakan HS256. | Signature valid. Payload mengandung `userId`, `email`, `name`. Klaim `exp` sekitar 7 hari dari waktu login. | Positif | P0 |
| TC-084 | Login dengan email dalam huruf kapital berhasil | — | User sudah terdaftar dengan email lowercase | 1. Kirim login dengan `"email":"BUDI@TEST.COM"`. | HTTP 200. Login berhasil. Email di-normalize dengan `.toLowerCase().trim()` sebelum query. | Edge Case | P1 |
| TC-085 | Login ditolak untuk password yang salah | — | User terdaftar | 1. Kirim login dengan password yang salah. | HTTP 401. Body: `{ "error": "Email atau password salah" }`. | Negatif | P0 |
| TC-086 | Login ditolak untuk email yang tidak terdaftar | — | Email tidak ada di database | 1. Kirim login dengan email tidak terdaftar. | HTTP 401. Body: `{ "error": "Email atau password salah" }`. Pesan error identik dengan TC-085 (mencegah user enumeration). | Negatif | P0 |
| TC-087 | Login ditolak saat field `email` kosong | — | — | 1. Kirim `{"email":"","password":"password123"}`. | HTTP 400. Body: `{ "error": "Email dan password wajib diisi" }`. Guard `!email?.trim()` terpenuhi. | Negatif | P0 |
| TC-088 | Login ditolak saat field `password` tidak ada | — | — | 1. Kirim `{"email":"budi@test.com"}` tanpa `password`. | HTTP 400. Body: `{ "error": "Email dan password wajib diisi" }`. Guard `!password` terpenuhi. | Negatif | P0 |
| TC-089 | Respons login tidak mengekspos `password_hash` | — | Login berhasil | 1. Periksa body respons HTTP 200. | Field `password_hash` tidak ada dalam respons. Sesuai `select: { password_hash: true }` hanya digunakan untuk verifikasi internal, tidak dikembalikan ke client. | Negatif | P0 |

---

## HIST — Riwayat & Simpan Analisis

### GET /api/analysis/history

| ID | Judul | AC | Prakondisi | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---|:-----------|:------------|:----------------------|:-----|:---------|
| TC-090 | Riwayat dikembalikan hanya untuk user yang login | — | User A dan User B masing-masing memiliki analisis tersimpan | 1. Login sebagai User A. 2. Kirim `GET /api/analysis/history`. | Respons mengandung hanya item milik User A. Tidak ada item milik User B. | Positif | P0 |
| TC-091 | Riwayat dikembalikan dalam urutan terbaru terlebih dahulu | — | User A memiliki beberapa analisis tersimpan | 1. Simpan analisis A1 lalu A2. 2. Kirim `GET /api/analysis/history`. | Item pertama di `items[]` adalah A2 (lebih baru). Item A1 ada setelahnya. Sesuai `order: { created_at: 'DESC' }`. | Positif | P1 |
| TC-092 | Riwayat dibatasi maksimum 100 item | — | User memiliki 101 analisis tersimpan di database | 1. Kirim `GET /api/analysis/history`. | `items.length === 100`. Tidak lebih dari 100 item dikembalikan. Sesuai `take: 100`. | Edge Case | P1 |
| TC-093 | User tanpa analisis tersimpan mendapat array kosong | — | User baru yang belum pernah menyimpan analisis | 1. Login sebagai user baru. 2. Kirim `GET /api/analysis/history`. | HTTP 200. Body: `{ "items": [] }`. | Edge Case | P1 |
| TC-094 | Tanpa cookie mengembalikan HTTP 401 | — | — | 1. Kirim `GET /api/analysis/history` tanpa cookie `atlas_token`. | HTTP 401. Body: `{ "items": [] }`. | Negatif | P0 |
| TC-095 | Token kedaluwarsa mengembalikan HTTP 401 | — | — | 1. Kirim request dengan cookie berisi token yang sudah kedaluwarsa. | HTTP 401. Body: `{ "items": [] }`. `verifyToken` melempar exception; blok `catch` mengembalikan 401. | Negatif | P0 |

### POST /api/analysis/save

| ID | Judul | AC | Prakondisi | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---|:-----------|:------------|:----------------------|:-----|:---------|
| TC-096 | Simpan analisis berhasil mengembalikan ID dan timestamp | — | User login; analisis tersedia | 1. Kirim `POST /api/analysis/save` dengan body lengkap `{location, category, lat, lng, radius, result}`. | HTTP 200. Body: `{ "id": "<uuid>", "created_at": "<iso-timestamp>" }`. Entry tersimpan di tabel `saved_analyses`. | Positif | P0 |
| TC-097 | Simpan ditolak tanpa cookie | — | — | 1. Kirim request tanpa cookie `atlas_token`. | HTTP 401. Body: `{ "error": "Unauthorized" }`. | Negatif | P0 |
| TC-098 | Simpan ditolak saat field `location` tidak ada | — | User login | 1. Kirim request tanpa field `location`. | HTTP 400. Body: `{ "error": "Missing fields" }`. | Negatif | P1 |
| TC-099 | Simpan ditolak saat field `result` tidak ada | — | User login | 1. Kirim request tanpa field `result`. | HTTP 400. Body: `{ "error": "Missing fields" }`. | Negatif | P1 |
| TC-100 | Entry yang disimpan muncul di riwayat user yang sama | — | User login | 1. Simpan analisis. 2. Kirim `GET /api/analysis/history`. | Item yang baru disimpan muncul sebagai item pertama dalam daftar riwayat. | Positif | P1 |
| TC-101 | Entry yang disimpan tidak muncul di riwayat user lain | — | User A menyimpan analisis; User B login terpisah | 1. User A simpan analisis. 2. Login sebagai User B. 3. Kirim `GET /api/analysis/history`. | Item User A tidak muncul dalam riwayat User B. | Positif | P0 |

### DELETE /api/analysis/save

| ID | Judul | AC | Prakondisi | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---|:-----------|:------------|:----------------------|:-----|:---------|
| TC-102 | Hapus analisis milik sendiri berhasil | — | User A memiliki analisis tersimpan dengan ID diketahui | 1. Login sebagai User A. 2. Kirim `DELETE /api/analysis/save` dengan `{"id":"<id-user-a>"}`. 3. Kirim `GET /api/analysis/history`. | HTTP 200. Body: `{ "ok": true }`. Item tidak lagi muncul di riwayat. | Positif | P0 |
| TC-103 | Hapus ditolak tanpa cookie | — | — | 1. Kirim DELETE tanpa cookie. | HTTP 401. Body: `{ "error": "Unauthorized" }`. | Negatif | P0 |
| TC-104 | Hapus tanpa field `id` ditolak | — | User login | 1. Kirim DELETE dengan body `{}`. | HTTP 400. Body: `{ "error": "Missing id" }`. | Negatif | P1 |
| TC-105 | User B tidak dapat menghapus item milik User A (IDOR) | — | User A memiliki analisis tersimpan dengan `id` diketahui; User B login terpisah | 1. Login sebagai User B. 2. Kirim DELETE dengan `{"id":"<id-milik-user-a>"}`. 3. Login kembali sebagai User A. 4. Kirim `GET /api/analysis/history`. | DELETE menghasilkan HTTP 200 `{ ok: true }` secara senyap (TypeORM `delete` di mana `user_id` tidak cocok menghasilkan no-op). Item milik User A TETAP ADA di riwayatnya karena filter `{ id, user_id: payload.userId }` di `save/route.js` baris 52. | Negatif | P0 |

---

## SEC — Keamanan

### Keamanan JWT

| ID | Judul | Kerentanan | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:-----------|:------------|:----------------------|:-----|:---------|
| TC-106 | Token dengan algoritma `alg:none` ditolak | JWT Algorithm Confusion | 1. Buat JWT dengan header `{"alg":"none","typ":"JWT"}` dan payload user valid tanpa signature. 2. Set sebagai cookie `atlas_token`. 3. Kirim `GET /api/analysis/history`. | HTTP 401. `jwtVerify` dari library `jose` menolak token `alg:none` secara default. | Negatif | P0 |
| TC-107 | Token dengan signature yang dimodifikasi ditolak | JWT Tampering | 1. Ambil token valid. 2. Ubah 1 karakter di bagian signature. 3. Set sebagai cookie dan kirim request ke endpoint terproteksi. | HTTP 401. `verifyToken` melempar exception; server mengembalikan 401. | Negatif | P0 |
| TC-108 | Token kedaluwarsa ditolak | Expired Token | 1. Buat JWT dengan klaim `exp` di masa lalu (misal 8 hari lalu). 2. Kirim ke endpoint terproteksi. | HTTP 401 dari semua endpoint terproteksi: `/api/analyze`, `/api/analysis/history`, `/api/analysis/save`, `/api/analysis/save` (DELETE). | Negatif | P0 |
| TC-109 | Tidak ada cookie ditolak oleh semua endpoint terproteksi | Missing Cookie | 1. Kirim request ke masing-masing endpoint tanpa cookie `atlas_token`. | Setiap endpoint mengembalikan HTTP 401. `/api/analyze` mengembalikan `{ "error": "Unauthorized" }`. `/api/analysis/history` mengembalikan `{ "items": [] }` dengan status 401. | Negatif | P0 |

### IDOR (Insecure Direct Object Reference)

| ID | Judul | Kerentanan | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:-----------|:------------|:----------------------|:-----|:---------|
| TC-110 | User B tidak dapat melihat item riwayat milik User A via history endpoint | IDOR | 1. User A simpan beberapa analisis. 2. User B login dan kirim `GET /api/analysis/history`. | Respons User B hanya mengandung item milik User B. Item milik User A tidak muncul. TypeORM `where: { user_id: payload.userId }` memastikan isolasi. | Negatif | P0 |
| TC-111 | User B tidak dapat menghapus item User A (sudah dicakup TC-105) | IDOR | Lihat TC-105. | Item User A tetap ada setelah DELETE oleh User B. | Negatif | P0 |

### SQL Injection

| ID | Judul | Kerentanan | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:-----------|:------------|:----------------------|:-----|:---------|
| TC-112 | SQL injection pada field `category` di analyze | SQL Injection | 1. Kirim `POST /api/analyze` dengan `"category":"'; DROP TABLE competitors; --"`. | HTTP 400. Body: `{ "error": "Kategori tidak valid" }`. Validasi `VALID_CATEGORIES.includes(category)` mencegah nilai arbitrer sampai ke query SQL. | Negatif | P0 |
| TC-113 | SQL injection pada field `email` di login | SQL Injection | 1. Kirim `POST /api/auth/login` dengan `"email":"' OR 1=1; --"`. | HTTP 401. Body: `{ "error": "Email atau password salah" }`. TypeORM menggunakan parameterized query; tidak ada bypass autentikasi. | Negatif | P0 |
| TC-114 | SQL injection pada field `email` di register | SQL Injection | 1. Kirim `POST /api/auth/register` dengan `"email":"test'; DROP TABLE users; --@mail.com"`. | HTTP 400 (format email tidak valid karena mengandung karakter `'`) ATAU HTTP 409/201 tanpa efek sampingan di database. Tabel `users` tetap ada. | Negatif | P0 |

### Validasi Input dan Batasan Radius

| ID | Judul | Kerentanan | Langkah Uji | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:-----------|:------------|:----------------------|:-----|:---------|
| TC-115 | Radius di bawah minimum (199 m) ditolak | Validasi Input | 1. Kirim `POST /api/analyze` dengan `"radius":199`. | HTTP 400. Body: `{ "error": "Radius harus antara 200 dan 1500 meter" }`. Perbaikan BUG-011. | Negatif | P0 |
| TC-116 | Radius di atas maksimum (1501 m) ditolak | Validasi Input / Resource Amplification | 1. Kirim `POST /api/analyze` dengan `"radius":1501`. | HTTP 400. Body: `{ "error": "Radius harus antara 200 dan 1500 meter" }`. Perbaikan BUG-011 mencegah vektor DoS. | Negatif | P0 |
| TC-117 | Radius sangat besar (999999 m) ditolak | Resource Amplification DoS | 1. Kirim `POST /api/analyze` dengan `"radius":999999`. | HTTP 400. Body: `{ "error": "Radius harus antara 200 dan 1500 meter" }`. | Negatif | P0 |
| TC-118 | Koordinat di luar range valid ditolak | Validasi Input | 1. Kirim `POST /api/analyze` dengan `"lat":91` (di luar rentang -90 hingga 90). | HTTP 400. Body: `{ "error": "Koordinat tidak valid" }`. | Negatif | P0 |
| TC-119 | `lat` bertipe string ditolak | Validasi Input | 1. Kirim `POST /api/analyze` dengan `"lat":"abc"`. | HTTP 400. Body: `{ "error": "lat dan lng harus berupa angka" }`. | Negatif | P0 |
| TC-120 | Body non-JSON pada /api/analyze ditolak dengan 400 | Validasi Input | 1. Kirim `POST /api/analyze` dengan `Content-Type: text/plain` dan body bukan JSON. | HTTP 400. Body: `{ "error": "Request body tidak valid" }`. Perbaikan BUG-005: `try/catch` di sekitar `request.json()`. | Negatif | P0 |
| TC-121 | Skala tidak valid ditolak | Validasi Input | 1. Kirim `POST /api/analyze` dengan `"scale":"XL"`. | HTTP 400. Body: `{ "error": "Skala tidak valid" }`. | Negatif | P0 |

---

## EDGE — Edge Cases Engine Skoring

### Formula Skoring dan Batas Nilai

| ID | Judul | Skenario | Input | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---------|:------|:----------------------|:-----|:---------|
| TC-122 | Skor traffic minimum saat amenityCount = 0 | Tidak ada amenitas di sekitar | `footTraffic = { score: 20, amenityCount: 0 }` | `traffic = 20`. Rumus: `min(95, max(20, 20 + 0 × 0.95)) = 20`. | Edge Case | P1 |
| TC-123 | Skor traffic terkunci di maksimum 95 | Sangat banyak amenitas | `amenityCount = 200` → `20 + 200 × 0.95 = 210` | `traffic = 95`. Rumus: `min(95, 210) = 95`. Cap terpenuhi. | Edge Case | P1 |
| TC-124 | Skor aksesibilitas minimum saat transportCount = 0 | Tidak ada transportasi | `accessibility = { score: 20, transportCount: 0 }` | `accessibilityScore = 20`. Rumus: `min(95, max(20, 20 + 0 × 3.5)) = 20`. | Edge Case | P1 |
| TC-125 | Skor aksesibilitas terkunci di maksimum 95 | Banyak node transportasi | `transportCount = 22` → `20 + 22 × 3.5 = 97` | `accessibilityScore = 95`. Rumus: `min(95, 97) = 95`. | Edge Case | P1 |
| TC-126 | Skor populasi minimum saat density sangat rendah | Kepadatan 0 jiwa/km² | `population_density = 0` | `populationScore = max(25, round(25 + 0/310)) = 25`. | Edge Case | P1 |
| TC-127 | Skor populasi terkunci di maksimum 90 | Kepadatan sangat tinggi | `population_density = 200000` → `25 + 200000/310 = 670` | `populationScore = min(90, 670) = 90`. | Edge Case | P1 |
| TC-128 | Overall Score dihitung dari dimensi non-null saja | Overpass timeout; traffic dan aksesibilitas null | `traffic=null, competition=60, accessibility=null, population=70, purchasePower=65` | `overall = Math.round((60+70+65)/3) = 65`. Hanya 3 dimensi yang dirata-rata. | Edge Case | P0 |
| TC-129 | Grade "Sangat Potensial" tepat di batas bawah overall = 75 | Batas grade atas | `overall = 75` | `grade = "Sangat Potensial"`. Kondisi `overall >= 75` terpenuhi. | Edge Case | P0 |
| TC-130 | Grade "Potensi Bagus" untuk overall = 74 | Tepat di bawah batas atas | `overall = 74` | `grade = "Potensi Bagus"`. | Edge Case | P0 |
| TC-131 | Grade "Potensi Bagus" tepat di batas bawah overall = 60 | Batas grade kedua | `overall = 60` | `grade = "Potensi Bagus"`. Kondisi `overall >= 60` terpenuhi. | Edge Case | P0 |
| TC-132 | Grade "Cukup Potensial" untuk overall = 59 | Tepat di bawah batas kedua | `overall = 59` | `grade = "Cukup Potensial"`. | Edge Case | P0 |
| TC-133 | Grade "Cukup Potensial" tepat di batas bawah overall = 45 | Batas grade ketiga | `overall = 45` | `grade = "Cukup Potensial"`. Kondisi `overall >= 45` terpenuhi. | Edge Case | P0 |
| TC-134 | Grade "Kurang Ideal" untuk overall = 44 | Tepat di bawah batas ketiga | `overall = 44` | `grade = "Kurang Ideal"`. | Edge Case | P0 |

### Logika IQR vs Min-Max Profit

| ID | Judul | Skenario | Input | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---------|:------|:----------------------|:-----|:---------|
| TC-135 | Profit menggunakan min-max untuk 3 kompetitor dengan revenue | Tepat di bawah batas IQR | 3 kompetitor dengan revenue rata-rata: 10, 20, 30 jt | `profitMin = 10` (min), `profitMax = 30` (max). `profitSource = "competitors"`. IQR tidak digunakan karena `revenues.length < 4`. | Edge Case | P1 |
| TC-136 | Profit menggunakan IQR untuk tepat 4 kompetitor dengan revenue | Tepat di batas IQR | 4 kompetitor dengan revenue rata-rata: 10, 20, 30, 40 jt (sudah diurutkan) | `profitMin = revenues[floor(4*0.25)] = revenues[1] = 20`. `profitMax = revenues[floor(4*0.75)] = revenues[3] = 40`. `profitSource = "competitors"`. | Edge Case | P1 |
| TC-137 | Multiplier skala Kecil diterapkan dengan benar | Skala kecil | `profitData.profitMin = 50` (dari kompetitor/benchmark), `scale = "Kecil"` | `profitMin = round(50 × 0.4) = 20`. `profitMax = round(profitData.profitMax × 0.4)`. | Edge Case | P1 |
| TC-138 | Multiplier skala Besar diterapkan dengan benar | Skala besar | `profitData.profitMin = 50`, `scale = "Besar"` | `profitMin = round(50 × 2.2) = 110`. | Edge Case | P1 |

### Penyesuaian Kompetisi Berdasarkan Skala

| ID | Judul | Skenario | Input | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---------|:------|:----------------------|:-----|:---------|
| TC-139 | Skor kompetisi Kecil lebih rendah 5 poin dari Menengah | Penyesuaian skala kecil | Jalankan analisis yang sama dengan `scale="Kecil"` dan `scale="Menengah"` | `competition(Kecil) = max(15, min(90, rawCompetition - 5))`. Selisih antara kedua hasil = 5, kecuali jika klem di 15 atau 90. | Edge Case | P1 |
| TC-140 | Skor kompetisi Besar lebih tinggi 5 poin dari Menengah | Penyesuaian skala besar | Jalankan analisis yang sama dengan `scale="Besar"` dan `scale="Menengah"` | `competition(Besar) = max(15, min(90, rawCompetition + 5))`. Selisih = 5, kecuali klem. | Edge Case | P1 |
| TC-141 | Skor kompetisi tidak melampaui batas atas 90 setelah penyesuaian skala | Klem atas | Kondisi di mana `rawCompetition = 88` dan `scale = "Besar"` → 88+5 = 93 | `competition = min(90, 93) = 90`. Klem diterapkan. | Edge Case | P1 |
| TC-142 | Skor kompetisi tidak turun di bawah batas bawah 15 setelah penyesuaian skala | Klem bawah | Kondisi di mana `rawCompetition = 18` dan `scale = "Kecil"` → 18-5 = 13 | `competition = max(15, 13) = 15`. Klem diterapkan. | Edge Case | P1 |

### Jakarta Gate dan Degradasi Graceful

| ID | Judul | Skenario | Input | Hasil yang Diharapkan | Tipe | Prioritas |
|:---|:------|:---------|:------|:----------------------|:-----|:---------|
| TC-143 | Koordinat tepat di batas luar area_demographics mengembalikan unsupported | Jakarta gate | Koordinat tepat di luar bounding box semua baris `area_demographics` | HTTP 200. `{ unsupported: true, message: "Area ini berada di luar cakupan AtlasAI..." }`. | Edge Case | P0 |
| TC-144 | Koordinat tepat di batas dalam area_demographics berhasil diproses | Jakarta gate | Koordinat tepat di dalam bounding box salah satu baris `area_demographics` | HTTP 200. Respons mengandung `overall`, `grade`, `dimensions`. Tidak ada `unsupported`. | Edge Case | P0 |
| TC-145 | Overpass timeout tidak menghentikan analisis | Degradasi graceful | Overpass API tidak dapat dijangkau (timeout 14 detik) | HTTP 200. `dimensions[0].score` (traffic) = `null`. `dimensions[0].source` = `"unavailable"`. `overall` tetap dihitung dari 3 dimensi yang tersedia (kompetisi, populasi, daya beli). | Edge Case | P0 |

---

## Matriks Cakupan AC

| AC PRD | TC yang Mencakup | Status |
|:-------|:-----------------|:-------|
| AC1.1 | TC-001, TC-002, TC-003, TC-004 | Tercakup |
| AC1.2 | TC-005, TC-006, TC-007, TC-008 | Tercakup |
| AC1.3 | TC-009, TC-010, TC-011, TC-012, TC-013, TC-014 | Tercakup |
| AC1.4 | TC-015, TC-016, TC-017, TC-018, TC-019 | Tercakup |
| AC1.5 | TC-020, TC-021, TC-022 | Tercakup |
| AC1.6 | TC-023, TC-024, TC-025 | Tercakup |
| AC1.7 | TC-026, TC-027, TC-028 | Tercakup |
| AC1.8 | TC-029, TC-030, TC-031 | Tercakup |
| AC1.9 | TC-032, TC-033 | Tercakup |
| AC2.1 | TC-034, TC-035, TC-036, TC-037, TC-038 | Tercakup |
| AC2.2 | TC-039, TC-040, TC-041, TC-042, TC-043 | Tercakup |
| AC2.3 | TC-044, TC-045 | Tercakup |
| AC2.4 | TC-046, TC-047 | Tercakup |
| AC2.5 | TC-048, TC-049 | Tercakup |
| AC3.1 | TC-050, TC-051, TC-052 | Tercakup |
| AC3.2 | TC-053, TC-054, TC-055, TC-056, TC-057, TC-058, TC-059 | Tercakup |
| AC3.3 | TC-060, TC-061, TC-062 | Tercakup |
| AC3.4 | TC-063, TC-064 | Tercakup |
| AC3.5 | TC-065, TC-066 | Tercakup |

---

## Ringkasan Cakupan

| Kategori | Jumlah TC |
|:---------|:----------|
| Positif (Happy Path) | 44 |
| Negatif (Validasi & Error) | 51 |
| Edge Case | 50 |
| **Total** | **145** |

| Area | Jumlah TC |
|:-----|:----------|
| US1 — Analisis Kelayakan Lokasi | 33 |
| US2 — Estimasi Profit | 16 |
| US3 — Export PDF | 17 |
| Autentikasi (Register & Login) | 23 |
| Riwayat & Simpan | 16 |
| Keamanan | 17 |
| Edge Case Engine Skoring | 23 |
| **Total** | **145** |
