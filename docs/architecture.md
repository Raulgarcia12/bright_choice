# Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BRIGHT CHOICE PLATFORM                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐   ┌───────────────┐   ┌────────────────────────┐  │
│  │ Frontend SPA │   │  Edge Fns     │   │ Scraper Service        │  │
│  │ React + Vite │──▶│ (Deno)        │   │ (Node.js + TypeScript) │  │
│  │ Vercel       │   │               │   │ GitHub Actions CRON    │  │
│  │              │   │ • dashboard-  │   │                        │  │
│  │ Pages:       │   │   metrics     │   │ Adapters:              │  │
│  │ • Dashboard  │   │ • compare-    │   │ • Acuity (Cheerio)     │  │
│  │ • Products   │   │   products    │   │ • Cree (Playwright)    │  │
│  │ • Detail     │   │ • change-     │   │ • Philips (API)        │  │
│  │ • Changes    │   │   alerts      │   │                        │  │
│  │ • Admin      │   └──────┬────────┘   │ Pipeline:              │  │
│  │ • Compare    │          │            │ Scrape → Normalize     │  │
│  └──────┬───────┘          │            │ → Validate → Detect    │  │
│         │                  ▼            │ → Store                │  │
│         │         ┌──────────────────┐  └──────────┬─────────────┘  │
│         └────────▶│ Supabase         │◀────────────┘               │
│                   │ PostgreSQL       │                              │
│                   │                  │                              │
│                   │ Tables:          │                              │
│                   │ • products       │                              │
│                   │ • brands         │                              │
│                   │ • product_ver.   │                              │
│                   │ • change_logs    │                              │
│                   │ • scrape_runs    │                              │
│                   │ • raw_scraped    │                              │
│                   │ • regions        │                              │
│                   │ • user_roles     │                              │
│                   │                  │                              │
│                   │ RLS policies     │                              │
│                   └──────────────────┘                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
1. GitHub Actions CRON (bi-weekly)
   │
   ▼
2. Scraper Service (Node.js)
   ├── BaseScraper.execute() — retry + rate limit
   ├── Brand Adapter (Acuity/Cree/Philips)
   ├── Normalizer — attribute map + unit convert + validate
   ├── Change Detector — SHA-256 hash compare + field diff
   └── Store to Supabase (products, versions, change_logs)
   │
   ▼
3. Change Alerts Edge Function (via curl)
   ├── Webhook → Slack
   └── Email → team inbox
   │
   ▼
4. Frontend (React SPA)
   ├── Dashboard — KPI cards, charts, recent changes
   ├── Products — filterable catalog
   ├── Detail — product specs + version timeline
   └── Changes — searchable change log
```

## Role-Based Access Control

| Role | Dashboard | Products | Detail | Changes | Admin |
|------|-----------|----------|--------|---------|-------|
| **No auth** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Viewer** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Analyst** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |

Access is enforced at two levels:
1. **Database**: RLS policies per table
2. **Frontend**: `ProtectedRoute` wrapper with `hasPermission()` check

## Normalization Pipeline

```
Raw Input (varies by manufacturer)
  │
  ▼
Attribute Map — match 12+ standard attributes
  │
  ▼
Unit Converter — kW→W, lbs→kg, in→mm, etc.
  │
  ▼
Validator — range checks (1–2000W, 50–200K lm, etc.)
             cross-validation (stated vs calculated efficiency)
  │
  ▼
Normalized Output → Supabase products table
```

## Tech Stack Summary

| Category | Technology |
|----------|-----------|
| Language | TypeScript (strict: false for flexibility) |
| Frontend Framework | React 18 + Vite 5 |
| Styling | Tailwind CSS 3 + Shadcn UI |
| State Management | Zustand |
| Data Fetching | TanStack React Query |
| Charts | Recharts |
| Animations | Framer Motion |
| Database | PostgreSQL (via Supabase) |
| Auth | Supabase Auth + custom roles |
| API | Supabase Edge Functions (Deno) |
| Scraping | Playwright, Axios, Cheerio |
| Scheduling | GitHub Actions CRON |
| Deployment | Vercel (frontend), Supabase (backend) |
| Logging | Winston (scraper), Console (frontend) |
