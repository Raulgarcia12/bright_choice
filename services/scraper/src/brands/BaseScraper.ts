/**
 * BaseScraper
 * Abstract base class for all brand-specific scrapers.
 * Each brand scraper extends this and implements scrape() and parse().
 */
import { logger } from '../utils/logger';
import { rateLimit, sleep } from '../utils/rateLimiter';
import { config } from '../config';

/** Represents a single scraped product before normalization */
export interface RawProduct {
    model: string;
    sku?: string;
    category?: string;
    productUrl?: string;
    specs: Record<string, string>;
    rawHtml?: string;
    /** Optional geo hint extracted from the source page */
    geo?: {
        /** Country the product page targets */
        country?: 'USA' | 'Canada';
        /** Specific US state or Canadian province from the page (e.g. 'TX') */
        state_province?: string;
        /** If the page indicates a specific set of markets */
        available_in?: string[];
    };
}

/** Represents brand configuration from the database */
export interface BrandConfig {
    id: string;
    name: string;
    websiteUrl: string;
    scraperConfig: Record<string, unknown>;
}

export abstract class BaseScraper {
    protected brandConfig: BrandConfig;
    protected log: typeof logger;

    constructor(brandConfig: BrandConfig) {
        this.brandConfig = brandConfig;
        this.log = logger.child({ brand: brandConfig.name });
    }

    /** Must be implemented by each brand scraper - fetches raw data from the website */
    abstract scrape(): Promise<RawProduct[]>;

    /** Executes the scraper with retry logic */
    async execute(): Promise<RawProduct[]> {
        const maxRetries = config.scraper.maxRetries;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.log.info(`Starting scrape (attempt ${attempt}/${maxRetries})`);

                // Rate-limit requests to the domain
                const domain = new URL(this.brandConfig.websiteUrl).hostname;
                await rateLimit(domain);

                const products = await this.scrape();
                this.log.info(`Scrape completed: ${products.length} products found`);
                return products;
            } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                this.log.error(`Scrape attempt ${attempt} failed: ${err.message}`);

                if (attempt < maxRetries) {
                    const backoff = Math.pow(2, attempt) * 1000;
                    this.log.info(`Retrying in ${backoff}ms...`);
                    await sleep(backoff);
                } else {
                    this.log.error(`All ${maxRetries} attempts failed. Giving up.`);
                    throw err;
                }
            }
        }

        return []; // Unreachable, but satisfies TypeScript
    }
}
