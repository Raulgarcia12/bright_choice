/**
 * Acuity Brands Scraper
 * Scrapes product data from Acuity Brands (acuitybrands.com).
 * Uses Axios + Cheerio for static product listing pages.
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseScraper, type RawProduct } from './BaseScraper';
import { rateLimit } from '../utils/rateLimiter';

export class AcuityScraper extends BaseScraper {
    async scrape(): Promise<RawProduct[]> {
        const products: RawProduct[] = [];
        const baseUrl = this.brandConfig.websiteUrl;
        const catalogUrl = (this.brandConfig.scraperConfig?.catalogUrl as string) || `${baseUrl}/products`;

        this.log.info(`Fetching catalog from ${catalogUrl}`);

        let pageNum = 1;
        const maxPages = 15; // Target ~500 products if 30-40 per page
        let hasMore = true;

        try {
            while (hasMore && pageNum <= maxPages) {
                const pagedUrl = pageNum === 1 ? catalogUrl : `${catalogUrl}?page=${pageNum}`;
                this.log.info(`Fetching catalog page ${pageNum} from ${pagedUrl}`);

                await rateLimit(new URL(baseUrl).hostname);

                const response = await axios.get(pagedUrl, {
                    headers: {
                        'User-Agent': 'BrightChoice-Bot/1.0 (competitive-intelligence; contact@brightchoice.app)',
                        'Accept': 'text/html',
                    },
                    timeout: 30000,
                });

                const $ = cheerio.load(response.data);
                const productSelector = (this.brandConfig.scraperConfig?.productSelector as string) || '.product-card';
                const nameSelector = (this.brandConfig.scraperConfig?.nameSelector as string) || '.product-name';
                const specSelector = (this.brandConfig.scraperConfig?.specSelector as string) || '.product-specs li';

                const productsOnPage = $(productSelector).length;
                if (productsOnPage === 0) {
                    hasMore = false;
                    break;
                }

                $(productSelector).each((_, el) => {
                    const $el = $(el);
                    const model = $el.find(nameSelector).text().trim();

                    if (!model) return;

                    const specs: Record<string, string> = {};
                    $el.find(specSelector).each((__, specEl) => {
                        const text = $(specEl).text().trim();
                        const [key, ...valueParts] = text.split(':');
                        if (key && valueParts.length > 0) {
                            specs[key.trim()] = valueParts.join(':').trim();
                        }
                    });

                    const productUrl = $el.find('a').attr('href');

                    products.push({
                        model,
                        sku: $el.attr('data-sku') || undefined,
                        category: $el.attr('data-category') || undefined,
                        productUrl: productUrl ? new URL(productUrl, baseUrl).toString() : undefined,
                        specs,
                        rawHtml: $.html(el),
                    });
                });

                this.log.info(`Page ${pageNum}: Found ${productsOnPage} products. Total so far: ${products.length}`);
                pageNum++;

                // If the last page had very few products, it's likely the end
                if (productsOnPage < 5) hasMore = false;
            }

            this.log.info(`Finished Acuity scrape. Total products: ${products.length}`);
        } catch (error) {
            this.log.error(`Failed to scrape Acuity: ${error instanceof Error ? error.message : error}`);
            throw error;
        }

        return products;
    }
}
