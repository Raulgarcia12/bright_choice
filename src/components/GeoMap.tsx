/**
 * GeoMap — Interactive choropleth map for USA states or Canadian provinces.
 * Uses react-simple-maps with TopoJSON from a public CDN.
 * Colored by product count per region; click to filter.
 */
import { useState, useEffect, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { motion } from 'framer-motion';

// Public CDN TopoJSON sources
const USA_TOPO = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';
const CANADA_TOPO = 'https://cdn.jsdelivr.net/npm/canada-topo@1.0.3/canada.json';

interface GeoMapProps {
    country: 'USA' | 'Canada';
    /** Map of state/province abbreviation → product count */
    regionCounts: Record<string, number>;
    selectedState: string | null;
    onSelectState: (abbr: string | null) => void;
    language: 'en' | 'es';
}

// US state FIPS code → abbreviation lookup (subset — will match by name for Canada)
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

// Canadian province abbreviations by name
const CA_PROV: Record<string, string> = {
    'Alberta': 'AB', 'British Columbia': 'BC', 'Manitoba': 'MB', 'New Brunswick': 'NB',
    'Newfoundland and Labrador': 'NL', 'Northwest Territories': 'NT', 'Nova Scotia': 'NS',
    'Nunavut': 'NU', 'Ontario': 'ON', 'Prince Edward Island': 'PE', 'Quebec': 'QC',
    'Saskatchewan': 'SK', 'Yukon': 'YT',
};

export default function GeoMap({ country, regionCounts, selectedState, onSelectState, language }: GeoMapProps) {
    const [tooltip, setTooltip] = useState<{ name: string; abbr: string; count: number } | null>(null);
    const [geoUrl, setGeoUrl] = useState<string>(country === 'USA' ? USA_TOPO : CANADA_TOPO);

    useEffect(() => {
        setGeoUrl(country === 'USA' ? USA_TOPO : CANADA_TOPO);
    }, [country]);

    const maxCount = useMemo(() => Math.max(1, ...Object.values(regionCounts)), [regionCounts]);

    const colorScale = useMemo(
        () => scaleLinear<string>().domain([0, maxCount]).range(['hsl(var(--muted))', 'hsl(var(--primary))']),
        [maxCount]
    );

    function getAbbr(geo: any): string {
        if (country === 'USA') {
            return US_FIPS[geo.id] || geo.properties?.postal || '';
        }
        // Canada: try various property keys
        const name = geo.properties?.name || geo.properties?.NAME || geo.properties?.PRENAME || '';
        return CA_PROV[name] || geo.properties?.abbr || '';
    }

    function getName(geo: any): string {
        return geo.properties?.name || geo.properties?.NAME || geo.properties?.PRENAME || '';
    }

    const center: [number, number] = country === 'USA' ? [-97, 40] : [-97, 60];
    const scale = country === 'USA' ? 700 : 420;

    return (
        <div className="relative w-full select-none">
            <ComposableMap
                projection="geoAlbersUsa"
                style={{ width: '100%', height: '100%' }}
                projectionConfig={{ scale, center }}
            >
                <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                        geographies.map((geo) => {
                            const abbr = getAbbr(geo);
                            const name = getName(geo);
                            const count = regionCounts[abbr] || 0;
                            const isSelected = selectedState === abbr;

                            return (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    onMouseEnter={() => setTooltip({ name, abbr, count })}
                                    onMouseLeave={() => setTooltip(null)}
                                    onClick={() => onSelectState(isSelected ? null : abbr)}
                                    style={{
                                        default: {
                                            fill: isSelected ? 'hsl(var(--primary))' : count > 0 ? colorScale(count) : 'hsl(var(--muted))',
                                            stroke: 'hsl(var(--background))',
                                            strokeWidth: 0.8,
                                            outline: 'none',
                                            cursor: 'pointer',
                                            transition: 'fill 0.3s ease',
                                        },
                                        hover: {
                                            fill: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.6)',
                                            stroke: 'hsl(var(--background))',
                                            strokeWidth: 0.8,
                                            outline: 'none',
                                            cursor: 'pointer',
                                        },
                                        pressed: {
                                            fill: 'hsl(var(--primary))',
                                            outline: 'none',
                                        },
                                    }}
                                />
                            );
                        })
                    }
                </Geographies>
            </ComposableMap>

            {/* Tooltip */}
            {tooltip && (
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pointer-events-none absolute bottom-2 left-2 z-10 rounded-lg border bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm"
                >
                    <p className="text-xs font-semibold text-foreground">{tooltip.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                        {tooltip.count} {language === 'es' ? 'productos' : 'product'}{tooltip.count !== 1 ? 's' : ''}
                    </p>
                </motion.div>
            )}

            {/* Color legend */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-md bg-card/80 px-2 py-1 text-[10px] backdrop-blur-sm">
                <span className="text-muted-foreground">0</span>
                <div
                    className="h-2 w-16 rounded-full"
                    style={{ background: `linear-gradient(to right, hsl(var(--muted)), hsl(var(--primary)))` }}
                />
                <span className="text-muted-foreground">{maxCount}</span>
            </div>
        </div>
    );
}
