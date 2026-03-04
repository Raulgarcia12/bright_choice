/**
 * GreenLightingScraper
 * Scrapes ALL products from greenlightingwholesale.com (Shopify store).
 * Location: 405 S 22nd St, Heath, OH 43056
 * Uses the Shopify /products.json API to get the entire catalog across all brands.
 * Extracts actual product brand from title (MaxLite, Lithonia, Eaton, etc.).
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseScraper, type RawProduct } from './BaseScraper';
import { rateLimit } from '../utils/rateLimiter';

// Known brands to extract from product titles
const KNOWN_BRANDS = [
    'MaxLite', 'Lithonia', 'Eaton', 'RAB', 'Cree', 'Philips', 'GE',
    'Sylvania', 'Keystone', 'TCP', 'Satco', 'Halco', 'NaturaLED',
    'Westgate', 'Topaz', 'Sunlite', 'Howard', 'Hatch', 'Lutron',
    'Feit', 'Bulbrite', 'Green Creative', 'Light Efficient Design',
    'American Lighting', 'Cooper', 'Hubbell', 'Acuity', 'Toggled',
    'Universal', 'Advance', 'Sola', 'Big Ass Fans', 'Arctic Chill',
    'Venture', 'Energetic', 'Archipelago', 'Ecosmart',
];

function extractBrand(title: string, vendor?: string): string {
    // Try vendor field first (Shopify stores often have this)
    if (vendor) {
        const vendorClean = vendor.trim();
        const match = KNOWN_BRANDS.find(b => b.toLowerCase() === vendorClean.toLowerCase());
        if (match) return match;
    }

    // Try matching from title
    const titleLower = title.toLowerCase();
    for (const brand of KNOWN_BRANDS) {
        if (titleLower.startsWith(brand.toLowerCase() + ' ') ||
            titleLower.startsWith(brand.toLowerCase() + '-') ||
            titleLower.includes(' ' + brand.toLowerCase() + ' ')) {
            return brand;
        }
    }

    // Check for "Brand MFG" pattern
    const mfgMatch = title.match(/^(\w+)\s+MFG\b/i);
    if (mfgMatch) return mfgMatch[1];

    // Fallback: unknown brand
    return 'Other';
}

// Exported with original name for backward compatibility
export class MaxLiteScraper extends BaseScraper {
    private extractSpecs(text: string, title: string): Record<string, string> {
        const specs: Record<string, string> = {};

        // Convert html to plain text
        const $ = cheerio.load(text);
        const plainText = $.text().replace(/\s+/g, ' ');

        const fullText = title + ' ' + plainText;

        // Watts: "18 Watt", "10W/18W/23W", "10W"
        const wattMatch = fullText.match(/(\d+(?:\.\d+)?)\s*(?:W|Watt|Watts)\b/i);
        if (wattMatch) specs['Watts'] = wattMatch[1];

        // Lumens: "2000 lumens" or "2,000 lm"
        const lmMatch = fullText.match(/(\d{1,3}(?:,\d{3})+|\d{4,5})\s*(?:lm|lumens|Lumen)\b/i);
        if (lmMatch) specs['Lumens'] = lmMatch[1].replace(/,/g, '');

        // CCT: "2700K", "3000K/4000K/5000K"
        const cctMatch = fullText.match(/(?:2700|3000|3500|4000|5000|6000|6500)K(?:\s*\/\s*(?:2700|3000|3500|4000|5000|6000|6500)K)*/ig);
        if (cctMatch) specs['CCT'] = cctMatch[0].split('/')[0].replace('K', '').replace('k', '') + 'K';

        // CRI: "90CRI", "CRI > 80", "CRI: 90" (ignoring 30CRI match bugs by demanding >=70)
        const criMatch = fullText.match(/CRI\s*(?:>|:|-|is)?\s*([789]\d)/i) || fullText.match(/([789]\d)CRI/i) || fullText.match(/([789]\d)\s*CRI/i);
        if (criMatch) specs['CRI'] = criMatch[1];

        // Lifespan
        const lifeMatch = fullText.match(/(\d{2,3}(?:,\d{3})+)\s*(?:hours|hrs|hr)/i) ||
            fullText.match(/L70[^\d]*(\d{2,3}(?:,\d{3})+)/i);
        if (lifeMatch) specs['Lifespan'] = lifeMatch[1] + ' hours';

        // Warranty
        const warMatch = fullText.match(/(\d+)\s*(?:year|yr)\s*(?:limited\s*)?warranty/i);
        if (warMatch) specs['Warranty'] = warMatch[1] + ' years';

        // Voltage
        const vMatch = fullText.match(/(\d{3}(?:-\d{3})?)\s*(?:V|VAC|Volts)\b/i);
        if (vMatch) specs['Voltage'] = vMatch[1];

        // Certifications parsing from tags or body
        if (fullText.match(/energy star|energystar/i)) specs['cert_energy_star'] = 'true';
        if (fullText.match(/dlc/i)) specs['cert_dlc'] = 'true';
        if (fullText.match(/ul\s*(?:listed)?/i)) specs['cert_ul'] = 'true';

        return specs;
    }

    async scrape(): Promise<RawProduct[]> {
        const products: RawProduct[] = [];
        const seenSkus = new Set<string>();
        const baseUrl = 'https://greenlightingwholesale.com';

        let page = 1;
        const limit = 250;
        let hasMore = true;

        this.log.info(`Scraping ALL products from ${baseUrl} (full catalog)`);

        while (hasMore) {
            await rateLimit(new URL(baseUrl).hostname);

            try {
                // Use /products.json to get ALL products, not just one collection
                const url = `${baseUrl}/products.json?limit=${limit}&page=${page}`;
                const response = await axios.get(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                    timeout: 20000
                });

                const items = response.data?.products || [];
                if (items.length === 0) {
                    hasMore = false;
                    break;
                }

                for (const item of items) {
                    const sku = item.variants?.[0]?.sku || item.handle;

                    // Filter duplicates
                    if (seenSkus.has(sku)) continue;
                    seenSkus.add(sku);

                    // Extract actual brand from title or vendor field
                    const brand = extractBrand(item.title || '', item.vendor);

                    // Categorize
                    let catLabel = 'Bulb';
                    const fullTextLower = `${item.title} ${item.product_type} ${item.tags?.join(' ')}`.toLowerCase();
                    if (fullTextLower.includes('high bay') || fullTextLower.includes('highbay')) catLabel = 'High Bay';
                    else if (fullTextLower.includes('panel') || fullTextLower.includes('troffer') || fullTextLower.includes('flat panel')) catLabel = 'Panel';
                    else if (fullTextLower.includes('downlight') || fullTextLower.includes('recessed')) catLabel = 'Downlight';
                    else if (fullTextLower.includes('tube') || fullTextLower.includes('t8') || fullTextLower.includes('t5')) catLabel = 'Linear';
                    else if (fullTextLower.includes('flood')) catLabel = 'Flood Light';
                    else if (fullTextLower.includes('wall pack')) catLabel = 'Wall Pack';
                    else if (fullTextLower.includes('area light')) catLabel = 'Area Light';
                    else if (fullTextLower.includes('canopy')) catLabel = 'Canopy';
                    else if (fullTextLower.includes('bollard')) catLabel = 'Bollard';
                    else if (fullTextLower.includes('strip') || fullTextLower.includes('linear')) catLabel = 'Linear';
                    else if (fullTextLower.includes('exit') || fullTextLower.includes('emergency')) catLabel = 'Specialty';
                    else if (fullTextLower.includes('vapor') || fullTextLower.includes('wet')) catLabel = 'Vapor Tight';
                    else if (fullTextLower.includes('street') || fullTextLower.includes('roadway') || fullTextLower.includes('cobra')) catLabel = 'Street Light';
                    else if (fullTextLower.includes('parking')) catLabel = 'Parking Structure';
                    else if (fullTextLower.includes('retrofit')) catLabel = 'Retrofit';
                    else if (fullTextLower.includes('track')) catLabel = 'Track Light';
                    else if (fullTextLower.includes('sport')) catLabel = 'Flood Light';
                    else if (fullTextLower.includes('fan')) catLabel = 'Specialty';
                    else if (fullTextLower.includes('surface') || fullTextLower.includes('flush')) catLabel = 'Surface Mount';
                    else if (fullTextLower.includes('sconce') || fullTextLower.includes('decorative') || fullTextLower.includes('vanity')) catLabel = 'Specialty';

                    // Extract specs from body HTML
                    const specs = this.extractSpecs(item.body_html || '', item.title || '');

                    // Store the extracted brand and seller in specs for the orchestrator
                    specs['brand_override'] = brand;
                    specs['seller_name'] = 'Green Lighting Wholesale';

                    // Extract price from first variant
                    const price = parseFloat(item.variants?.[0]?.price || '0');
                    if (price > 0) specs['Price'] = String(price);

                    products.push({
                        model: item.title,
                        sku: sku,
                        category: catLabel,
                        productUrl: `${baseUrl}/products/${item.handle}`,
                        specs,
                        rawHtml: JSON.stringify(item),
                        geo: { country: 'USA', state_province: 'OH' },
                    });
                }

                this.log.info(`GLW page ${page}: got ${items.length} items (total: ${products.length})`);

                if (items.length < limit) {
                    hasMore = false;
                } else {
                    page++;
                }

            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                this.log.warn(`GLW Scraper API error page ${page}: ${msg}`);
                hasMore = false;
            }
        }

        this.log.info(`Green Lighting Wholesale scrape complete — ${products.length} products total`);
        return products;
    }
}
