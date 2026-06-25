# AtlasAI — Hackathon Q&A Brief

---

## Teknis & Arsitektur

**Q: Pakai AI apa? Ada machine learning-nya?**
Tidak ada ML. Scoring-nya deterministik berbasis formula — 5 dimensi dihitung dari data nyata lalu di-average. "AI" di nama merujuk ke rekomendasi teks yang di-generate berdasarkan kombinasi skor, bukan LLM call. Tujuannya: hasil yang reproducible dan explainable.
> Kalau ditanya kenapa tidak pakai LLM: latency, cost per query, dan hasil tidak deterministic — untuk keputusan bisnis, explainability lebih penting.

**Q: Bagaimana cara kerja scoring-nya?**
5 dimensi, masing-masing 0–100, lalu di-average:
- **Traffic** — jumlah amenity (restoran, toko, kantor) dari OSM dalam radius
- **Kompetisi** — jumlah kompetitor vs benchmark density per kategori
- **Aksesibilitas** — transport node (halte, stasiun) dari OSM
- **Populasi** — kepadatan penduduk BPS per kelurahan
- **Daya Beli** — income index BPS, langsung 0–100

Jika salah satu dimensi gagal (Overpass timeout dll.), nilainya `null` dan di-skip dari rata-rata — analisis tetap jalan.

**Q: Tech stack apa?**
- Next.js 15 (App Router, Turbopack) — fullstack satu repo
- Neon PostgreSQL + TypeORM
- Leaflet.js + CartoDB dark tiles
- Nominatim untuk geocoding (gratis, no API key)
- Overpass API untuk traffic & aksesibilitas (real-time)
- JWT untuk auth
- html2canvas + jsPDF untuk export

**Q: Kalau Overpass timeout, apa yang terjadi?**
Tiga fetch berjalan paralel via `Promise.allSettled()` — satu gagal tidak menghentikan yang lain. Dimensi Traffic & Aksesibilitas jadi `null`, di-skip dari rata-rata. User tetap dapat skor dari 3 dimensi sisanya.

---

## Data & Akurasi

**Q: Data dari mana saja?**
- **Neon DB (internal ESB)** — revenue kompetitor, profit benchmark per kategori, demografi BPS
- **Overpass API (OSM)** — amenity & transport node, di-query live setiap analisis
- **BPS Jakarta** — kepadatan penduduk & income index per kelurahan, sudah di-seed ke DB

**Q: Estimasi profit dihitung bagaimana? Seberapa akurat?**
Bukan prediksi — ini agregasi revenue aktual kompetitor ESB dalam radius yang dipilih.
- **≥ 4 kompetitor dengan data revenue**: IQR (p25–p75) dari rata-rata revenue mereka
- **< 4 kompetitor**: pakai min–max langsung
- **Tidak ada revenue data**: fallback ke tabel `profit_benchmarks` (kategori-level average)

Hasilnya dikalikan multiplier skala: **0.4× (Kecil) / 1.0× (Menengah) / 2.2× (Besar)**. Warning "data terbatas" muncul otomatis kalau referensi < 5 outlet.

**Q: Kenapa hanya cover Jakarta?**
Tabel `area_demographics` hanya berisi data kelurahan DKI Jakarta. Koordinat di luar area itu return pesan "Area Belum Didukung" — lebih baik jujur daripada tampilkan angka tanpa basis data. Untuk tambah kota lain tinggal seed data BPS kota tersebut, tidak perlu ubah kode.

**Q: Data kompetitor-nya stale tidak?**
Data kompetitor & benchmark di-seed manual — ini prototype hackathon. Data OSM (traffic, aksesibilitas) selalu real-time. Di production, idealnya ada pipeline dari POS/transaksi ESB untuk update revenue secara berkala.

---

## Bisnis & Value Prop

**Q: Apa bedanya dengan Google Maps?**
Google Maps tidak punya data revenue kompetitor FnB, tidak ada scoring kelayakan bisnis, dan tidak mempertimbangkan skala bisnis. AtlasAI menggabungkan tiga hal yang tidak ada di satu tempat: revenue benchmark dari data aktual ESB, scoring kelayakan 5 dimensi, dan konteks skala bisnis.

**Q: Siapa target penggunanya?**
- **Calon mitra/franchisee ESB** — gantikan survei lapangan awal
- **Business development ESB** — evaluasi lokasi calon mitra secara konsisten berbasis data
- **Konsultan lokasi FnB** — butuh laporan yang bisa di-export ke investor (PDF sudah ada)

**Q: Model monetisasi-nya bagaimana?**
- Bundled dengan ekosistem ESB — gratis untuk mitra aktif, premium untuk eksternal
- SaaS per kredit analisis — bayar per laporan, PDF export sebagai paywall
- B2B API — expose scoring engine ke property developer, bank KUR, atau platform franchise lain

---

## Demo & Edge Cases

**Q: Coba klik di luar Jakarta — apa yang terjadi?**
Muncul pesan "Area Belum Didukung", tidak ada skor. Disengaja — lebih baik jujur tentang batas coverage daripada tampilkan angka yang tidak punya basis data.

**Q: Skor bisa dimanipulasi? Radius besar supaya skor bagus?**
Radius besar justru menambah kompetitor yang terdeteksi → **skor kompetisi turun**. Traffic dan aksesibilitas naik, tapi persaingan terlihat lebih ketat. Trade-off yang realistis, bukan celah.

**Q: Sudah production-ready?**
Ini prototype yang membuktikan technical feasibility. Yang sudah solid: arsitektur Next.js, TypeORM migration, JWT auth, responsive mobile, graceful error handling. Yang masih perlu dikerjakan: pipeline update data berkala, coverage kota lain, rate limiting, user management lengkap.
> Framing yang tepat: *"MVP yang membuktikan masalah bisa diselesaikan dengan pendekatan ini, bukan product launch."*

**Q: Berapa lama analisis selesai?**
Rata-rata 1–3 detik. Bottleneck utama Overpass API (~500–2000ms). Tiga fetch berjalan paralel, ada loading indicator 4-step di UI. Jika Overpass lambat bisa sampai 5 detik, tapi hasil tetap muncul.
