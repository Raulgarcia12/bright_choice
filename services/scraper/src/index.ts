/**
 * Central Orchestrator
 * Entry point for the scraper service.
 * Coordinates brand scrapers, normalization, and change detection.
 */
import { validateConfig, config } from './config';
import { logger } from './utils/logger';
import { supabaseAdmin } from './utils/supabaseAdmin';
import { AcuityScraper } from './brands/acuity';
import { CreeScraper } from './brands/cree';
import { PhilipsScraper } from './brands/philips';
import { mapAttributes } from './normalizer/attributeMap';
import { parseAndConvert, extractNumeric } from './normalizer/unitConverter';
import { validateProduct } from './normalizer/validator';
import { generateSpecHash, buildSpecSnapshot } from './detector/hashEngine';
import { processProductChange } from './detector/changeDetector';
import { getGeoVariants } from './geo/geoResolver';
import type { BaseScraper, BrandConfig, RawProduct } from './brands/BaseScraper';

// Map brand names to scraper classes
const SCRAPER_REGISTRY: Record<string, new (config: BrandConfig) => BaseScraper> = {
    'Acuity Brands': AcuityScraper as any,
    'Cree Lighting': CreeScraper as any,
    'Philips': PhilipsScraper as any,
};

/**
 * Process a single brand: scrape, normalize, detect changes.
 */
