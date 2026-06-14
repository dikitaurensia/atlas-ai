**ESB AtlasAI — Location Intelligence for FnB**

Product Requirements Document

| PRD ID | PRD-ATLASAI-001 |
| :---- | :---- |
| **Tanggal Submission** | 21 Mei 2026 |
| **Planned Release** | 17 Aug 2026 (Soft Launch — Beta) |
| **Status Dokumen** | Draft |
| **Product Owner** | [Diki Taurens Sia](mailto:diki.taurens@esb.co.id) |
| **Engineer Lead** | [Diki Taurens Sia](mailto:diki.taurens@esb.co.id) |
| **Engineer** | [Diki Taurens Sia](mailto:diki.taurens@esb.co.id) |
| **Referensi** | ESB Internal Hackathon 2026 |

# **Revision History**

| Tanggal | Catatan | Diperbarui Oleh |
| :---- | :---- | :---- |
| 23 Mei 2026 | Inisiasi dokumen — ESB Internal Hackathon 2026 | [Diki Taurens Sia](mailto:diki.taurens@esb.co.id) |
|  |  |  |

# **Discovery Status**

| Role | PIC | Status | Catatan |
| :---- | :---- | :---- | :---- |
| Product Owner | [Diki Taurens Sia](mailto:diki.taurens@esb.co.id) | Draft |  |
| Product Designer | TBD | Draft |  |
| Engineer Lead | [Diki Taurens Sia](mailto:diki.taurens@esb.co.id) | Draft | Perlu validasi teknis feasibility |
| Engineer | [Diki Taurens Sia](mailto:diki.taurens@esb.co.id) | Draft |  |
| Quality Assurance | TBD | Draft |  |
| Data Engineer | TBD | Draft | Validasi ketersediaan & pipeline data ESB |
| Legal | TBD | Draft | Review penggunaan data merchant & UU PDP |

# **Background**

## **Konteks Industri: Masalah yang Belum Terpecahkan**

Membuka bisnis atau cabang baru di industri FnB adalah keputusan investasi besar yang berisiko tinggi. Survei industri menunjukkan bahwa lebih dari 60% bisnis  FnB baru tutup dalam 3 tahun pertama[^1]  — dan salah satu penyebab utamanya adalah pemilihan lokasi yang keliru. Lokasi yang terlalu dekat dengan kompetitor kuat, berada di area dengan daya beli rendah, atau minim traffic pengunjung secara langsung menentukan nasib bisnis sebelum menu pertama pun disajikan.

Namun kenyataannya, saat ini mayoritas pengusaha kuliner — baik UMKM maupun franchisor yang hendak membuka cabang — masih membuat keputusan lokasi berdasarkan:

* Intuisi dan observasi manual ("saya lihat areanya ramai")

* Rekomendasi informal dari kenalan atau broker properti

* Survei lapangan yang mahal dan memakan waktu

* Data trafik Google Maps yang tidak spesifik untuk bisnis FnB

Tidak ada satu pun platform SaaS di Indonesia yang saat ini mengintegrasikan data traffic area, pemetaan kompetitor sejenis, demografi penduduk, dan histori performa transaksi bisnis FnB nyata — semuanya dalam satu antarmuka yang mudah digunakan. Gap inilah yang menjadi landasan ESB AtlasAI.

## **Posisi ESB: Aset Data yang Tidak Dimiliki Siapapun**

ESB adalah platform SaaS FnB terbesar di Indonesia dengan lebih dari 30.000 outlet aktif yang tersebar di ratusan kota. Selama bertahun-tahun beroperasi, ESB telah mengakumulasi data transaksi, pola revenue, dan perilaku merchant yang sangat kaya — mencakup berbagai kategori bisnis (ayam goreng, kopi, mie, minuman, dan lain-lain), berbagai tier kota, serta berbagai tipe lokasi (mall, ruko, pinggir jalan, kawasan perumahan).

Data ini adalah aset strategis yang bersifat unik dan defensible — tidak dapat direplikasi oleh kompetitor manapun tanpa memiliki ekosistem merchant yang setara. ESB AtlasAI hadir untuk mengubah aset ini menjadi nilai nyata bagi merchant: bukan sekadar tools operasional, melainkan partner strategis yang hadir sejak keputusan pertama — "di mana saya harus buka?"

