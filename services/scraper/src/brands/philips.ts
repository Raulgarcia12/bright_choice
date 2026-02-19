/**
 * Signify / Philips Lighting Scraper
 * Scrapes product data from Signify (Philips professional lighting).
 * Uses Axios for their API-driven product catalog.
 */
import axios from 'axios';
import { BaseScraper, type RawProduct } from './BaseScraper.js';
import { rateLimit } from '../utils/rateLimiter.js';

interface PhilipsApiProduct {
    name?: string;
    sku?: string;
    category?: string;
    url?: string;
    specifications?: Record<string, string>;
}

export class PhilipsScraper extends BaseScraper {
    async scrape(): Promise<RawProduct[]> {
        const products: RawProduct[] = [];
        const baseUrl = this.brandConfig.websiteUrl;
        const apiUrl = (this.brandConfig.scraperConfig?.apiUrl as string) || `${baseUrl}/api/products`;

        this.log.info(`Fetching product API from ${apiUrl}`);

        try {
            await rateLimit(new URL(baseUrl).hostname);

            const response = await axios.get<{ products: PhilipsApiProduct[] }>(apiUrl, {
                headers: {
                    'User-Agent': 'BrightChoice-Bot/1.0 (competitive-intelligence; contact@brightchoice.app)',
                    'Accept': 'application/json',
                },
                timeout: 30000,
            });

            const apiProducts = response.data?.products || [];

            for (const item of apiProducts) {
                if (!item.name) continue;

                products.push({
                    model: item.name,
                    sku: item.sku,
                    category: item.category,
                    productUrl: item.url ? new URL(item.url, baseUrl).toString() : undefined,
                    specs: item.specifications || {},
                    rawHtml: JSON.stringify(item), // Store raw JSON for audit
                });
            }

            this.log.info(`Parsed ${products.length} products from Signify/Philips`);
        } catch (error) {
            this.log.error(`Failed to scrape Signify: ${error instanceof Error ? error.message : error}`);
            throw error;
        }

        return products;
    }
}
