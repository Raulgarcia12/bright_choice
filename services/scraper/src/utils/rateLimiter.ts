/**
 * Rate Limiter
 * Ensures respectful request pacing per domain.
 */
import { config } from '../config.js';

const domainTimestamps = new Map<string, number>();

/**
 * Wait the configured delay between requests to the same domain.
 */
export async function rateLimit(domain: string): Promise<void> {
    const now = Date.now();
    const lastRequest = domainTimestamps.get(domain) || 0;
    const elapsed = now - lastRequest;
    const delay = config.scraper.delayMs;

    if (elapsed < delay) {
        await new Promise((resolve) => setTimeout(resolve, delay - elapsed));
    }

    domainTimestamps.set(domain, Date.now());
}

/**
 * Sleep for a given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
