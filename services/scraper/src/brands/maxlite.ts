import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseScraper, type RawProduct } from './BaseScraper';
import { rateLimit } from '../utils/rateLimiter';

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
        const baseUrl = 'https://greenlightingwholesale.com';

        let page = 1;
        const limit = 250;
        let hasMore = true;

        this.log.info(`Scraping MaxLite from ${baseUrl}`);

        while (hasMore) {
            await rateLimit(new URL(baseUrl).hostname);

            try {
                const url = `${baseUrl}/collections/maxlite/products.json?limit=${limit}&page=${page}`;
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
                    if (products.some(p => p.sku === sku)) continue;

                    let catLabel = 'Bulb';
                    const fullTextLower = `${item.title} ${item.product_type} ${item.tags?.join(' ')}`.toLowerCase();
                    if (fullTextLower.includes('high bay') || fullTextLower.includes('highbay')) catLabel = 'High Bay';
                    else if (fullTextLower.includes('panel') || fullTextLower.includes('troffer')) catLabel = 'Panel';
                    else if (fullTextLower.includes('downlight')) catLabel = 'Downlight';
                    else if (fullTextLower.includes('tube') || fullTextLower.includes('t8') || fullTextLower.includes('t5')) catLabel = 'Tube';

                    const specs = this.extractSpecs(item.body_html || '', item.title || '');

                    products.push({
                        model: item.title,
                        sku: sku,
                        category: catLabel,
                        productUrl: `${baseUrl}/products/${item.handle}`,
                        specs,
                        rawHtml: JSON.stringify(item),
                        geo: { country: 'USA' }, // Base distribution
                    });
                }

                this.log.info(`MaxLite page ${page}: got ${items.length} items (total: ${products.length})`);

                if (items.length < limit) {
                    hasMore = false;
                } else {
                    page++;
                }

            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                this.log.warn(`MaxLite Scraper API error page ${page}: ${msg}`);
                hasMore = false;
            }
        }

        this.log.info(`MaxLite scrape complete — ${products.length} products total`);
        return products;
    }
}
