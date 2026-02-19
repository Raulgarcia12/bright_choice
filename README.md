# 💡 Bright Choice — Competitive Intelligence Platform

> **Real-time competitive intelligence for the North American lighting industry**

Bright Choice tracks, normalizes, and compares product specifications across major lighting manufacturers — giving procurement teams, analysts, and distributors a strategic edge.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 📊 **Intelligence Dashboard** | KPI cards, trend charts, and a live change feed powered by Recharts |
| 🔍 **Product Catalog** | Filter, search, and browse hundreds of lighting products by brand, region, CCT, wattage, and certifications |
| ⚖️ **Smart Comparator** | Side-by-side product comparison with the proprietary **Convenience Score™** algorithm |
| 📝 **Change Detection** | SHA-256 hashing detects spec changes between scrapes; field-level diffs stored in a versioned change log |
| 🤖 **Automated Scraping** | Modular scraper service with brand-specific adapters (Axios/Cheerio for static, Playwright for dynamic, API-first for catalogs) |
| 🔄 **Normalization Engine** | Attribute mapping, unit conversion, and validation rules standardize heterogeneous manufacturer data |
| 🔔 **Alert System** | Slack-compatible webhook and email notifications via Supabase Edge Functions |
| 🔐 **Role-Based Access** | Admin, Analyst, Viewer roles with RLS policies and a `ProtectedRoute` component |
| 🌍 **Internationalization** | English/Spanish (EN/ES) with easy extension |
| 🌙 **Dark Mode** | System-aware theme toggle |

---

## 🏗️ Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌────────────────────┐
│   Frontend (SPA) │────▶│  Supabase (DB +  │◀────│  Scraper Service   │
│   React + Vite   │     │  Edge Functions)  │     │  Node.js + TS      │
│   Vercel Hosting │     │  PostgreSQL + RLS │     │  GitHub Actions    │
└──────────────────┘     └──────────────────┘     └────────────────────┘
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18, Vite, TypeScript, Tailwind, Shadcn UI | Product catalog, dashboard, comparator |
| Backend API | Supabase Edge Functions (Deno) | Server-side KPI computation, comparison, alerts |
| Database | PostgreSQL via Supabase | 9 tables with RLS, views, triggers |
| Scraper | Node.js, Playwright, Cheerio, Axios | Brand-specific web scrapers |
| Scheduling | GitHub Actions CRON | Bi-weekly automated scraping |
| Deployment | Vercel (frontend), Supabase (backend) | Production hosting |

---

## 📁 Project Structure

```
bright_choice/
├── src/                          # Frontend application
│   ├── components/               # UI components (Header, ComparatorView, ProtectedRoute, ...)
│   ├── hooks/                    # Custom hooks (useAuth, useProducts, useTheme)
│   ├── integrations/supabase/    # Supabase client + types
│   ├── lib/                      # Store, i18n, Convenience Score™
│   └── pages/                    # Dashboard, Index, ProductDetail, ChangeLog, Admin, Login
├── services/scraper/             # Scraper microservice
│   └── src/
│       ├── brands/               # BaseScraper + Acuity, Cree, Philips adapters
│       ├── normalizer/           # attributeMap, unitConverter, validator
│       ├── detector/             # hashEngine, changeDetector
│       ├── utils/                # Logger, rateLimiter, supabaseAdmin
│       ├── config.ts             # Environment config loader
│       └── index.ts              # Central orchestrator
├── supabase/
│   ├── functions/                # Edge Functions (dashboard-metrics, compare-products, change-alerts)
│   └── migrations/               # SQL migrations
├── .github/workflows/            # GitHub Actions (scraper cron + alert trigger)
├── docs/                         # Environment variable guide
├── vercel.json                   # Vercel deployment config
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- (Optional) Vercel account for deployment

### 1. Clone & Install

```bash
git clone https://github.com/Raulgarcia12/bright_choice.git
cd bright_choice
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

### 3. Deploy Database Migration

Run the SQL migration in your Supabase Dashboard → SQL Editor:

```
supabase/migrations/20260218010000_competitive_intelligence_schema.sql
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

### 5. Deploy Edge Functions (optional)

```bash
supabase functions deploy dashboard-metrics
supabase functions deploy compare-products
supabase functions deploy change-alerts
```

---

## 🤖 Running the Scraper

### Locally

```bash
cd services/scraper
cp .env.example .env
# Edit .env with your service role key
npm install
npx tsx src/index.ts
```

### Via GitHub Actions

The scraper runs automatically on the **1st and 15th of each month**. You can also trigger it manually from the Actions tab with an optional `--brand` parameter.

---

## 🗄️ Database Schema

| Table | Purpose |
|-------|---------|
| `products` | Core product catalog with specs + certifications |
| `brands` | Manufacturer registry with scraper configuration |
| `product_versions` | Versioned spec snapshots (JSON) |
| `product_attributes` | Key-value extended attributes |
| `change_logs` | Field-level diffs with timestamps |
| `scrape_runs` | Scraper execution history and stats |
| `raw_scraped_data` | Audit trail of raw HTML/JSON |
| `regions` | North American regions (US states, Canadian provinces) |
| `user_roles` | Role assignments (admin, analyst, viewer) |

---

## 🔒 Security

- **Row Level Security (RLS)** on all tables
- **Service role keys** server-side only
- **Anon keys** client-side only
- **ProtectedRoute** component for frontend route access gating
- Security headers via `vercel.json` (X-Frame-Options, XCTO, Referrer-Policy)

---

## 📜 License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ for the North American lighting industry
</p>
