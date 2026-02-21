/**
 * Signify / Philips Lighting Scraper
 *
 * Signify operates region-specific websites:
 *   US:     https://www.usa.lighting.philips.com/consumer/p
 *   Canada: https://www.canada.lighting.philips.com/consumer/p
 *
 * The product listings are server-side rendered with Nextjs.
 * We hit their internal search/facet API which returns JSON product data.
 *
 * A product found on the US site → state_province from ALL US states (via brandGeoConfig)
 * A product found on the Canada site → province from ALL CA provinces
 *
 * Geo note: Philips geo data is set PER PRODUCT based on which regional subdomain
 * it appears on — unlike the other brand scrapers which use brandGeoConfig for all.
 */
import axios from 'axios';
import { BaseScraper, type RawProduct } from './BaseScraper';
import { rateLimit, sleep } from '../utils/rateLimiter';

// Signify's internal search API endpoints (per region)
// These return JSON with product data from their Next.js data layer
const PHILIPS_REGIONS = [
    {
        country: 'USA' as const,
        currency: 'USD',
        apiBase: 'https://www.usa.lighting.philips.com/api/products/search',
        websiteBase: 'https://www.usa.lighting.philips.com',
    },
    {
        country: 'Canada' as const,
        currency: 'CAD',
        apiBase: 'https://www.canada.lighting.philips.com/api/products/search',
        websiteBase: 'https://www.canada.lighting.philips.com',
    },
];

// LED-relevant categories on Philips lighting site
const PHILIPS_CATEGORIES = [
    'led-bulbs',
    'led-tubes',
    'led-panels',
    'high-bay',
    'downlights',
    'outdoor-luminaires',
];

interface PhilipsApiProduct {
    name?: string;
    productNumber?: string;
    category?: string;
    url?: string;
    attributes?: Record<string, string | number>;
    pricing?: {
        price?: number;
        currency?: string;
    };
}

export class PhilipsScraper extends BaseScraper {
    async scrape(): Promise<RawProduct[]> {
        const products: RawProduct[] = [];
        const baseUrl = this.brandConfig.websiteUrl || 'https://www.usa.lighting.philips.com';

        // Determine which regions to scrape (configurable from DB)
        const regionOverride = this.brandConfig.scraperConfig?.regions as string[] | undefined;

        for (const region of PHILIPS_REGIONS) {
            // Skip if not in override list
            if (regionOverride && !regionOverride.includes(region.country)) continue;

            this.log.info(`Scraping Philips region: ${region.country}`);

            for (const category of PHILIPS_CATEGORIES) {
                let page = 0;
                const pageSize = 24;
                let hasMore = true;

                while (hasMore) {
                    await rateLimit(new URL(region.apiBase).hostname);

                    try {
                        const response = await axios.get<{
                            products?: PhilipsApiProduct[];
                            total?: number;
                        }>(region.apiBase, {
                            params: {
                                category,
                                page,
                                size: pageSize,
                                filter: 'led',
                            },
                            headers: {
                                'User-Agent':
                                    'BrightChoice-Bot/1.0 (competitive-intelligence; contact@brightchoice.app)',
                                Accept: 'application/json',
                                Referer: region.websiteBase,
                            },
                            timeout: 30000,
                        });

                        const items = response.data?.products || [];
                        if (items.length === 0) {
                            hasMore = false;
                            break;
                        }

                        for (const item of items) {
                            if (!item.name && !item.productNumber) continue;

                            // Skip duplicates across regional sites
                            const sku = item.productNumber || '';
                            if (sku && products.some((p) => p.sku === sku && p.geo?.country === region.country)) {
                                continue;
                            }

                            const attrs = item.attributes || {};
                            const specs: Record<string, string> = {};

                            // Map Philips attribute keys to our normalized names
                            const attrMap: Record<string, string> = {
                                wattage: 'Watts',
                                luminousFlux: 'Lumens',
                                colorTemperature: 'CCT',
                                colorRenderingIndex: 'CRI',
                                ratedLifetime: 'Lifespan',
                                warrantyPeriod: 'Warranty',
                                voltage: 'Voltage',
                                dimmable: 'Dimming',
                                ipCode: 'IP Rating',
                            };

                            for (const [attrKey, specKey] of Object.entries(attrMap)) {
                                if (attrs[attrKey] !== undefined) {
                                    specs[specKey] = String(attrs[attrKey]);
                                }
                            }

                            // Category mapping
                            let catLabel = 'Bulb';
                            const catStr = (item.category || category).toLowerCase();
                            if (catStr.includes('high') || catStr.includes('bay')) catLabel = 'High Bay';
                            else if (catStr.includes('panel') || catStr.includes('troffer')) catLabel = 'Panel';

                            if (item.pricing?.price) {
                                specs['List Price'] = String(item.pricing.price);
                            }

                            products.push({
                                model: item.name || item.productNumber || 'Unknown',
                                sku: sku || undefined,
                                category: catLabel,
                                productUrl: item.url
                                    ? new URL(item.url, region.websiteBase).toString()
                                    : undefined,
                                specs,
                                rawHtml: JSON.stringify(item),
                                // Tag with country from which regional subdomain this came from
                                geo: { country: region.country },
                            });
                        }

                        this.log.info(
                            `Philips ${region.country}/${category} page ${page}: ${items.length} items`
                        );

                        const total = response.data?.total ?? 0;
                        page++;
                        hasMore = page * pageSize < total && items.length === pageSize;
                    } catch (err) {
                        const msg = err instanceof Error ? err.message : String(err);
                        this.log.warn(
                            `Philips API error ${region.country}/${category} page ${page}: ${msg}`
                        );
                        hasMore = false;
                    }

                    await sleep(400); // Be polite
                }
            }
        }

        this.log.info(`Philips scrape complete — ${products.length} products total`);
        return products;
    }
}
