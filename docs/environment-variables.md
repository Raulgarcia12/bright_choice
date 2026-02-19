# Environment Variables Guide

## Frontend (Vercel)
Required variables for the Vercel deployment:

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

## Scraper Service (GitHub Actions Secrets)
Required secrets for the scraper cron workflow:

```
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_ANON_KEY=<your-anon-key>
```

## Supabase Edge Functions
These are automatically available in the Deno runtime:

```
SUPABASE_URL          (auto-injected)
SUPABASE_SERVICE_ROLE_KEY (auto-injected)
```

Optional alert configuration:

```
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
ALERT_EMAIL=team@company.com
```

## Scraper Service (.env)
When running locally:

```
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SCRAPE_DELAY_MS=2000
SCRAPE_MAX_RETRIES=3
SCRAPE_TIMEOUT_MS=30000
LOG_LEVEL=debug
```

## Security Notes
- **Never** commit `.env` files to Git — they are in `.gitignore`.
- Use **service role keys** only server-side (scraper, Edge Functions).
- Use **anon keys** only client-side (frontend).
- Rotate keys periodically via the Supabase Dashboard.
