# Setup & Deployment Guide

## Prerequisites
- **Node.js** 18+ and npm
- A **Supabase** project (free tier works)
- A **Vercel** account (for production deployment)
- A **GitHub** repository (for Actions-based scraping)

---

## 1. Database Setup

### 1.1 Initial Schema
Run the base migration in Supabase SQL Editor:
```
File: supabase/migrations/20260214014835_a3a6b7a1-bbc4-4ad4-a029-469f3cf015ce.sql
```

### 1.2 Competitive Intelligence Extension
Then run the CI schema migration:
```
File: supabase/migrations/20260218010000_competitive_intelligence_schema.sql
```

This creates: `brands`, `product_versions`, `product_attributes`, `scrape_runs`, `raw_scraped_data`, `change_logs`, plus extensions to the `products` table and new RLS policies.

---

## 2. Frontend Deployment (Vercel)

### 2.1 Connect Repository
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. Framework preset: **Vite**

### 2.2 Environment Variables
Add in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://<project>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon key |

### 2.3 Deploy
Vercel auto-deploys on push to `main`. The `vercel.json` handles:
- SPA rewrites (all routes → `index.html`)
- Static asset caching (1 year, immutable)
- Security headers

---

## 3. Edge Functions Deployment

### 3.1 Install Supabase CLI
```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-id>
```

### 3.2 Deploy Functions
```bash
supabase functions deploy dashboard-metrics
supabase functions deploy compare-products
supabase functions deploy change-alerts
```

### 3.3 Set Function Secrets (optional)
```bash
supabase secrets set ALERT_WEBHOOK_URL="https://hooks.slack.com/services/XXX/YYY/ZZZ"
supabase secrets set ALERT_EMAIL="team@company.com"
```

---

## 4. Scraper Configuration

### 4.1 GitHub Actions Secrets
In your repository → Settings → Secrets → Actions, add:

| Secret | Value |
|--------|-------|
| `SUPABASE_URL` | `https://<project>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
| `SUPABASE_ANON_KEY` | Your anon key |

### 4.2 Schedule
The scraper runs automatically on the **1st and 15th** of each month (UTC 06:00). You can also trigger it manually from the Actions tab.

### 4.3 Local Testing
```bash
cd services/scraper
cp .env.example .env
# Fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
npm install
npx tsx src/index.ts
```

---

## 5. Role Setup

### 5.1 Create Admin User
1. Sign up via the app's login page
2. In Supabase SQL Editor:
```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'your-admin@email.com';
```

### 5.2 Assign Roles
```sql
-- Analyst role
INSERT INTO user_roles (user_id, role) VALUES ('<user-id>', 'analyst');

-- Viewer role (default for new users)
INSERT INTO user_roles (user_id, role) VALUES ('<user-id>', 'viewer');
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Edge Function lint errors in IDE | Expected — they use Deno runtime, not Node.js. Only affects IDE; deployment works fine |
| Scraper timeout | Increase `SCRAPE_TIMEOUT_MS` in `.env` |
| RLS blocking queries | Ensure user has appropriate role in `user_roles` |
| Build fails | Run `npx tsc --noEmit` to identify TypeScript errors |