## **Mengapa Sekarang?**

Terdapat tiga faktor yang membuat momentum ini tepat untuk ESB:

1. Kompetisi yang meningkat di segmen SaaS FnB mendorong kebutuhan untuk diferensiasi produk yang lebih dalam dari sekadar fitur operasional (kasir, manajemen menu, laporan). Fitur strategic intelligence seperti AtlasAI menciptakan moat yang sulit ditiru.

2. Pertumbuhan merchant baru di segmen FnB pasca-pandemi sangat signifikan, khususnya di segmen UMKM kuliner dan franchise skala kecil-menengah. Segmen ini adalah target ideal AtlasAI karena mereka paling membutuhkan panduan berbasis data namun paling minim akses ke riset pasar profesional.

3. Ketersediaan teknologi AI generatif dan API geospatial yang semakin terjangkau memungkinkan ESB membangun fitur ini dengan biaya pengembangan yang jauh lebih rendah dibanding 3–5 tahun lalu.

# **Opportunity**

ESB AtlasAI adalah fitur berbasis AI yang memungkinkan merchant dan calon merchant FnB menganalisis kelayakan lokasi bisnis baru secara data-driven. User cukup memilih jenis bisnis dan menentukan koordinat lokasi di peta; sistem akan menghasilkan:

* Skor kelayakan lokasi (0–100) berdasarkan 5 dimensi: traffic pejalan kaki, tingkat persaingan, aksesibilitas, kepadatan penduduk, dan daya beli area

* Pemetaan kompetitor sejenis dalam radius yang dipilih

* Estimasi range profit bulanan berdasarkan data historis outlet ESB di area tersebut

* Rekomendasi AI dalam bahasa natural yang menjelaskan potensi dan risiko utama lokasi

Dengan AtlasAI, ESB bertransformasi dari sekadar platform yang membantu merchant menjalankan bisnis menjadi platform yang membantu merchant memulai bisnis dengan benar sejak hari pertama.

# **Business & Strategic Fit**

## **1\. Diferensiasi Produk & Competitive Moat**

AtlasAI menciptakan lapisan nilai yang sulit direplikasi kompetitor karena fondasinya adalah data transaksi internal ESB — bukan data publik yang dapat diakses siapapun. Semakin banyak merchant yang bergabung ke ESB, semakin akurat prediksi AtlasAI, menciptakan network effect yang menguat seiring waktu.

## **2\. Revenue Expansion**

AtlasAI dapat dikemas sebagai fitur premium berbayar  atau di-bundle ke dalam paket ESB, membuka sumber revenue baru tanpa perlu menambah merchant baru. Target konversi: 15% pengguna AtlasAI upgrade ke paket premium dalam 90 hari.

## 

## **3\. Merchant Acquisition & Retention**

Bagi calon merchant, AtlasAI menjadi alasan untuk bergabung ke ESB sebelum bisnis mereka bahkan buka. Bagi merchant existing, fitur ini meningkatkan lock-in karena analisis yang makin akurat seiring penggunaan. Merchant yang berhasil ekspansi dengan bantuan AtlasAI memiliki loyalitas jauh lebih tinggi terhadap platform.

## **4\. OKR Alignment**

Fitur ini mendukung dua OKR utama ESB: (1) pertumbuhan jumlah merchant aktif melalui akuisisi calon merchant baru, dan (2) peningkatan ARPU (Average Revenue per User) melalui upsell fitur premium kepada merchant existing.

# **Success Metrics / Impact Estimation**

| Goals | Metrik | Baseline | Target | Timeframe & Cara Ukur |
| :---- | :---- | :---- | :---- | :---- |
| Feature Adoption | % eligible merchant yang menggunakan AtlasAI minimal 1x | 0% (fitur baru) | 40% | 30 hari post-launch. Diukur via ESB Dashboard Analytics. |
| Engagement | Rata-rata jumlah analisis per user per bulan | 0 (fitur baru) | Min. 3x / user / bulan | 60 hari post-launch. Diukur via event tracking per session. |
| Conversion | % pengguna AtlasAI yang upgrade ke paket premium | 0% (fitur baru) | 15% | 90 hari post-launch. Diukur via CRM & billing report. |
| Reliability | Error rate pada proses analisis lokasi | TBD — ukur 2 minggu pertama | \< 2% failed analysis | Ongoing post-launch. Diukur via API error log monitoring. |
| Satisfaction | CSAT Score fitur AtlasAI | TBD — baseline survey | ≥ 4.2 / 5.0 | 30 hari post-launch. Diukur via in-app feedback form. |

