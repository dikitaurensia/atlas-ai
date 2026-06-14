# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start Next.js dev server (http://localhost:3000) — uses Turbopack
npm run build            # Production build → .next/
npm run start            # Serve the production build
npm run lint             # ESLint via next lint
npm run migration:run    # Apply pending TypeORM migrations (requires DATABASE_URL in .env)
npm run migration:revert # Revert the last migration
npm run migration:generate -- database/migrations/MyMigration  # Generate migration from entity diff
npm run migration:show   # List applied/pending migrations
npm run seed             # Populate reference data (profit_benchmarks, competitors, area_demographics)
```

## Architecture

**AtlasAI** is a Next.js fullstack app for FnB location intelligence in Jakarta. Users pick a map location, choose a food/beverage category, set a business scale and search radius, and receive an analysis score with competitor data.

### Directory layout

```
app/
  layout.jsx          — root layout; imports Leaflet CSS + globals.css
  page.jsx            — entry point; dynamically imports App with ssr:false
  globals.css         — all CSS (design tokens, Leaflet overrides, animations, layout classes)
  api/analyze/
    route.js          — POST /api/analyze → collects real data, calls lib/analysis.js, returns JSON
database/
  migrations/         — TypeORM migration files (run via npm run migration:run)
  seeds/              — seed runner + 3 seeder files (profit_benchmarks, competitors, area_demographics)
components/
  App.jsx             — root client component; all app state lives here
  Header.jsx          — desktop header with Nominatim location search
  MobileHeader.jsx    — mobile header with full-screen search overlay
  Sidebar.jsx         — desktop left panel (category + scale + radius + results)
  MapView.jsx         — Leaflet map (dark CartoDB tiles, custom pin/competitor icons)
  MobileBottomSheet.jsx — draggable bottom sheet for mobile; snaps to peek/full on release
  ResultPanel.jsx     — analysis results display; opens PDFPreviewModal
  RiwayatSider.jsx    — slide-in drawer showing history (list and detail panels)
  PDFPreviewModal.jsx — html2canvas + jsPDF export
  CategoryPicker.jsx  — 6-category grid
  ScalePicker.jsx     — business scale selector (Kecil/Menengah/Besar); affects profit + competition scoring
  RadiusSlider.jsx    — range input 200–1500 m
  LoadingSteps.jsx    — animated 4-step progress indicator during analysis (timed at 1.1/2.2/3.3s)
  EmptyState.jsx      — onboarding steps illustration; step 3 becomes the "Mulai Analisis" button when ready
hooks/
  useIsMobile.js      — SSR-safe responsive breakpoint hook (768 px)
lib/
  analysis.js         — analysis engine: scoring formulas, grade thresholds, AI recommendation text, tags
  data-source.ts      — TypeORM DataSource singleton (globalThis-based to survive HMR); use getDataSource()
  entities/           — TypeORM EntitySchema definitions (User, SavedAnalysis, Competitor, ProfitBenchmark, AreaDemographic)
typeorm.config.ts     — TypeORM CLI config (used by migration:run/generate/seed scripts)
tsconfig.typeorm.json — Separate tsconfig for TypeORM CLI (CommonJS module, excludes Next.js files)
```

### State management

All application state lives in `components/App.jsx` via `useState`/`useRef`. There is no external state library. Key state: `selectedLocation`, `selectedCategory`, `radius`, `scale`, `analysisResult`, `isAnalyzing`, `riwayatOpen`, `historyItems`, `sessionIdRef`, `savedKey`.

An `AbortController` ref (`abortRef`) cancels in-flight requests when the user changes inputs.

### Analysis flow

`App.jsx` → `POST /api/analyze` → `route.js` collects data in parallel → `lib/analysis.js#generateAnalysis()` → JSON response → `setAnalysisResult`.

`route.js` runs three data fetches in parallel via `Promise.allSettled()`:
1. **Neon DB queries** — competitors within radius, profit benchmarks, area demographics (population density, income index)
2. **Overpass API (OSM)** — foot traffic (amenities: restaurants, shops, offices) and accessibility (transport nodes)
3. **Area demographics** — population density + income index used for scoring

Returns `{ unsupported: true }` for locations outside Jakarta's demographics coverage. If Overpass times out or DB fails, the analysis still succeeds — those dimension scores are `null` and averaged out gracefully.

