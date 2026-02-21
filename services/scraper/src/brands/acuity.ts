/**
 * Acuity Brands Scraper
 * 
 * Target: https://www.acuitybrands.com/products
 * The Acuity site uses a JS-rendered storefront powered by their product catalog API.
 * We use Playwright to render and extract products.
 * 
 * Real extraction approach:
 *  1. Navigate to the Lithonia/Acuity product listing API endpoint
 *  2. Parse the JSON response for product specs
 *  3. For LED products, map to our schema
 * 
 * Acuity Brands is a US company (HQ: Atlanta, GA) selling nationally across
 * all 50 US states + major Canadian provinces (via Distech Controls).
 * Geo data is provided by brandGeoConfig — no per-product geo extraction needed.
 */
import axios from 'axios';
import { BaseScraper, type RawProduct } from './BaseScraper';
import { rateLimit } from '../utils/rateLimiter';

// Acuity / Lithonia product search API (public, no auth required)
// Paginated, returns JSON with product specs
const ACUITY_API_BASE = 'https://www.acuitybrands.com/api/search/products';

// Category slugs for LED products we care about
const LED_CATEGORIES = [
    'led-commercial-luminaires',
    'led-industrial-highbay',
    'led-lamps-bulbs',
    'outdoor-led',
];

interface AcuityApiItem {
    name?: string;
    productNumber?: string;
    shortDescription?: string;
    category?: string;
    productFamilyUrl?: string;
    specifications?: {
        wattage?: string | number;
        lumens?: string | number;
        colorTemperature?: string | number;
        cri?: string | number;
        nominalLifeHours?: string | number;
        warranty?: string | number;
        voltage?: string;
        dimming?: string;
        ipRating?: string;
    };
    pricing?: {
        listPrice?: number;
        currency?: string;
    };
}

export class AcuityScraper extends BaseScraper {
    async scrape(): Promise<RawProduct[]> {
        const products: RawProduct[] = [];
        const baseUrl = this.brandConfig.websiteUrl || 'https://www.acuitybrands.com';

        // Override API URL from db config if provided
        const apiBase =
            (this.brandConfig.scraperConfig?.apiUrl as string) || ACUITY_API_BASE;
        const categories =
            (this.brandConfig.scraperConfig?.categories as string[]) || LED_CATEGORIES;

        for (const category of categories) {
            let page = 0;
            const pageSize = 50;
            let hasMore = true;

            this.log.info(`Scraping Acuity category: ${category}`);

            while (hasMore) {
                await rateLimit(new URL(baseUrl).hostname);

                try {
                    const response = await axios.get<{ items?: AcuityApiItem[]; totalCount?: number }>(
                        apiBase,
                        {
                            params: {
                                category,
                                page,
                                pageSize,
                                type: 'LED',
                            },
                            headers: {
                                'User-Agent':
                                    'BrightChoice-Bot/1.0 (competitive-intelligence; contact@brightchoice.app)',
                                Accept: 'application/json',
                                'X-Requested-With': 'XMLHttpRequest',
                            },
                            timeout: 30000,
                        }
                    );

                    const items = response.data?.items || [];
                    if (items.length === 0) {
                        hasMore = false;
                        break;
                    }

                    for (const item of items) {
                        if (!item.name && !item.productNumber) continue;

                        const specs: Record<string, string> = {};
                        const s = item.specifications;
                        if (s) {
                            if (s.wattage) specs['Watts'] = String(s.wattage);
                            if (s.lumens) specs['Lumens'] = String(s.lumens);
                            if (s.colorTemperature) specs['CCT'] = String(s.colorTemperature);
                            if (s.cri) specs['CRI'] = String(s.cri);
                            if (s.nominalLifeHours) specs['Lifespan'] = `${s.nominalLifeHours} hours`;
                            if (s.warranty) specs['Warranty'] = `${s.warranty} years`;
                            if (s.voltage) specs['Voltage'] = s.voltage;
                            if (s.dimming) specs['Dimming'] = s.dimming;
                            if (s.ipRating) specs['IP Rating'] = s.ipRating;
                        }

                        // Detect category label
                        let catLabel = 'Bulb';
                        const catLower = (item.category || category).toLowerCase();
                        if (catLower.includes('high') || catLower.includes('bay')) catLabel = 'High Bay';
                        else if (catLower.includes('panel') || catLower.includes('troffer')) catLabel = 'Panel';

                        // Price if available
                        if (item.pricing?.listPrice) {
                            specs['List Price'] = String(item.pricing.listPrice);
                        }

                        products.push({
                            model: item.name || item.productNumber || 'Unknown',
                            sku: item.productNumber,
                            category: catLabel,
                            productUrl: item.productFamilyUrl
                                ? new URL(item.productFamilyUrl, baseUrl).toString()
                                : undefined,
                            specs,
                            rawHtml: JSON.stringify(item),
                            // Geo note: Acuity is a US national brand.
                            // The orchestrator will expand rows per state via brandGeoConfig.
                            geo: { country: 'USA' },
                        });
                    }

                    this.log.info(
                        `Acuity ${category} page ${page}: got ${items.length} items (total so far: ${products.length})`
                    );

                    // Check if more pages exist
                    const total = response.data?.totalCount ?? 0;
                    page++;
                    hasMore = page * pageSize < total && items.length === pageSize;
                } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    this.log.warn(`Acuity API error for ${category} page ${page}: ${msg}`);
                    // If the API rejects with 404/403, stop this category gracefully
                    hasMore = false;
                }
            }
        }

        this.log.info(`Acuity scrape complete — ${products.length} products total`);
        return products;
    }
}
