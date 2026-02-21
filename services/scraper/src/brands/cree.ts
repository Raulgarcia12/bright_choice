/**
 * Cree Lighting Scraper
 *
 * Target: https://www.creelighting.com/products/
 * Built with Gatsby (SSR). Product family cards on listing pages have
 * inline spec summaries (Lumen Output, Wattage) plus links to detail pages.
 * Detail pages do NOT have HTML spec tables — specs are in PDF ordering matrices.
 *
 * Strategy:
 *  1. Fetch each real product sub-category page (troffers, high-bay, etc.)
 *  2. Parse the SSR HTML for product family links and inline specs
 *  3. Extract Lumen Output and Wattage from the card text
 *  4. Follow the detail page link to get the full product title (h1)
 *
 * Cree Lighting is a US company (HQ: Durham, NC).
 * Geo data provided by brandGeoConfig.
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseScraper, type RawProduct } from './BaseScraper';
import { rateLimit, sleep } from '../utils/rateLimiter';

const CREE_BASE = 'https://www.creelighting.com';

// Real working sub-category URLs on creelighting.com (verified Feb 2026)
const CREE_CATEGORY_URLS = [
    // Indoor
    '/products/indoor/troffers/',
    '/products/indoor/high-bay-low-bay/',
    '/products/indoor/specification-linear/',
    '/products/indoor/surface-ambient/',
    '/products/indoor/new-construction-downlights/',
    '/products/indoor/retrofit-downlights/',
    '/products/indoor/dynamic-skylight/',
    // Outdoor
    '/products/outdoor/area/',
    '/products/outdoor/canopy-and-soffit/',
    '/products/outdoor/street-and-roadway/',
    '/products/outdoor/parking-structure/',
    '/products/outdoor/bollards-and-pathway/',
    '/products/outdoor/flood/',
    '/products/outdoor/wall-mount/',
    '/products/outdoor/vapor-tight/',
];

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
                const { data: html } = await axios.get<string>(catUrl, {
                    headers: {
                        'User-Agent':
                            'BrightChoice-Bot/1.0 (competitive-intelligence; contact@brightchoice.app)',
                        Accept: 'text/html',
                    },
                    timeout: 30000,
                });

                const $ = cheerio.load(html);

                // Detect the category name from the H1
                const categoryName = $('h1').first().text().trim() || catPath;
                let catLabel = this.inferCategory(catPath);

                // Find all product family detail links on the page
                // Cree uses links like /products/indoor/troffers/flex-series-square-lens/
                // These are deeper than the category URL itself (have an extra path segment)
                const catPathClean = catPath.replace(/\/$/, '');
                const productLinks: Array<{ href: string; cardText: string }> = [];

                $('a').each((_, el) => {
                    const href = $(el).attr('href');
                    if (!href) return;

                    // Must start with the current category path and go one level deeper
                    if (
                        href.startsWith(catPathClean + '/') &&
                        href !== catPath &&
                        href !== catPathClean + '/' &&
                        !href.includes('#') &&
                        !href.includes('?')
                    ) {
                        // Only add unique links
                        if (!productLinks.some((p) => p.href === href)) {
                            // Grab surrounding text for inline specs
                            const parent = $(el).closest('div, article, section, li');
                            const cardText = parent.length > 0 ? parent.text() : $(el).text();
                            productLinks.push({ href, cardText });
                        }
                    }
                });

                this.log.info(
                    `Found ${productLinks.length} product family links in ${catPath}`
                );

                for (const { href, cardText } of productLinks) {
                    try {
                        // Extract inline specs from the card text
                        const inlineSpecs = this.extractInlineSpecs(cardText);

                        // Fetch the detail page for the proper H1 title
                        const fullUrl = href.startsWith('http')
                            ? href
                            : `${baseUrl}${href}`;

                        await rateLimit(new URL(baseUrl).hostname);

                        const { data: detailHtml } = await axios.get<string>(fullUrl, {
                            headers: {
                                'User-Agent':
                                    'BrightChoice-Bot/1.0 (competitive-intelligence; contact@brightchoice.app)',
                                Accept: 'text/html',
                            },
                            timeout: 25000,
                        });

                        const $d = cheerio.load(detailHtml);
                        const model = $d('h1').first().text().trim();

                        if (!model) {
                            this.log.warn(`No h1 model title found at ${fullUrl}`);
                            continue;
                        }

                        // Skip if it's a generic category title we already have
                        if (products.some((p) => p.model === model)) continue;

                        // Try to extract additional specs from the detail page text
                        const fullPageText = $d('body').text();
                        const detailSpecs = this.extractInlineSpecs(fullPageText);

                        // Merge: detail page specs override listing page specs
                        const specs = { ...inlineSpecs, ...detailSpecs };

                        products.push({
                            model,
                            sku: undefined,
                            category: catLabel,
                            productUrl: fullUrl,
                            specs,
                            rawHtml: detailHtml.slice(0, 3000),
                            geo: { country: 'USA' },
                        });

                        this.log.info(
                            `✓ ${model} — ${Object.keys(specs).length} specs extracted`
                        );
                    } catch (err) {
                        const msg = err instanceof Error ? err.message : String(err);
                        this.log.warn(`Failed detail page ${href}: ${msg}`);
                    }

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

    /**
     * Extract specs from inline text on Cree's Gatsby-rendered cards.
     * Example text: "FLEX Series Square LensTroffersLumen Output: 2,600 - 10,000 L Wattage: 18 - 82 W"
     */
    private extractInlineSpecs(text: string): Record<string, string> {
        const specs: Record<string, string> = {};

        // Lumen Output: 2,600 - 10,000 L  or  Lumens: 5,000
        const lumensMatch = text.match(
            /(?:Lumen\s*Output|Lumens?|Delivered\s*Lumens)\s*[:=]\s*([\d,.\-–\s]+)\s*(?:L|lm)?/i
        );
        if (lumensMatch) {
            // Take the max value from a range like "2,600 - 10,000"
            const nums = lumensMatch[1].replace(/,/g, '').match(/[\d.]+/g);
            if (nums && nums.length > 0) {
                specs['Lumens'] = nums[nums.length - 1]; // max value
            }
        }

        // Wattage: 18 - 82 W  or  Watts: 50W
        const wattsMatch = text.match(
            /(?:Wattage|Watts?|System\s*Wattage)\s*[:=]\s*([\d,.\-–\s]+)\s*W?/i
        );
        if (wattsMatch) {
            const nums = wattsMatch[1].replace(/,/g, '').match(/[\d.]+/g);
            if (nums && nums.length > 0) {
                specs['Watts'] = nums[nums.length - 1]; // max value
            }
        }

        // CCT: 3000K, 3500K, 4000K, 5000K  or  Color Temperature: 4000K
        const cctMatch = text.match(
            /(?:CCT|Color\s*Temp(?:erature)?)\s*[:=]\s*([\d,K°\s\-–/]+)/i
        );
        if (cctMatch) {
            const nums = cctMatch[1].match(/\d{3,5}/g);
            if (nums && nums.length > 0) {
                specs['CCT'] = nums[0]; // first / typical
            }
        }

        // CRI: ≥80  or  CRI: 90+
        const criMatch = text.match(/CRI\s*[:=≥>]\s*(\d{2,3})/i);
        if (criMatch) {
            specs['CRI'] = criMatch[1];
        }

        // Lifetime / Life: 60,000 hours  or  L70 Lifetime: 100,000
        const lifeMatch = text.match(
            /(?:Life(?:time)?|L70|Rated\s*Life)\s*[:=]\s*([\d,]+)\s*(?:hours?|hrs?)?/i
        );
        if (lifeMatch) {
            specs['Lifespan'] = lifeMatch[1].replace(/,/g, '') + ' hours';
        }

        // Warranty: 10-year  or  Warranty: 5 years
        const warrantyMatch = text.match(
            /Warranty\s*[:=]\s*(\d+)\s*[-–]?\s*(?:year|yr)/i
        );
        if (warrantyMatch) {
            specs['Warranty'] = warrantyMatch[1] + ' years';
        }

        // IP rating: IP65, IP66
        const ipMatch = text.match(/(?:IP\s*(?:Rating|Code)?\s*[:=]?\s*)(IP\d{2})/i);
        if (ipMatch) {
            specs['IP Rating'] = ipMatch[1];
        }

        // Certifications: UL, DLC, ENERGY STAR
        if (/\bUL\b/.test(text)) specs['cert_ul'] = 'true';
        if (/\bDLC\b/.test(text)) specs['cert_dlc'] = 'true';
        if (/ENERGY\s*STAR/i.test(text)) specs['cert_energy_star'] = 'true';

        return specs;
    }

    /** Map URL path to our product category labels */
    private inferCategory(catPath: string): string {
        const p = catPath.toLowerCase();
        if (p.includes('troffer')) return 'Panel';
        if (p.includes('high-bay') || p.includes('low-bay')) return 'High Bay';
        if (p.includes('linear') || p.includes('strip')) return 'Linear';
        if (p.includes('downlight')) return 'Downlight';
        if (p.includes('flood')) return 'Flood Light';
        if (p.includes('area') || p.includes('roadway') || p.includes('street'))
            return 'Area Light';
        if (p.includes('canopy') || p.includes('soffit')) return 'Canopy';
        if (p.includes('parking')) return 'Parking Structure';
        if (p.includes('bollard') || p.includes('pathway')) return 'Bollard';
        if (p.includes('wall')) return 'Wall Pack';
        if (p.includes('vapor')) return 'Vapor Tight';
        if (p.includes('surface') || p.includes('ambient')) return 'Surface Mount';
        if (p.includes('skylight') || p.includes('dynamic')) return 'Specialty';
        return 'Bulb';
    }
}