### Scoring in `lib/analysis.js`

Five dimensions, each 0–100:
- **Traffic** — Overpass amenity count: `20 + count * 3.5`, capped at 95
- **Competition** — competitor count vs benchmark market density; adjusted ±5 by scale (`SCALE_COMP_ADJ`)
- **Accessibility** — Overpass transport node count: `20 + count * 3.5`, capped at 95
- **Population** — BPS population density: `25 + density / 310`
- **Purchasing Power** — BPS income index 0–100, passed directly

Overall score = average of available scores. Grade thresholds: Sangat Potensial ≥75, Potensi Bagus ≥60, Cukup Potensial ≥45, Kurang Ideal <45.

Profit range uses competitor revenue IQR (p25–p75 if ≥4 competitors, else min–max), multiplied by `SCALE_PROFIT_MULT` (0.4 / 1.0 / 2.2 for Kecil/Menengah/Besar).

### History: session vs saved

`RiwayatSider` manages two tiers:
- **Session entries** — temporary, keyed `tmp-*`; created locally when analysis completes
- **Saved entries** — persisted to Neon DB via `handleSave()` in App.jsx; session ID upgraded to a DB ID

History is fetched from `/api/analysis/history` on mount and merged with session entries. `savedKey` tracks whether the current result is saved.

### SSR / Leaflet

`app/page.jsx` uses `dynamic(() => import('@/components/App'), { ssr: false })`. This disables SSR for the entire app tree to avoid `window`/`document` errors from Leaflet. All components are therefore `'use client'`.

### Responsive layout

`hooks/useIsMobile.js` returns `true` below 768 px. The two layouts are completely different component trees — not CSS-responsive:

| Desktop | Mobile |
|---------|--------|
| `Header` + `Sidebar` + `MapView` | `MobileHeader` + `MapView` + `MobileBottomSheet` |

`MobileBottomSheet` peeks at 230 px (shows category + radius) and snaps to 86 % viewport height on drag. It auto-expands when analysis starts or a result arrives.

### Styling conventions

All styles are inline objects (`const s = { ... }` per component). CSS custom properties (`var(--txt-1)`, `var(--accent)`, etc.) from `globals.css` are used inside those objects. There are no CSS modules, Tailwind, or CSS-in-JS libraries.

### Database / TypeORM

API routes use TypeORM via `getDataSource()` from `lib/data-source.ts`. The DataSource is a singleton (via `globalThis._orm`) that survives Next.js HMR in development.

Entity schemas (no decorators) are in `lib/entities/`. Repositories are obtained with `dataSource.getRepository(Schema)`. For the spatial Haversine competitor query in `analyze/route.js`, raw SQL via `dataSource.query()` is used — TypeORM QueryBuilder is used everywhere else.

The `/api/setup` endpoint is deprecated; schema is now managed by TypeORM migrations, seed data by the seed runner.

**First-time setup workflow:**
```bash
npm run migration:run  # creates all tables
npm run seed           # populates reference data
```

`next.config.mjs` has a webpack alias block that silences TypeORM's optional driver imports (expo-sqlite, mysql, oracle, etc.).

### Environment variables

```
DATABASE_URL    — Neon Postgres connection string (used by both Next.js app and TypeORM CLI)
JWT_SECRET      — for session tokens
```

### Docker

```bash
# Local development (postgres + app in containers)
docker compose up --build

# Seed reference data after first start
docker compose run --rm seed

# Production build only
docker build -t atlas-ai .
```

`docker-compose.yml` runs a local Postgres 16 container. To use Neon instead, remove the `db` service and set `DATABASE_URL` to the Neon connection string in the app's `environment` block (SSL is detected automatically from the URL).

`docker-entrypoint.sh` runs `npm run migration:run` before starting Next.js — migrations are idempotent so restarts are safe.

`next.config.mjs` contains a webpack alias block that silences TypeORM's optional driver imports (expo-sqlite, mysql, oracle, etc.) — do not remove it.

### Deployment

Fullstack Next.js with API routes — cannot be deployed as a static export. Use Vercel, Railway, or any Node.js host. Do not add `basePath: '/atlas-ai/'`.