# 

# **Deliverables**

| Dokumen | PIC | Status | Catatan |
| :---- | :---- | :---- | :---- |
| PRD (dokumen ini) | [Diki Taurens Sia](mailto:diki.taurens@esb.co.id) | Draft |  |
| UI Design (Figma) | [Diki Taurens Sia](mailto:diki.taurens@esb.co.id) | Draft |  |
| Technical Document | [Diki Taurens Sia](mailto:diki.taurens@esb.co.id) | Draft | Termasuk arsitektur data pipeline & API integration |
| Data Pipeline Spec | [Diki Taurens Sia](mailto:diki.taurens@esb.co.id) | Draft | Google Places, BPS Open Data, ESB internal data |
| Test Plan | TBD | Draft |  |
| Task Breakdown | [Diki Taurens Sia](mailto:diki.taurens@esb.co.id) | Draft |  |

# **High Level Flow**

## **Kondisi Saat Ini (Current)**

1. Merchant ingin buka cabang baru → survei manual ke lapangan

2. Observasi traffic area dilakukan dengan berdiri di lokasi selama beberapa jam

3. Riset kompetitor dilakukan secara manual (keliling area, Google Maps)

4. Estimasi profit berdasarkan pengalaman atau tanya sesama pengusaha

5. Keputusan dibuat berdasarkan intuisi → tingkat kegagalan tinggi

## **Kondisi yang Diharapkan (Expectation)**

6. Merchant login ke ESB Dashboard → akses fitur AtlasAI

7. Pilih kategori jenis bisnis (ayam goreng, kopi, mie, dll.)

8. Klik titik lokasi di peta interaktif → koordinat terdeteksi otomatis

9. Sistem memproses: query Google Places API (kompetitor, traffic) \+ query database ESB (estimasi profit) \+ kalkulasi skor 5 dimensi \+ LLM generate rekomendasi teks

10. Hasil ditampilkan: skor kelayakan, peta kompetitor, estimasi profit, tag insight, rekomendasi AI

11. Merchant dapat download laporan PDF untuk presentasi ke partner/investor

12. Merchant membuat keputusan buka cabang berdasarkan data — bukan intuisi

# **User Stories & Acceptance Criteria**

## **US1 — Analisis Kelayakan Lokasi Secara Lengkap**

Sebagai *merchant ESB yang ingin membuka cabang baru,*Saya ingin *memilih jenis bisnis dan menentukan lokasi di peta untuk mendapatkan skor analisis lengkap,*Sehingga *saya dapat membuat keputusan investasi lokasi secara objektif dan berbasis data.*

