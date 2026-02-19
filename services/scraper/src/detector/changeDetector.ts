/**
 * Change Detector
 * Compares current product data against stored versions.
 * Generates field-level diffs and stores change logs.
 */
import { supabaseAdmin } from '../utils/supabaseAdmin.js';
import { logger } from '../utils/logger.js';
import { generateSpecHash, buildSpecSnapshot } from './hashEngine.js';

interface ProductRow {
    id: string;
    brand: string;
    model: string;
    spec_hash: string | null;
    [key: string]: unknown;
}

interface FieldChange {
    fieldName: string;
    oldValue: string | null;
    newValue: string | null;
}

/**
 * Detect changes between scraped data and existing product.
 * Returns the list of changed fields, or null if nothing changed.
 */
export function detectChanges(
    existing: Record<string, unknown>,
    incoming: Record<string, unknown>
): FieldChange[] | null {
    const changes: FieldChange[] = [];
    const allKeys = new Set([...Object.keys(existing), ...Object.keys(incoming)]);

    for (const key of allKeys) {
        const oldVal = existing[key];
        const newVal = incoming[key];

        // Normalize for comparison
        const oldStr = oldVal !== null && oldVal !== undefined ? String(oldVal) : null;
        const newStr = newVal !== null && newVal !== undefined ? String(newVal) : null;

        if (oldStr !== newStr) {
            changes.push({ fieldName: key, oldValue: oldStr, newValue: newStr });
        }
    }

    return changes.length > 0 ? changes : null;
}

/**
 * Process a single product: detect changes, create versions, log diffs.
 */
export async function processProductChange(
    productId: string,
    existingProduct: ProductRow,
    incomingSpecs: Record<string, unknown>
): Promise<{ isNew: boolean; isChanged: boolean }> {
    const existingSnapshot = buildSpecSnapshot(existingProduct as any);
    const incomingSnapshot = buildSpecSnapshot(incomingSpecs as any);

    const newHash = generateSpecHash(incomingSnapshot);
    const oldHash = existingProduct.spec_hash;

    // No change
    if (oldHash === newHash) {
        return { isNew: false, isChanged: false };
    }

    logger.info(`Change detected for ${existingProduct.brand} ${existingProduct.model}`, {
        oldHash: oldHash?.substring(0, 8),
        newHash: newHash.substring(0, 8),
    });

    // Get latest version number
    const { data: latestVersion } = await supabaseAdmin
        .from('product_versions')
        .select('version_number')
        .eq('product_id', productId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

    const nextVersion = (latestVersion?.version_number || 0) + 1;

    // Detect field-level changes
    const changes = detectChanges(existingSnapshot, incomingSnapshot);
    const changeSummary = changes
        ? changes.map((c) => `${c.fieldName}: ${c.oldValue} → ${c.newValue}`).join('; ')
        : 'Initial version';

    // Insert new version
    const { data: versionData, error: versionError } = await supabaseAdmin
        .from('product_versions')
        .insert({
            product_id: productId,
            version_number: nextVersion,
            snapshot: incomingSnapshot,
            spec_hash: newHash,
            change_summary: changeSummary,
        })
        .select('id')
        .single();

    if (versionError) {
        logger.error(`Failed to create product version: ${versionError.message}`);
        return { isNew: false, isChanged: false };
    }

    // Insert change log entries
    if (changes) {
        const changeLogEntries = changes.map((c) => ({
            product_id: productId,
            product_version_id: versionData.id,
            field_name: c.fieldName,
            old_value: c.oldValue,
            new_value: c.newValue,
        }));

        const { error: logError } = await supabaseAdmin
            .from('change_logs')
            .insert(changeLogEntries);

        if (logError) {
            logger.error(`Failed to insert change logs: ${logError.message}`);
        }
    }

    // Update product's spec_hash and timestamp
    await supabaseAdmin
        .from('products')
        .update({ spec_hash: newHash, last_scraped_at: new Date().toISOString() })
        .eq('id', productId);

    return { isNew: false, isChanged: true };
}
