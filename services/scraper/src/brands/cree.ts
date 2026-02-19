/**
 * Cree Lighting Scraper
 * Scrapes product data from Cree Lighting.
 * Uses Playwright for dynamic JS-rendered content.
 */
import { chromium } from 'playwright';
import { BaseScraper, type RawProduct } from './BaseScraper.js';
import { rateLimit } from '../utils/rateLimiter.js';
import { config } from '../config.js';

export class CreeScraper extends BaseScraper {
    async scrape(): Promise<RawProduct[]> {
        const products: RawProduct[] = [];
        const baseUrl = this.brandConfig.websiteUrl;
        const catalogUrl = (this.brandConfig.scraperConfig?.catalogUrl as string) || `${baseUrl}/products`;

        this.log.info(`Launching browser for ${catalogUrl}`);

        const browser = await chromium.launch({ headless: true });

        try {
            const context = await browser.newContext({
                userAgent: 'BrightChoice-Bot/1.0 (competitive-intelligence; contact@brightchoice.app)',
            });
            const page = await context.newPage();
            page.setDefaultTimeout(config.scraper.timeoutMs);

            await rateLimit(new URL(baseUrl).hostname);
            await page.goto(catalogUrl, { waitUntil: 'networkidle' });

            // Auto-scroll to trigger infinite loading
            this.log.info('Auto-scrolling to load all products...');
            await page.evaluate(async () => {
                await new Promise<void>((resolve) => {
                    let totalHeight = 0;
                    const distance = 100;
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;

                        // Stop scrolling after a reasonable limit or reaching bottom
                        if (totalHeight >= scrollHeight || totalHeight > 15000) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 100);
                });
            });

            // Wait for product cards to render
            const productSelector = (this.brandConfig.scraperConfig?.productSelector as string) || '[data-product]';
            await page.waitForSelector(productSelector, { timeout: 10000 }).catch(() => {
                this.log.warn('Product selector not found, page may have changed');
            });

            // Extract product data from the rendered page
            const rawProducts = await page.evaluate((selector: string) => {
                const cards = document.querySelectorAll(selector);
                return Array.from(cards).map((card) => {
                    const name = card.querySelector('.product-name, h3, h4')?.textContent?.trim() || '';
                    const specs: Record<string, string> = {};

                    card.querySelectorAll('.spec-row, .product-spec, tr').forEach((row) => {
                        const label = row.querySelector('.spec-label, td:first-child, dt')?.textContent?.trim();
                        const value = row.querySelector('.spec-value, td:last-child, dd')?.textContent?.trim();
                        if (label && value) specs[label] = value;
                    });

                    return {
                        model: name,
                        sku: card.getAttribute('data-sku') || '',
                        category: card.getAttribute('data-category') || '',
                        productUrl: (card.querySelector('a') as HTMLAnchorElement)?.href || '',
                        specs,
                    };
                });
            }, productSelector);

            for (const raw of rawProducts) {
                if (raw.model) {
                    products.push({
                        model: raw.model,
                        sku: raw.sku || undefined,
                        category: raw.category || undefined,
                        productUrl: raw.productUrl || undefined,
                        specs: raw.specs,
                    });
                }
            }

            this.log.info(`Parsed ${products.length} products from Cree Lighting`);
        } catch (error) {
            this.log.error(`Failed to scrape Cree: ${error instanceof Error ? error.message : error}`);
            throw error;
        } finally {
            await browser.close();
        }

        return products;
    }
}