| ID | Flow | Acceptance Criteria | Catatan |
| :---- | :---- | :---- | :---- |
| **AC1.1** | ✅ Positive | Halaman menampilkan 6 kategori bisnis (Ayam Goreng, Kopi & Cafe, Mie & Bakso, Minuman, Burger, Lainnya) dengan ikon dan label. Kategori yang dipilih ditandai border oranye (\#FF6B2B) dan background tinted. | *Happy path — pilih kategori* |
| **AC1.2** | ✅ Positive | Setelah user mengklik titik di peta, pin oranye muncul dengan animasi pulse. Koordinat (lat, lng) ditampilkan real-time. Radius analisis 500m tampil sebagai lingkaran putus-putus. | *Happy path — pilih lokasi* |
| **AC1.3** | ✅ Positive | Dalam waktu ≤ 10 detik, sistem menampilkan 5 dimensi skor (0–100 masing-masing), Overall Score dalam circle visualization, grade (Sangat Potensial / Potensi Bagus / Cukup Potensial / Kurang Ideal), dan rekomendasi AI 2 kalimat. | *Happy path — hasil analisis* |
| **AC1.4** | ✅ Positive | Warna progress bar mengikuti: hijau (\#10B981) untuk skor ≥ 70, kuning (\#F59E0B) untuk 50–69, merah (\#EF4444) untuk \< 50\. | *Visual feedback skor* |
| **AC1.5** | ✅ Positive | Saat user memindahkan pin ke lokasi berbeda, skor dan estimasi diperbarui otomatis. Request sebelumnya di-abort jika analisis baru dipicu. | *Pindah lokasi* |
| **AC1.6** | ❌ Negative | Jika user belum memilih kategori bisnis dan mencoba analisis, tombol 'Analisis' berstatus disabled dengan tooltip: 'Pilih jenis bisnis terlebih dahulu'. | *Validasi input* |
| **AC1.7** | ❌ Negative | Jika API analisis gagal (timeout / 5xx), sistem menampilkan pesan error dengan tombol 'Coba Lagi'. Tidak ada partial data yang ditampilkan. | *Error handling* |
| **AC1.8** | ❌ Negative | Jika koordinat berada di luar coverage data ESB, sistem menampilkan banner informatif: 'Data ESB untuk area ini terbatas. Hasil menggunakan data publik.' Proses analisis tetap berjalan. | *Coverage limit* |
| **AC1.9** | ⚠️ Edge Case | Klik di atas elemen UI (legend peta, tombol zoom, label jalan) tidak terdaftar sebagai pemilihan lokasi dan pin tidak berpindah. | *Map interaction* |

## **US2 — Estimasi Profit Berbasis Data ESB**

Sebagai *calon merchant yang sedang merencanakan bisnis FnB pertamanya,*Saya ingin *melihat estimasi range profit bulanan untuk lokasi yang saya pilih,*Sehingga *saya dapat menilai kelayakan finansial dan memperkirakan payback period sebelum mengambil keputusan.*

| ID | Flow | Acceptance Criteria | Catatan |
| :---- | :---- | :---- | :---- |
| **AC2.1** | ✅ Positive | Estimasi profit ditampilkan sebagai range min–max (Rp X jt – Rp Y jt / bulan). Di bawahnya tampil disclaimer dinamis: 'Berdasarkan data \[N\]+ outlet ESB sejenis dalam radius \[R\]km.' Nilai N dan R diambil dari hasil query aktual. | *Happy path* |
| **AC2.2** | ✅ Positive | Tag insight ditampilkan maks. 6 item dengan kode warna: hijau \= faktor positif, kuning \= perlu perhatian, merah \= risiko, biru \= informasi netral. | *Tag insight* |
| **AC2.3** | ❌ Negative | Jika jumlah outlet referensi \< 5, sistem menampilkan warning: 'Data terbatas (\< 5 outlet referensi). Estimasi bersifat indikatif.' Styling angka profit diperhalus (warna abu-abu). | *Data terbatas* |
| **AC2.4** | ❌ Negative | Jika tidak ada data outlet ESB di area tersebut sama sekali, blok estimasi profit tidak ditampilkan dan diganti pesan: 'Estimasi profit belum tersedia untuk area ini.' | *No data* |
| **AC2.5** | ⚠️ Edge Case | Jika outlet referensi tersedia namun variance sangat tinggi (SD \> 60% mean), sistem menampilkan flag: 'Volatilitas data tinggi — estimasi memiliki tingkat ketidakpastian lebih besar.' | *High variance* |

## 

## 

## **US3 — Export Laporan Analisis**

Sebagai *merchant ESB yang telah menyelesaikan analisis lokasi,*Saya ingin *mengunduh laporan analisis dalam format PDF,*Sehingga *saya dapat mempresentasikan hasil analisis kepada partner bisnis atau investor secara profesional.*

| ID | Flow | Acceptance Criteria | Catatan |
| :---- | :---- | :---- | :---- |
| **AC3.1** | ✅ Positive | Tombol 'Export Laporan PDF' aktif (enabled) hanya setelah analisis berhasil dijalankan minimal satu kali. Sebelumnya berstatus disabled dengan tooltip 'Jalankan analisis terlebih dahulu'. | *Enable condition* |
| **AC3.2** | ✅ Positive | PDF yang dihasilkan memuat: nama jenis bisnis, koordinat lokasi, tanggal analisis, 5 dimensi skor, Overall Score & grade, estimasi profit, tag insight, rekomendasi AI, dan disclaimer ESB AtlasAI. | *PDF content* |
| **AC3.3** | ✅ Positive | Nama file mengikuti format: ESB\_AtlasAI\_\[JenisBisnis\]\_\[Tanggal\]\_\[Lat\]\_\[Lng\].pdf. Contoh: ESB\_AtlasAI\_AyamGoreng\_20260521\_-6.2088\_106.8456.pdf | *File naming* |
| **AC3.4** | ❌ Negative | Jika generasi PDF gagal, sistem menampilkan pesan error: 'Gagal mengunduh laporan. Silakan coba lagi.' Tidak ada file parsial yang terunduh. | *Error handling* |
| **AC3.5** | ⚠️ Edge Case | Jika user mengklik tombol Export saat PDF masih dalam proses generasi, tombol masuk loading state dan klik tambahan diabaikan (debounce). | *Double click* |

# **Out of Scope**

Berikut adalah item yang secara eksplisit TIDAK termasuk dalam sprint ini:

| No | Item | Alasan / Rencana ke Depan |
| :---- | :---- | :---- |
| 1 | Analisis untuk bisnis non-FnB (retail, salon, laundry, dll.) | ESB fokus pada FnB. Ekspansi ke non-FnB membutuhkan model data yang berbeda. Kandidat v2. |
| 2 | Perbandingan lebih dari 2 lokasi secara bersamaan | Kompleksitas UI tinggi. Direncanakan sebagai fitur 'Compare Locations' di v1.1. |
| 3 | Rekomendasi properti / listing tempat usaha | Di luar domain ESB. Potensi integrasi partnership dengan Rumah123/Lamudi ke depan. |
| 4 | Analisis kelayakan finansial lengkap (ROI, break-even, modal awal) | Membutuhkan input data merchant yang lebih kompleks. Kandidat fitur terpisah 'ESB Financial Planner'. |
| 5 | Notifikasi otomatis saat kondisi area berubah | Membutuhkan infrastruktur notifikasi tambahan. Masuk backlog v2. |
| 6 | Auto-migration seluruh merchant ke fitur AtlasAI | Onboarding dilakukan bertahap. Sprint ini hanya memastikan fitur berjalan benar saat diaktifkan. |

# **Known Limitations & Constraints**

| ID | Limitasi & Constraints |
| :---- | :---- |
| **LC1** | Fase 1 hanya mencakup 6 kota dengan data ESB yang cukup padat: Jakarta, Surabaya, Bandung, Medan, Makassar, Semarang. Analisis di kota lain menggunakan data publik dengan akurasi lebih rendah. |
| **LC2** | Data kompetitor dari Google Places bersifat tidak real-time — dapat terdapat lag hingga 30 hari dari kondisi aktual di lapangan. Data di-cache per zona geohash untuk efisiensi biaya. |
| **LC3** | Estimasi profit tidak memperhitungkan faktor musiman, tren makro ekonomi, atau dampak kebijakan pemerintah setempat. Angka bersifat estimasi historis, bukan prediksi. |
| **LC4** | Data transaksi outlet ESB yang digunakan untuk benchmark harus dianonimkan dan diagregasi (minimum 10 outlet per zona) — tidak boleh mengekspos data revenue individual merchant. Merchant mendapat mekanisme opt-in sebelum data mereka digunakan. |
| **LC5** | Radius proteksi 500m diterapkan: AtlasAI tidak memberikan skor tinggi untuk lokasi yang terlalu dekat dengan outlet ESB existing aktif berkategori sama, untuk melindungi merchant existing dari persaingan langsung yang difasilitasi datanya sendiri. |
| **LC6** | Penggunaan data merchant untuk AtlasAI memerlukan review Legal dan update ToS sebelum launch. Kepatuhan terhadap UU PDP (Perlindungan Data Pribadi) Indonesia wajib dipastikan. \[TODO: Jadwalkan review dengan Legal.\] |

# 

# **Meeting Notes**

| Tanggal | Peserta | Ringkasan |
| :---- | :---- | :---- |
| 21 Mei 2026 | [Diki Taurens Sia](mailto:diki.taurens@esb.co.id) | — Inisiasi PRD ESB AtlasAI untuk ESB Internal Hackathon 2026 — Konfirmasi scope: hackathon edition fokus pada core flow analisis lokasi |
|  |  |  |

[^1]:  Bellini, J. (2016). “*Here's the REAL reason why most restaurants fail*”. CNBC. https://www.cnbc.com/2016/01/20/heres-the-real-reason-why-most-restaurants-fail.html