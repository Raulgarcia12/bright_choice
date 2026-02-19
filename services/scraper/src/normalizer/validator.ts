/**
 * Validator
 * Validates normalized product data against expected ranges.
 * Flags suspicious values for manual review.
 */
import { logger } from '../utils/logger.js';

interface ValidationRule {
    field: string;
    min: number;
    max: number;
    required: boolean;
}

const VALIDATION_RULES: ValidationRule[] = [
    { field: 'watts', min: 1, max: 2000, required: true },
    { field: 'lumens', min: 50, max: 200000, required: true },
    { field: 'efficiency', min: 10, max: 250, required: false },
    { field: 'cct', min: 2000, max: 10000, required: false },
    { field: 'cri', min: 50, max: 100, required: false },
    { field: 'lifespan', min: 10000, max: 200000, required: false },
    { field: 'warranty', min: 1, max: 25, required: false },
    { field: 'price', min: 0.01, max: 50000, required: false },
];

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Validate a product's normalized attributes.
 */
export function validateProduct(
    product: Record<string, number | string | null | undefined>
): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of VALIDATION_RULES) {
        const value = product[rule.field];

        // Check required fields
        if (rule.required && (value === null || value === undefined || value === '')) {
            errors.push(`Missing required field: ${rule.field}`);
            continue;
        }

        // Skip optional missing fields
        if (value === null || value === undefined || value === '') continue;

        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (typeof numValue !== 'number' || isNaN(numValue)) {
            warnings.push(`Non-numeric value for ${rule.field}: ${value}`);
            continue;
        }

        // Range validation
        if (numValue < rule.min || numValue > rule.max) {
            warnings.push(
                `${rule.field} value ${numValue} is outside expected range [${rule.min}, ${rule.max}]`
            );
        }
    }

    // Efficiency cross-check: if both watts and lumens exist, verify efficiency
    if (product.watts && product.lumens) {
        const w = Number(product.watts);
        const lm = Number(product.lumens);
        if (w > 0 && lm > 0) {
            const calcEfficiency = Math.round((lm / w) * 10) / 10;
            if (product.efficiency) {
                const stated = Number(product.efficiency);
                const diff = Math.abs(stated - calcEfficiency);
                if (diff > 5) {
                    warnings.push(
                        `Stated efficiency (${stated}) differs significantly from calculated (${calcEfficiency} lm/W)`
                    );
                }
            }
        }
    }

    const isValid = errors.length === 0;

    if (!isValid) {
        logger.warn(`Product validation failed: ${errors.join('; ')}`);
    }
    if (warnings.length > 0) {
        logger.debug(`Product validation warnings: ${warnings.join('; ')}`);
    }

    return { isValid, errors, warnings };
}