async function processBrand(brand: BrandConfig): Promise<{
    found: number;
    newProducts: number;
    changed: number;
    errors: number;
}> {
    const stats = { found: 0, newProducts: 0, changed: 0, errors: 0 };

    // Create scrape run record
    const { data: scrapeRun, error: runError } = await supabaseAdmin
        .from('scrape_runs')
        .insert({
            brand_id: brand.id,
            status: 'running',
            started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

    if (runError || !scrapeRun) {
        logger.error(`Failed to create scrape run: ${runError?.message}`);
        return stats;
    }

    try {
        // Get the right scraper class
        const ScraperClass = SCRAPER_REGISTRY[brand.name];
        if (!ScraperClass) {
            logger.warn(`No scraper registered for brand: ${brand.name}`);
            return stats;
        }

        const scraper = new ScraperClass(brand);
        const rawProducts = await scraper.execute();
        stats.found = rawProducts.length;

        // Process each product
        for (const raw of rawProducts) {
            try {
                // Normalize attributes
                const mapped = mapAttributes(raw.specs);

                // Build normalized product data
                const normalized: Record<string, unknown> = {
                    brand: brand.name,
                    model: raw.model,
                    category: raw.category || 'Bulb',
                    sku: raw.sku,
                    product_url: raw.productUrl,
                    brand_id: brand.id,
                };

                // Extract numeric values with unit conversion
                if (mapped.watts) normalized.watts = extractNumeric(mapped.watts.value) || 0;
                if (mapped.lumens) normalized.lumens = extractNumeric(mapped.lumens.value) || 0;
                if (mapped.cct) normalized.cct = extractNumeric(mapped.cct.value) || 4000;
                if (mapped.cri) normalized.cri = extractNumeric(mapped.cri.value) || 80;
                if (mapped.lifespan) {
                    const lifeVal = parseAndConvert(mapped.lifespan.value, 'hours');
                    normalized.lifespan = lifeVal?.value || 25000;
                }
                if (mapped.warranty) {
                    const warVal = parseAndConvert(mapped.warranty.value, 'years');
                    normalized.warranty = warVal?.value || 3;
                }
                if (mapped.efficiency) normalized.efficiency = extractNumeric(mapped.efficiency.value);
                if (mapped.ip_rating) normalized.ip_rating = mapped.ip_rating.value;
                if (mapped.voltage) normalized.voltage = mapped.voltage.value;
                if (mapped.dimming) normalized.dimming = mapped.dimming.value;

                // Validate core spec data
                const validation = validateProduct(normalized as any);
                if (!validation.isValid) {
                    logger.warn(`Skipping invalid product ${raw.model}: ${validation.errors.join('; ')}`);
                    stats.errors++;
                    continue;
                }

                // ── Geo expansion ────────────────────────────────────────────
                // Determine which state/province rows to insert.
                // If the raw product has an explicit geo hint (e.g. Philips tagging
                // which regional site it came from), use that. Otherwise, expand
                // from the static brandGeoConfig (one row per state/province).
                const geoVariants = getGeoVariants(brand.name);

                // If the scraper tagged a specific country, filter variants to that country
                const filteredVariants = raw.geo?.country
                    ? geoVariants.filter(v => v.country === raw.geo!.country)
                    : geoVariants;

                // If the scraper tagged a specific state, use only that (single row)
                const variantsToInsert = raw.geo?.state_province
                    ? [{ state_province: raw.geo.state_province, currency: raw.geo.country === 'Canada' ? 'CAD' : 'USD' as 'USD' | 'CAD', country: raw.geo.country ?? 'USA' as 'USA' | 'Canada' }]
                    : filteredVariants;

                // Insert/update one row per state/province
                for (const variant of variantsToInsert) {
                    const geoPayload = {
                        ...normalized,
                        state_province: variant.state_province,
                        currency: variant.currency,
                    };

                    // Check if this exact (brand + model + state_province) row exists
                    const { data: existing } = await supabaseAdmin
                        .from('products')
                        .select('*')
                        .eq('brand', brand.name)
                        .eq('model', raw.model)
                        .eq('state_province', variant.state_province)
                        .single();

                    if (existing) {
                        const result = await processProductChange(existing.id, existing, geoPayload);
                        if (result.isChanged) stats.changed++;
                    } else {
                        const specSnapshot = buildSpecSnapshot(geoPayload as any);
                        const specHash = generateSpecHash(specSnapshot);

                        const { error: insertError } = await supabaseAdmin
                            .from('products')
                            .insert({
                                ...geoPayload,
                                spec_hash: specHash,
                                price: 0,
                                last_scraped_at: new Date().toISOString(),
                            } as any);

                        if (insertError) {
                            logger.error(`Failed to insert ${raw.model}/${variant.state_province}: ${insertError.message}`);
                            stats.errors++;
                        } else {
                            stats.newProducts++;
                        }
                    }
                }

                // Store raw data for audit
                if (raw.rawHtml) {
                    await supabaseAdmin.from('raw_scraped_data').insert({
                        scrape_run_id: scrapeRun.id,
                        source_url: raw.productUrl || brand.websiteUrl,
                        content_type: raw.rawHtml.startsWith('{') ? 'application/json' : 'text/html',
                        raw_json: raw.rawHtml.startsWith('{') ? JSON.parse(raw.rawHtml) : null,
                        storage_path: null, // Could upload to Supabase Storage for large HTML
                    });
                }
            } catch (productError) {
                logger.error(`Error processing product ${raw.model}: ${productError}`);
                stats.errors++;
            }
        }

        // Update scrape run status
        await supabaseAdmin
            .from('scrape_runs')
            .update({
                status: 'completed',
                products_found: stats.found,
                products_new: stats.newProducts,
                products_changed: stats.changed,
                completed_at: new Date().toISOString(),
            })
            .eq('id', scrapeRun.id);
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error(`Brand scrape failed: ${err.message}`);

        await supabaseAdmin
            .from('scrape_runs')
            .update({
                status: 'failed',
                error_message: err.message,
                completed_at: new Date().toISOString(),
            })
            .eq('id', scrapeRun.id);
    }

    return stats;
}

/**
 * Main entry point.
 * Reads --brand arg to run a single brand, or runs all active brands.
 */
async function main(): Promise<void> {
    validateConfig();
    logger.info('🚀 Bright Choice Scraper starting...');

    // Check for --brand flag
    const brandArg = process.argv.find((a) => a.startsWith('--brand='))?.split('=')[1];

    // Fetch brands from database
    let query = supabaseAdmin.from('brands').select('*').eq('is_active', true);
    if (brandArg) {
        query = query.eq('name', brandArg);
    }

    const { data: brands, error } = await query;
    if (error || !brands) {
        logger.error(`Failed to fetch brands: ${error?.message}`);
        process.exit(1);
    }

    if (brands.length === 0) {
        logger.warn('No active brands found. Exiting.');
        process.exit(0);
    }

    logger.info(`Processing ${brands.length} brand(s): ${brands.map((b) => b.name).join(', ')}`);

    const totalStats = { found: 0, newProducts: 0, changed: 0, errors: 0 };

    for (const brand of brands) {
        const brandConfig: BrandConfig = {
            id: brand.id,
            name: brand.name,
            websiteUrl: brand.website_url || '',
            scraperConfig: brand.scraper_config || {},
        };

        const stats = await processBrand(brandConfig);
        totalStats.found += stats.found;
        totalStats.newProducts += stats.newProducts;
        totalStats.changed += stats.changed;
        totalStats.errors += stats.errors;
    }

    logger.info('✅ Scraper finished', totalStats);
}

main().catch((err) => {
    logger.error('Fatal error', err);
    process.exit(1);
});
