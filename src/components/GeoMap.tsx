/**
 * GeoMap — Interactive choropleth map for North America (USA + Canada combined).
 * Uses react-simple-maps with two TopoJSON sources overlaid in one ComposableMap.
 * Colored by product count per region; click to filter.
 */
import { useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { motion } from 'framer-motion';

// Public CDN TopoJSON sources
const USA_TOPO = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';
const CANADA_PROV_TOPO = 'https://gist.githubusercontent.com/Saw-mon-and-Natalie/a11f058fc0dcce9343b02498a46b3d44/raw/canada.json';

interface GeoMapProps {
    /** Map of state/province abbreviation → product count for USA */
    usaRegionCounts: Record<string, number>;
    /** Map of state/province abbreviation → product count for Canada */
    canadaRegionCounts: Record<string, number>;
    selectedState: string | null;
    onSelectState: (abbr: string | null) => void;
    language: 'en' | 'es';
}

// US state FIPS code → abbreviation
const US_FIPS: Record<string, string> = {
    '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO',
    '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL', '13': 'GA', '15': 'HI',
    '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA', '20': 'KS', '21': 'KY',
    '22': 'LA', '23': 'ME', '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN',
    '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
    '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH',
    '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI', '45': 'SC', '46': 'SD',
    '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA',
    '54': 'WV', '55': 'WI', '56': 'WY',
};

// Province name → abbreviation map (includes variant spellings from different TopoJSON sources)
const CA_PROV: Record<string, string> = {
    'Alberta': 'AB', 'British Columbia': 'BC', 'Manitoba': 'MB', 'New Brunswick': 'NB',
    'Newfoundland and Labrador': 'NL', 'Newfoundland  & Labrador': 'NL', 'Newfoundland & Labrador': 'NL',
    'Northwest Territories': 'NT', 'Nova Scotia': 'NS',
    'Nunavut': 'NU', 'Ontario': 'ON', 'Prince Edward Island': 'PE', 'Quebec': 'QC',
    'Saskatchewan': 'SK', 'Yukon': 'YT', 'Yukon Territory': 'YT',
};

/** Interpolate between two hex values 0-1 */
function interpolateColor(t: number): string {
    // Base → primary: from #94a3b8 (slate-400) to #6366f1 (indigo-500)
    const r0 = 0x94, g0 = 0xa3, b0 = 0xb8;
    const r1 = 0x63, g1 = 0x66, b1 = 0xf1;
    const r = Math.round(r0 + (r1 - r0) * t);
    const g = Math.round(g0 + (g1 - g0) * t);
    const b = Math.round(b0 + (b1 - b0) * t);
    return `rgb(${r},${g},${b})`;
}

export default function GeoMap({ usaRegionCounts, canadaRegionCounts, selectedState, onSelectState, language }: GeoMapProps) {
    const [tooltip, setTooltip] = useState<{ name: string; abbr: string; count: number } | null>(null);
    const [usaError, setUsaError] = useState(false);
    const [canadaError, setCanadaError] = useState(false);

    // Merge all counts to get a unified max for the color scale
    const allCounts = useMemo(() => ({ ...usaRegionCounts, ...canadaRegionCounts }), [usaRegionCounts, canadaRegionCounts]);
    const maxCount = useMemo(() => {
        const vals = Object.values(allCounts);
        return vals.length > 0 ? Math.max(1, ...vals) : 1;
    }, [allCounts]);

    function getUsaAbbr(geo: any): string {
        return US_FIPS[String(geo.id)] || '';
    }

    function getCanadaAbbr(geo: any): string {
        const name =
            geo.properties?.name ||
            geo.properties?.NAME ||
            geo.properties?.PRENAME ||
            geo.properties?.prov_name_en || '';
        return CA_PROV[name] || geo.properties?.abbrev || geo.properties?.postal || '';
    }

    function getName(geo: any): string {
        return (
            geo.properties?.name ||
            geo.properties?.NAME ||
            geo.properties?.PRENAME ||
            geo.properties?.prov_name_en || ''
        );
    }

    function getFill(abbr: string, counts: Record<string, number>): string {
        if (!abbr || !(abbr in counts)) return '#cbd5e1'; // slate-300 = no data
        const count = counts[abbr] || 0;
        const t = Math.min(count / maxCount, 1);
        return interpolateColor(t);
    }

    // Use geoMercator for a standard North America view showing both countries
    const projection = 'geoMercator';
    const projConfig = {
        scale: 220,
        center: [-96, 55] as [number, number],
    };

    // If both failed, show error
    if (usaError && canadaError) {
        return (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground p-4 text-center">
                {language === 'en' ? 'Map unavailable' : 'Mapa no disponible'}
            </div>
        );
    }

    return (
        <div className="relative h-full w-full select-none overflow-hidden">
            <ComposableMap
                projection={projection}
                projectionConfig={projConfig}
                style={{ width: '100%', height: '100%' }}
            >
                {/* ── USA States ── */}
                {!usaError && (
                    <Geographies
                        geography={USA_TOPO}
                        onError={() => setUsaError(true)}
                    >
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const abbr = getUsaAbbr(geo);
                                const name = getName(geo);
                                const count = usaRegionCounts[abbr] || 0;
                                const isSelected = selectedState === abbr;
                                const fill = isSelected ? '#6366f1' : getFill(abbr, usaRegionCounts);

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        onMouseEnter={() => abbr && setTooltip({ name, abbr, count })}
                                        onMouseLeave={() => setTooltip(null)}
                                        onClick={() => abbr && onSelectState(isSelected ? null : abbr)}
                                        style={{
                                            default: {
                                                fill,
                                                stroke: '#fff',
                                                strokeWidth: 0.5,
                                                outline: 'none',
                                                transition: 'fill 0.25s ease',
                                            },
                                            hover: {
                                                fill: isSelected ? '#6366f1' : '#818cf8',
                                                stroke: '#fff',
                                                strokeWidth: 0.5,
                                                outline: 'none',
                                                cursor: 'pointer',
                                            },
                                            pressed: {
                                                fill: '#6366f1',
                                                outline: 'none',
                                            },
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>
                )}

                {/* ── Canada Provinces ── */}
                {!canadaError && (
                    <Geographies
                        geography={CANADA_PROV_TOPO}
                        onError={() => setCanadaError(true)}
                    >
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const abbr = getCanadaAbbr(geo);
                                const name = getName(geo);
                                const count = canadaRegionCounts[abbr] || 0;
                                const isSelected = selectedState === abbr;
                                const fill = isSelected ? '#6366f1' : getFill(abbr, canadaRegionCounts);

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        onMouseEnter={() => abbr && setTooltip({ name, abbr, count })}
                                        onMouseLeave={() => setTooltip(null)}
                                        onClick={() => abbr && onSelectState(isSelected ? null : abbr)}
                                        style={{
                                            default: {
                                                fill,
                                                stroke: '#fff',
                                                strokeWidth: 0.5,
                                                outline: 'none',
                                                transition: 'fill 0.25s ease',
                                            },
                                            hover: {
                                                fill: isSelected ? '#6366f1' : '#818cf8',
                                                stroke: '#fff',
                                                strokeWidth: 0.5,
                                                outline: 'none',
                                                cursor: 'pointer',
                                            },
                                            pressed: {
                                                fill: '#6366f1',
                                                outline: 'none',
                                            },
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>
                )}
            </ComposableMap>

            {/* Tooltip */}
            {tooltip && (
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pointer-events-none absolute bottom-2 left-2 z-10 rounded-lg border bg-card/95 px-3 py-1.5 shadow-lg backdrop-blur-sm"
                >
                    <p className="text-xs font-semibold">{tooltip.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                        {tooltip.count} {language === 'es' ? 'productos' : `product${tooltip.count !== 1 ? 's' : ''}`}
                    </p>
                </motion.div>
            )}

            {/* Color legend */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-card/80 px-2 py-0.5 text-[10px] backdrop-blur-sm border">
                <span className="text-muted-foreground">0</span>
                <div className="h-1.5 w-12 rounded-full" style={{ background: 'linear-gradient(to right, #cbd5e1, #6366f1)' }} />
                <span className="text-muted-foreground">{maxCount}</span>
            </div>
        </div>
    );
}
