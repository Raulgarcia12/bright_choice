import axios from 'axios';
import { BaseScraper, type RawProduct } from './BaseScraper';
import { rateLimit, sleep } from '../utils/rateLimiter';

const RAB_API = 'https://www.rablighting.com/services/search/filter';

// Limit testing so we don't spam 73,000 requests while developing
const BATCH_SIZE = 100;
// Set higher limit if we want to extract everything
const MAX_BATCHES = process.env.SCRAPER_LIMIT ? parseInt(process.env.SCRAPER_LIMIT, 10) : 1000;

export class RABScraper extends BaseScraper {
    async scrape(): Promise<RawProduct[]> {
        const products: RawProduct[] = [];
        let from = 0;
        let total = 1;

        this.log.info(`Starting RAB JSON API scraper`);

        let batches = 0;
        while (from < total && batches < MAX_BATCHES) {
            batches++;
            const url = `${RAB_API}?size=${BATCH_SIZE}&from=${from}`;

            await rateLimit(new URL(RAB_API).hostname);

            try {
                const response = await axios.get(url, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    },
                    timeout: 30000,
                });

                const data = response.data?.data;
                if (!data || !data.products) {
                    this.log.warn(`Invalid JSON response payload structure`);
                    break;
                }

                total = data.total;
                const batchProducts = data.products;

                if (batchProducts.length === 0) break;

                this.log.info(`Fetched batch ${batches} (items ${from} to ${from + batchProducts.length} of ${total})`);

                for (const rp of batchProducts) {
                    // Make sure it has an SKU (RAB uses 'name' for the primary catalog number)
                    const sku = rp.name;
                    if (!sku || typeof sku !== 'string') continue;

                    const title = rp.description || rp.metaDescription || sku;
                    const urlPath = rp.slug ? `/feature/${rp.slug}` : `/product/${encodeURIComponent(sku)}`;

                    const specs: Record<string, string> = {};

                    // Remap useful properties so normalizer can easily pick them up
                    if (rp.lampLumens || rp.lumens) specs['Lumens'] = String(rp.lampLumens || rp.lumens);
                    if (rp.inputWatts || rp.watts) specs['Watts'] = String(rp.inputWatts || rp.watts);
                    if (rp.efficacy) specs['Efficacy'] = String(rp.efficacy);
                    if (rp.cri) specs['CRI'] = String(rp.cri);
                    if (rp.dlcId) specs['cert_dlc'] = String(rp.dlcId);
                    if (rp.inputVoltage || rp.voltage) specs['Voltage'] = String(rp.inputVoltage || rp.voltage);
                    if (rp.l70 || rp.lampHours) specs['Lifespan'] = String(rp.l70 || rp.lampHours);
                    if (rp.dimming) specs['Dimming'] = String(rp.dimming);
                    if (rp.warranty) specs['Warranty'] = String(rp.warranty);

                    if (rp.colorTemp) specs['CCT'] = String(rp.colorTemp);
                    if (rp.finish) specs['Finish'] = String(rp.finish);
                    if (rp.weight) specs['Weight'] = String(rp.weight);

                    if (rp.Title24) specs['cert_title24'] = 'Yes';
                    if (rp.EnergyStar) specs['cert_energystar'] = 'Yes';
                    if (rp.DLC || rp.dlcType) specs['cert_dlc'] = String(rp.DLC || rp.dlcType);
                    const rawCategory = [rp.category, rp.division, rp.majorGroup, rp.productLine, rp.type, title].join(' ');
                    const catLabel = this.inferCategory(rawCategory);

                    products.push({
                        model: title,
                        sku: sku,
                        category: catLabel,
                        productUrl: `https://www.rablighting.com${urlPath}`,
                        specs,
                        rawHtml: JSON.stringify(rp), // Preserve original JSON in rawHtml
                        geo: { country: 'USA' },
                    });
                }

                from += BATCH_SIZE;

            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                this.log.warn(`Failed fetching RAB batch from=${from}: ${msg}`);
                // Break or continue depending on whether we want to fail fast
                // Break to avoid infinite looping on 403s
                break;
            }
        }

        this.log.info(`RAB scrape complete — returning ${products.length} products`);
        return products;
    }

    private inferCategory(text: string): string {
        const p = text.toLowerCase();
        if (p.includes('troffer') || p.includes('panel')) return 'Panel';
        if (p.includes('high-bay') || p.includes('low-bay') || p.includes('bay')) return 'High Bay';
        if (p.includes('linear') || p.includes('strip')) return 'Linear';
        if (p.includes('downlight') || p.includes('wafer') || p.includes('cylinder') || p.includes('recessed')) return 'Downlight';
        if (p.includes('flood')) return 'Flood Light';
        if (p.includes('area') || p.includes('roadway') || p.includes('street')) return 'Area Light';
        if (p.includes('canopy') || p.includes('garage') || p.includes('parking')) return 'Canopy';
        if (p.includes('wall') || p.includes('pack')) return 'Wall Pack';
        if (p.includes('vapor') || p.includes('wash')) return 'Vapor Tight';
        if (p.includes('bollard') || p.includes('pathway')) return 'Bollard';
        if (p.includes('lamp') || p.includes('bulb') || p.includes('tube')) return 'Bulb';
        if (p.includes('surface mount')) return 'Surface Mount';
        if (p.includes('track')) return 'Track Light';
        return 'Specialty'; // Fallback that is supported by enum
    }
}
