# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Next.js dev server (http://localhost:3000)
npm run build     # Production build → .next/
npm run start     # Serve the production build
npm run lint      # ESLint via next lint
```

## Architecture

**AtlasAI** is a Next.js fullstack app for FnB location intelligence in Jakarta. Users pick a map location, choose a food/beverage category, set a search radius, and receive an analysis score with competitor data.

### Directory layout

```
app/
  layout.jsx          — root layout; imports Leaflet CSS + globals.css
  page.jsx            — entry point; dynamically imports App with ssr:false
  globals.css         — all CSS (design tokens, Leaflet overrides, animations, layout classes)
  api/analyze/
    route.js          — POST /api/analyze → calls lib/analysis.js, returns JSON
components/
  App.jsx             — root client component; all app state lives here
  Header.jsx          — desktop header with Nominatim location search
  MobileHeader.jsx    — mobile header with full-screen search overlay
  Sidebar.jsx         — desktop left panel (category + radius + results)
  MapView.jsx         — Leaflet map (dark CartoDB tiles, custom pin/competitor icons)
  MobileBottomSheet.jsx — draggable bottom sheet for mobile
  ResultPanel.jsx     — analysis results display; opens PDFPreviewModal
  RiwayatSider.jsx    — slide-in drawer showing history
  PDFPreviewModal.jsx — html2canvas + jsPDF export
  CategoryPicker.jsx  — 6-category grid
  RadiusSlider.jsx    — range input 200–1500 m
  EmptyState.jsx      — onboarding steps illustration
hooks/
  useIsMobile.js      — SSR-safe responsive breakpoint hook (768 px)
lib/
  analysis.js         — pure analysis engine (generateAnalysis, seeded mock math)
```

### State management

All application state lives in `components/App.jsx` via `useState`/`useRef`. There is no external state library. Key state: `selectedLocation`, `selectedCategory`, `radius`, `analysisResult`, `isAnalyzing`, `historyItems`.

An `AbortController` ref (`abortRef`) cancels in-flight requests when the user changes inputs.

### Analysis flow

`App.jsx` → `POST /api/analyze` → `lib/analysis.js#generateAnalysis` → JSON response → `setAnalysisResult`. The analysis is currently seeded pseudorandom mock data. Replace `lib/analysis.js` to connect real data sources.

### SSR / Leaflet

`app/page.jsx` uses `dynamic(() => import('@/components/App'), { ssr: false })`. This disables SSR for the entire app, which avoids all `window`/`document` access issues from Leaflet and the map components. All components are therefore `'use client'`.

### Responsive layout

`hooks/useIsMobile.js` returns `true` below 768 px. The two layouts are:

| Desktop | Mobile |
|---------|--------|
| `Header` + `Sidebar` + `MapView` | `MobileHeader` + `MapView` + `MobileBottomSheet` |

### Deployment

This is a fullstack Next.js app with API routes — it cannot be deployed as a static export (e.g. GitHub Pages). Use Vercel, Railway, or any Node.js host. Remove the previous `basePath: '/atlas-ai/'` if it ever gets added back.
