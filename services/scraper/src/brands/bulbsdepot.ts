/**
 * BulbsDepotScraper
 * Scrapes bulbsdepot.com — a Magento-based multi-brand lighting retailer.
 * Location: 3915 Oak Street, Cincinnati, OH 45227
 * Crawls category listing pages, extracts product data, prices, and specs.
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseScraper, type RawProduct } from './BaseScraper';
import { rateLimit } from '../utils/rateLimiter';

// All leaf-level category URLs to crawl
const CATEGORY_URLS = [
    // Outdoor
    'outdoor-lighting/hazardous-location',
    'outdoor-lighting/post-top-lights',
    'outdoor-lighting/wall-packs',
    'outdoor-lighting/area-lights',
    'outdoor-lighting/vapor-proof',
    'outdoor-lighting/parking-garage',
    'outdoor-lighting/led-flood-lights',
    'outdoor-lighting/landscape',
    'outdoor-lighting/security',
    'outdoor-lighting/canopy-lighting',
    'outdoor-lighting/wall-mount',
    'outdoor-lighting/roadway',
    'outdoor-lighting/bollards',
    'outdoor-lighting/solar-lights',
    // Indoor
    'indoor-lighting/high-bay/linear',
    'indoor-lighting/high-bay/round',
    'indoor-lighting/led-downlights',
    'indoor-lighting/under-cabinet',
    'indoor-lighting/track-lighting',
    'indoor-lighting/emergency-exit-lights',
    'indoor-lighting/striplight',
    'indoor-lighting/troffers',
    'indoor-lighting/flat-panels',
    'indoor-lighting/linear',
    'indoor-lighting/dome',
    // LED Bulbs
    'led-bulbs/a-shape',
    'led-bulbs/br-r-shape',
    'led-bulbs/candelabra',
    'led-bulbs/globe',
    'led-bulbs/mr16-par',
    'led-bulbs/led-corn-bulbs',
    'led-bulbs/pl-lamps',
    'led-bulbs/t8-led-tubes',
    // Ballasts & Drivers
    'ballasts-drivers/led-drivers',
    'ballasts-drivers/fluorescent-ballasts',
];

// Map category URL segment → product category label
function categoryFromUrl(url: string): string {
    const seg = url.toLowerCase();
    if (seg.includes('high-bay')) return 'High Bay';
    if (seg.includes('downlight')) return 'Downlight';
    if (seg.includes('troffer')) return 'Troffer';
    if (seg.includes('flat-panel')) return 'Panel';
    if (seg.includes('flood')) return 'Flood Light';
    if (seg.includes('area-light')) return 'Area Light';
    if (seg.includes('wall-pack')) return 'Wall Pack';
    if (seg.includes('parking')) return 'Parking Structure';
    if (seg.includes('bollard')) return 'Bollard';
    if (seg.includes('canopy')) return 'Canopy';
    if (seg.includes('vapor')) return 'Vapor Tight';
    if (seg.includes('roadway')) return 'Street Light';
    if (seg.includes('linear') || seg.includes('strip')) return 'Linear';
    if (seg.includes('tube') || seg.includes('t8')) return 'Tube';
    if (seg.includes('corn')) return 'Bulb';
    if (seg.includes('led-bulb') || seg.includes('a-shape') || seg.includes('globe') || seg.includes('candelabra') || seg.includes('mr16') || seg.includes('br-r') || seg.includes('pl-lamp')) return 'Bulb';
    if (seg.includes('driver') || seg.includes('ballast')) return 'Specialty';
    if (seg.includes('emergency')) return 'Specialty';
    if (seg.includes('track')) return 'Track Light';
    if (seg.includes('dome')) return 'Surface Mount';
    if (seg.includes('under-cabinet')) return 'Linear';
    if (seg.includes('solar')) return 'Specialty';
    return 'Bulb';
}

// Extract brand from product title (first word or known brand pattern)
const KNOWN_BRANDS = [
    'Philips', 'GE', 'Sylvania', 'Westgate', 'Keystone', 'Eiko', 'Satco',
    'RAB', 'MaxLite', 'Lutron', 'Hatch', 'American Lighting', 'Cree',
    'TCP', 'Green Creative', 'Light Efficient Design', 'Halco', 'Topaz',
    'Venture', 'Bulbrite', 'Feit', 'Sunlite', 'NaturaLED', 'Toggled',
    'Howard', 'Universal', 'Advance', 'Sola', 'Hubbell', 'Lithonia',
];

function extractBrand(title: string): string {
    // Try known brands first (case-insensitive)
    for (const brand of KNOWN_BRANDS) {
        if (title.toLowerCase().startsWith(brand.toLowerCase())) {
            return brand;
        }
        // Also check "Brand Name MODEL"
        if (title.toLowerCase().includes(brand.toLowerCase() + ' ')) {
            return brand;
        }
    }
    // Check for "BrandName MFG" pattern (e.g. "Westgate MFG")
    const mfgMatch = title.match(/^(\w+)\s+MFG\b/i);
    if (mfgMatch) return mfgMatch[1];

    // Fallback: use first word
    return title.split(/\s+/)[0] || 'Unknown';
}

export class BulbsDepotScraper extends BaseScraper {
    private seenSkus = new Set<string>();

    private extractSpecsFromSummary(summary: string, title: string): Record<string, string> {
        const specs: Record<string, string> = {};
        const text = `${title} ${summary}`;

        // Watts
        const wattMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:W|Watt|Watts)\b/i);
        if (wattMatch) specs['Watts'] = wattMatch[1];

        // Lumens
        const lmMatch = text.match(/(\d{1,3}(?:,\d{3})+|\d{3,6})\s*(?:lm|lumen|lumens)\b/i);
        if (lmMatch) specs['Lumens'] = lmMatch[1].replace(/,/g, '');

        // CCT
        const cctMatch = text.match(/(\d{4,5})\s*K\b/i);
        if (cctMatch) specs['CCT'] = cctMatch[1] + 'K';

        // CRI
        const criMatch = text.match(/(\d{2,3})\s*CRI\b/i) || text.match(/CRI\s*(?:>|:|of)?\s*(\d{2,3})/i);
        if (criMatch) specs['CRI'] = criMatch[1];

        // Voltage
        const vMatch = text.match(/(\d{2,3}(?:-\d{2,3})?)\s*V(?:AC)?\b/i);
        if (vMatch) specs['Voltage'] = vMatch[1];

        // Beam angle
        const beamMatch = text.match(/(\d{2,3})\s*degree/i);
        if (beamMatch) specs['BeamAngle'] = beamMatch[1];

        // Base type
        const baseMatch = text.match(/\b(E26|E39|GU24|GU10|G13|G24|Mogul|Medium)\b/i);
        if (baseMatch) specs['Base'] = baseMatch[1].toUpperCase();

        // Certifications
        if (/energy\s*star/i.test(text)) specs['cert_energy_star'] = 'true';
        if (/\bDLC\b/.test(text)) specs['cert_dlc'] = 'true';
        if (/\bUL\b/.test(text)) specs['cert_ul'] = 'true';

        return specs;
    }

    private async scrapeCategoryPage(categoryPath: string, pageNum: number): Promise<{
        products: RawProduct[];
        hasMore: boolean;
    }> {
        const baseUrl = 'https://www.bulbsdepot.com';
        const url = `${baseUrl}/${categoryPath}.html?p=${pageNum}&product_list_limit=48`;
        const category = categoryFromUrl(categoryPath);

        await rateLimit('www.bulbsdepot.com');

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml',
            },
            timeout: 30000,
        });

        const $ = cheerio.load(response.data);
        const products: RawProduct[] = [];

        // Each product in listing
        $('li.product-item, .product-item').each((_i, el) => {
            const $el = $(el);

            // Product name
            const titleEl = $el.find('a.product-item-link, .product-item-link');
            const title = titleEl.text().trim();
            if (!title) return;

            // Product URL
            const productUrl = titleEl.attr('href') || '';

            // SKU from URL slug or data attribute
            const sku = productUrl.split('/').pop()?.replace('.html', '') || title.replace(/\s+/g, '-').toLowerCase();

            // Avoid duplicates
            if (this.seenSkus.has(sku)) return;
            this.seenSkus.add(sku);

            // Price
            const specialPrice = $el.find('.special-price .price').first().text().trim();
            const regularPrice = $el.find('.old-price .price, .regular-price .price, .price').first().text().trim();
            const priceStr = specialPrice || regularPrice || '';
            const priceVal = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;

            // Short description / spec summary
            const descEl = $el.find('.product-item-description, .product-item-inner .product description');
            const summary = descEl.text().trim();

            // Extract brand
            const brand = extractBrand(title);

            // Extract specs
            const specs = this.extractSpecsFromSummary(summary, title);
            if (priceVal > 0) specs['Price'] = String(priceVal);

            products.push({
                model: title,
                sku,
                category,
                productUrl,
                specs,
                rawHtml: JSON.stringify({ title, productUrl, priceStr, summary }),
                geo: { country: 'USA', state_province: 'OH' },
            });
        });

        // Check if there's a next page
        const hasNext = $('a.action.next, .pages-item-next a').length > 0;

        return { products, hasMore: hasNext };
    }

    async scrape(): Promise<RawProduct[]> {
        const allProducts: RawProduct[] = [];
        this.seenSkus.clear();

        this.log.info(`BulbsDepot Scraper: crawling ${CATEGORY_URLS.length} categories`);

        for (const catPath of CATEGORY_URLS) {
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                try {
                    const result = await this.scrapeCategoryPage(catPath, page);
                    allProducts.push(...result.products);
                    hasMore = result.hasMore;

                    this.log.info(`  ${catPath} p${page}: ${result.products.length} items (total: ${allProducts.length})`);

                    if (hasMore) page++;
                } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    this.log.warn(`  ${catPath} p${page} error: ${msg}`);
                    hasMore = false;
                }
            }
        }

        this.log.info(`BulbsDepot scrape complete — ${allProducts.length} products total`);
        return allProducts;
    }
}
