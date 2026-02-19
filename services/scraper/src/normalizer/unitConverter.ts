/**
 * Unit Converter
 * Converts values between different units to the standardized unit.
 */

interface ConversionRule {
    from: RegExp;
    to: string;
    factor: number;
}

const CONVERSIONS: ConversionRule[] = [
    { from: /^kw$/i, to: 'W', factor: 1000 },
    { from: /^kilowatt/i, to: 'W', factor: 1000 },
    { from: /^klm$/i, to: 'lm', factor: 1000 },
    { from: /^kilolumen/i, to: 'lm', factor: 1000 },
    { from: /^years?$/i, to: 'hours', factor: 8760 },
    { from: /^lb(s)?$/i, to: 'kg', factor: 0.4536 },
    { from: /^pound/i, to: 'kg', factor: 0.4536 },
    { from: /^oz$/i, to: 'kg', factor: 0.02835 },
    { from: /^mm$/i, to: 'mm', factor: 1 },
    { from: /^cm$/i, to: 'mm', factor: 10 },
    { from: /^in(ch(es)?)?$/i, to: 'mm', factor: 25.4 },
    { from: /^ft|feet|foot$/i, to: 'mm', factor: 304.8 },
];

/**
 * Extract numeric value from a string (e.g., "4500 lm" → 4500)
 */
export function extractNumeric(value: string): number | null {
    // Remove commas and match the first number (int or float)
    const cleaned = value.replace(/,/g, '');
    const match = cleaned.match(/-?\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : null;
}

/**
 * Extract unit from a value string (e.g., "4500 lm" → "lm")
 */
export function extractUnit(value: string): string {
    const cleaned = value.replace(/,/g, '').trim();
    const match = cleaned.match(/[\d.]+\s*(.+)/);
    return match ? match[1].trim() : '';
}

/**
 * Convert a value from one unit to a target unit.
 * Returns the converted numeric value, or null if conversion is not possible.
 */
export function convertUnit(
    value: number,
    sourceUnit: string,
    targetUnit: string
): number | null {
    if (sourceUnit.toLowerCase() === targetUnit.toLowerCase()) return value;

    const rule = CONVERSIONS.find(
        (r) => r.from.test(sourceUnit) && r.to.toLowerCase() === targetUnit.toLowerCase()
    );

    if (rule) {
        return Math.round(value * rule.factor * 100) / 100;
    }

    return null; // Unknown conversion
}

/**
 * Parse a value string, extract numeric + unit, convert to target unit.
 */
export function parseAndConvert(
    rawValue: string,
    targetUnit: string
): { value: number; unit: string } | null {
    const numeric = extractNumeric(rawValue);
    if (numeric === null) return null;

    const sourceUnit = extractUnit(rawValue);
    if (!sourceUnit) return { value: numeric, unit: targetUnit };

    const converted = convertUnit(numeric, sourceUnit, targetUnit);
    return converted !== null
        ? { value: converted, unit: targetUnit }
        : { value: numeric, unit: sourceUnit };
}
