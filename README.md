# ESB AtlasAI — Location Intelligence for FnB

ESB AtlasAI membantu merchant dan calon merchant FnB menganalisis kelayakan lokasi bisnis secara data-driven. Cukup pilih jenis bisnis dan tandai lokasi di peta — sistem menghasilkan skor analisis, peta kompetitor, estimasi profit, dan rekomendasi AI dalam hitungan detik.

Dibangun di atas data transaksi 30.000+ outlet aktif ESB yang tidak dapat direplikasi kompetitor manapun.

> Dibuat untuk **ESB Internal Hackathon 2026** 

---

## Fitur Utama

| Fitur | Deskripsi |
|---|---|
| **Skor Kelayakan Lokasi** | Skor 0–100 dari 5 dimensi: traffic pejalan kaki, tingkat persaingan, aksesibilitas, kepadatan penduduk, dan daya beli area |
| **Peta Kompetitor** | Visualisasi outlet sejenis dalam radius yang dipilih (200–1500 m) |
| **Estimasi Profit** | Range profit bulanan (min–max) berdasarkan data historis outlet ESB di area tersebut |
| **Rekomendasi AI** | Analisis naratif berbahasa Indonesia yang menjelaskan potensi dan risiko utama lokasi |
| **Export PDF** | Laporan lengkap siap presentasi ke partner atau investor |
| **Riwayat Analisis** | Simpan dan bandingkan hasil analisis antar lokasi |

---

## Kategori Bisnis yang Didukung

Ayam Goreng · Kopi & Cafe · Mie & Bakso · Minuman · Burger · Lainnya

---

## Cara Menjalankan

Ada dua pilihan setup database: **Docker/Podman** (direkomendasikan) atau **PostgreSQL lokal**.

---

### Pilihan A — Docker / Podman (direkomendasikan)

#### Prasyarat

- [Node.js](https://nodejs.org/) v18+
- [Docker](https://www.docker.com/) atau [Podman](https://podman.io/) dengan Compose

#### Langkah 1 — Clone & install dependencies

```bash
git clone <repo-url>
cd atlas-ai
npm install
```

#### Langkah 2 — Buat file environment

```bash
cp .env.local.example .env.local
```

`DATABASE_URL` di `.env.local` sudah dikonfigurasi untuk setup Docker secara default. Ganti `JWT_SECRET` dengan string acak:

```bash
openssl rand -base64 32
```

#### Langkah 3 — Jalankan database

```bash
# Docker
docker compose up -d

# Podman
podman compose up -d
```

Container postgres akan build otomatis dari `docker/postgres/Dockerfile` dan menyimpan data di named volume `postgres_data`.

#### Langkah 4 — Migrasi & seed

```bash
npm run migration:run
npm run seed
```

#### Langkah 5 — Jalankan aplikasi

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

### Pilihan B — PostgreSQL Lokal

#### Prasyarat

- [Node.js](https://nodejs.org/) v18+
- [PostgreSQL](https://www.postgresql.org/) v14+ terinstall dan berjalan lokal

#### Langkah 1 — Clone & install dependencies

```bash
git clone <repo-url>
cd atlas-ai
npm install
```

#### Langkah 2 — Buat database dan user

```bash
psql -U postgres
```

```sql
CREATE USER atlas WITH PASSWORD 'atlas_dev';
CREATE DATABASE atlas_ai OWNER atlas;
\q
```

#### Langkah 3 — Buat file environment

```bash
cp .env.local.example .env.local
```

#### Langkah 4 — Migrasi & seed

```bash
npm run migration:run
npm run seed
```

#### Langkah 5 — Jalankan aplikasi

```bash
npm run dev
```

---

## Perintah Docker / Podman

```bash
# Start
docker compose up -d

# Stop
docker compose down

# Stop + hapus semua data (reset DB)
docker compose down -v

# Lihat logs postgres
docker compose logs db
```

---

## Perintah npm

```bash
npm run dev              # Dev server (http://localhost:3000)
npm run build            # Production build
npm run start            # Serve production build
npm run lint             # ESLint
npm run migration:run    # Jalankan migrasi pending
npm run migration:revert # Rollback migrasi terakhir
npm run migration:show   # Lihat status migrasi
npm run seed             # Isi data referensi (benchmarks, competitors, demographics)
```

---

## Variabel Environment

| Variabel | Keterangan |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Secret untuk JWT token (generate dengan `openssl rand -base64 32`) |

---

## Cakupan Data

Fase 1 mencakup **Jakarta** dengan data ESB yang paling padat. Analisis di luar coverage data ESB tetap berjalan menggunakan data publik (Overpass/OSM) dengan akurasi lebih rendah.

**Keterbatasan yang perlu diketahui:**
- Data kompetitor tidak real-time — dapat ada lag hingga 30 hari dari kondisi aktual
- Estimasi profit bersifat historis, bukan prediksi — tidak memperhitungkan faktor musiman atau tren makro
- Data outlet ESB dianonimkan dan diagregasi (minimum per zona) — tidak ada data revenue individual yang terekspos

---

## Deployment

App ini adalah fullstack Next.js dengan API routes — **tidak bisa** di-deploy sebagai static export. Gunakan Vercel, Railway, atau host Node.js lainnya.

Untuk production dengan Neon (cloud PostgreSQL), ganti `DATABASE_URL` di environment hosting dengan connection string dari [neon.tech](https://neon.tech).
