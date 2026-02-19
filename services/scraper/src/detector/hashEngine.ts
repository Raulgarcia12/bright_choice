/**
 * Hash Engine
 * Generates deterministic SHA-256 hashes of product specs
 * for change detection.
 */
import { createHash } from 'crypto';

/**
 * Generate a SHA-256 hash of a product's core spec fields.
 * Fields are sorted alphabetically for deterministic output.
 */
export function generateSpecHash(specs: Record<string, unknown>): string {
    // Pick only spec-relevant fields, sorted
    const sortedKeys = Object.keys(specs).sort();
    const normalized: Record<string, unknown> = {};

    for (const key of sortedKeys) {
        const value = specs[key];
        // Normalize: trim strings, round numbers
        if (typeof value === 'string') {
            normalized[key] = value.trim().toLowerCase();
        } else if (typeof value === 'number') {
            normalized[key] = Math.round(value * 100) / 100;
        } else if (value !== null && value !== undefined) {
            normalized[key] = value;
        }
    }

    const json = JSON.stringify(normalized);
    return createHash('sha256').update(json).digest('hex');
}

/**
 * Build a spec snapshot object from a product for hashing.
 * Only includes fields that matter for change detection.
 */
export function buildSpecSnapshot(product: {
    watts?: number;
    lumens?: number;
    efficiency?: number | null;
    cct?: number;
    cri?: number;
    lifespan?: number;
    warranty?: number;
    price?: number;
    cert_ul?: boolean;
    cert_dlc?: boolean;
    cert_energy_star?: boolean;
    [key: string]: unknown;
}): Record<string, unknown> {
    return {
        watts: product.watts,
        lumens: product.lumens,
        efficiency: product.efficiency,
        cct: product.cct,
        cri: product.cri,
        lifespan: product.lifespan,
        warranty: product.warranty,
        price: product.price,
        cert_ul: product.cert_ul,
        cert_dlc: product.cert_dlc,
        cert_energy_star: product.cert_energy_star,
    };
}
