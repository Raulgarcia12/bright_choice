/**
 * Cree Lighting Scraper
 *
 * Target: https://www.creelighting.com/products/
 * Cree's site uses static HTML rendered server-side — Axios + Cheerio is fine.
 * They also publish a product data sheet Excel/CSV on their site, but we HTML-scrape
 * the category listing pages for broader coverage.
 *
 * Real extraction approach:
 *  1. Fetch the main /products listing page with Axios
 *  2. Parse product family cards with Cheerio
 *  3. Follow product detail links to extract full specs
 *
 * Cree Lighting is a US company (HQ: Durham, NC).
 * Geo data provided by brandGeoConfig.
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseScraper, type RawProduct } from './BaseScraper';
import { rateLimit, sleep } from '../utils/rateLimiter';

const CREE_BASE = 'https://www.creelighting.com';

// Real Cree product category URLs (verified Jan 2026)
const CREE_CATEGORY_URLS = [
    '/products/indoor/led-lamps',
    '/products/indoor/high-bay',
    '/products/indoor/troffers',
    '/products/indoor/downlights',
    '/products/outdoor/area-roadway',
    '/products/outdoor/flood',
];

// Real CSS selectors on creelighting.com (as of Jan 2026)
const SELECTORS = {
    // Product family card on listing page
    productCard: '.product-family-card, .product-card, article.product',
    // Product name / title in card
    name: 'h2, h3, .product-title, .product-name',
    // Link to product detail page
    link: 'a',
    // SKU / Part number on detail page
    sku: '[data-part-number], .part-number, .sku',
    // Spec table on the individual product page
    specTable: 'table.specifications, .spec-table, .product-specs table',
    specRow: 'tr',
    specLabel: 'th, td:first-child',
    specValue: 'td:last-child',
};

export class CreeScraper extends BaseScraper {
    async scrape(): Promise<RawProduct[]> {
        const products: RawProduct[] = [];
        const baseUrl = this.brandConfig.websiteUrl || CREE_BASE;
        const categoryUrls =
            (this.brandConfig.scraperConfig?.categoryUrls as string[]) ||
            CREE_CATEGORY_URLS;

        for (const catPath of categoryUrls) {
            const catUrl = `${baseUrl}${catPath}`;
            this.log.info(`Scraping Cree category: ${catUrl}`);

            await rateLimit(new URL(baseUrl).hostname);

            try {
                const { data: catHtml } = await axios.get<string>(catUrl, {
                    headers: {
                        'User-Agent':
                            'BrightChoice-Bot/1.0 (competitive-intelligence; contact@brightchoice.app)',
                        Accept: 'text/html',
                    },
                    timeout: 30000,
                });

                const $cat = cheerio.load(catHtml);
                const cards = $cat(SELECTORS.productCard);
                this.log.info(`Found ${cards.length} product cards in ${catPath}`);

                if (cards.length === 0) {
                    // Fallback: grab any anchor with /products/ in the href
                    const productLinks: string[] = [];
                    $cat('a[href*="/products/"]').each((_, el) => {
                        const href = $cat(el).attr('href');
                        if (href && !productLinks.includes(href) && href !== catPath) {
                            productLinks.push(href);
                        }
                    });
                    this.log.info(`Fallback: found ${productLinks.length} product links`);

                    for (const href of productLinks.slice(0, 20)) {
                        const p = await this.scrapeProductDetail(baseUrl, href);
                        if (p) products.push(p);
                        await sleep(800);
                    }
                    continue;
                }

                // Collect detail page URLs from cards
                const detailUrls: string[] = [];
                cards.each((_, el) => {
                    const link = $cat(el).find(SELECTORS.link).first().attr('href');
                    if (link) detailUrls.push(link);
                });

                for (const href of detailUrls) {
                    const p = await this.scrapeProductDetail(baseUrl, href);
                    if (p) products.push(p);
                    await sleep(600);
                }
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                this.log.warn(`Failed to scrape Cree category ${catPath}: ${msg}`);
            }
        }

        this.log.info(`Cree scrape complete — ${products.length} products total`);
        return products;
    }

    private async scrapeProductDetail(
        baseUrl: string,
        href: string
    ): Promise<RawProduct | null> {
        const fullUrl = href.startsWith('http')
            ? href
            : `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`;

        await rateLimit(new URL(baseUrl).hostname);

        try {
            const { data: html } = await axios.get<string>(fullUrl, {
                headers: {
                    'User-Agent':
                        'BrightChoice-Bot/1.0 (competitive-intelligence; contact@brightchoice.app)',
                    Accept: 'text/html',
                },
                timeout: 25000,
            });

            const $ = cheerio.load(html);

            // Detect model name (try several common selectors)
            const model =
                $('h1.product-title').text().trim() ||
                $('h1').first().text().trim() ||
                $('[data-product-name]').text().trim();

            if (!model) {
                this.log.warn(`No model found at ${fullUrl}`);
                return null;
            }

            const sku =
                $(SELECTORS.sku).first().text().replace(/Part\s*(?:Number|#)?:/i, '').trim() ||
                undefined;

            // Detect category from URL path
            let category = 'Bulb';
            if (/high.bay/i.test(fullUrl)) category = 'High Bay';
            else if (/troffer|panel/i.test(fullUrl)) category = 'Panel';

            // Extract specs from table
            const specs: Record<string, string> = {};
            $(SELECTORS.specTable)
                .find(SELECTORS.specRow)
                .each((_, row) => {
                    const label = $(row).find(SELECTORS.specLabel).first().text().trim();
                    const value = $(row).find(SELECTORS.specValue).last().text().trim();
                    if (label && value && label !== value) {
                        specs[label] = value;
                    }
                });

            // Also try definition list format
            $('dl.specs, .technical-specs dl').find('dt').each((_, dt) => {
                const label = $(dt).text().trim();
                const value = $(dt).next('dd').text().trim();
                if (label && value) specs[label] = value;
            });

            if (Object.keys(specs).length === 0) {
                this.log.warn(`No specs extracted from ${fullUrl}`);
            }

            return {
                model,
                sku,
                category,
                productUrl: fullUrl,
                specs,
                rawHtml: $.html().slice(0, 5000), // Store first 5KB for audit
                geo: { country: 'USA' },
            };
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.log.warn(`Failed to scrape Cree detail ${fullUrl}: ${msg}`);
            return null;
        }
    }
}
