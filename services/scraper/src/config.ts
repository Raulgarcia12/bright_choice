/**
 * Scraper Service Configuration
 * Loads environment variables and provides typed config.
 */
import 'dotenv/config';

export const config = {
    supabase: {
        url: process.env.SUPABASE_URL || '',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    },
    scraper: {
        delayMs: parseInt(process.env.SCRAPE_DELAY_MS || '2000', 10),
        maxRetries: parseInt(process.env.SCRAPE_MAX_RETRIES || '3', 10),
        timeoutMs: parseInt(process.env.SCRAPE_TIMEOUT_MS || '30000', 10),
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
    },
};

// Validate required env vars at startup
export function validateConfig(): void {
    const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
