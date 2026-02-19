/**
 * Attribute Mapping Dictionary
 * Maps various source field names to a standardized attribute name.
 * This is the core of the normalization engine.
 */

export interface AttributeMapping {
    standardName: string;
    unit: string;
    sourceNames: string[];
}

/**
 * Master mapping table.
 * To add a new attribute, simply add an entry here.
 */
export const ATTRIBUTE_MAP: AttributeMapping[] = [
    {
        standardName: 'lumens',
        unit: 'lm',
        sourceNames: [
            'luminous flux', 'output', 'brightness', 'light output',
            'lumen output', 'total lumens', 'delivered lumens', 'initial lumens',
            'lumens', 'lm',
        ],
    },
    {
        standardName: 'watts',
        unit: 'W',
        sourceNames: [
            'power', 'wattage', 'input power', 'system wattage',
            'system watts', 'watts', 'w', 'power consumption',
        ],
    },
    {
        standardName: 'efficiency',
        unit: 'lm/W',
        sourceNames: [
            'efficacy', 'efficiency', 'lm/w', 'lumens per watt',
            'luminous efficacy', 'system efficacy',
        ],
    },
    {
        standardName: 'cct',
        unit: 'K',
        sourceNames: [
            'color temperature', 'cct', 'kelvin', 'color temp',
            'correlated color temperature', 'colour temperature',
        ],
    },
    {
        standardName: 'cri',
        unit: '',
        sourceNames: [
            'color rendering', 'cri', 'ra', 'color rendering index',
            'colour rendering index', 'cri (ra)',
        ],
    },
    {
        standardName: 'lifespan',
        unit: 'hours',
        sourceNames: [
            'l70 lifetime', 'rated life', 'lifespan', 'life hours',
            'expected life', 'rated lifetime', 'l70', 'useful life',
        ],
    },
    {
        standardName: 'warranty',
        unit: 'years',
        sourceNames: [
            'warranty', 'warranty period', 'guarantee',
        ],
    },
    {
        standardName: 'ip_rating',
        unit: '',
        sourceNames: [
            'ip rating', 'ip', 'ingress protection', 'ip code',
            'environmental rating',
        ],
    },
    {
        standardName: 'voltage',
        unit: 'V',
        sourceNames: [
            'voltage', 'input voltage', 'operating voltage',
            'supply voltage', 'voltage range',
        ],
    },
    {
        standardName: 'dimming',
        unit: '',
        sourceNames: [
            'dimming', 'dimmable', 'dimming range', 'dimming protocol',
            'dimming type',
        ],
    },
    {
        standardName: 'beam_angle',
        unit: '°',
        sourceNames: [
            'beam angle', 'beam spread', 'beam distribution',
            'distribution', 'optic',
        ],
    },
    {
        standardName: 'weight',
        unit: 'kg',
        sourceNames: [
            'weight', 'net weight', 'product weight',
        ],
    },
];

/**
 * Find the standard attribute mapping for a given source field name.
 * Case-insensitive matching.
 */
export function findMapping(sourceFieldName: string): AttributeMapping | undefined {
    const normalized = sourceFieldName.toLowerCase().trim();
    return ATTRIBUTE_MAP.find((m) =>
        m.sourceNames.some((s) => s.toLowerCase() === normalized)
    );
}

/**
 * Map a raw specs object to standardized attribute names.
 */
export function mapAttributes(
    rawSpecs: Record<string, string>
): Record<string, { value: string; unit: string; sourceField: string }> {
    const result: Record<string, { value: string; unit: string; sourceField: string }> = {};

    for (const [key, value] of Object.entries(rawSpecs)) {
        const mapping = findMapping(key);
        if (mapping) {
            result[mapping.standardName] = {
                value,
                unit: mapping.unit,
                sourceField: key,
            };
        } else {
            // Preserve unmapped attributes with a generic key
            result[`raw_${key.toLowerCase().replace(/\s+/g, '_')}`] = {
                value,
                unit: '',
                sourceField: key,
            };
        }
    }

    return result;
}
