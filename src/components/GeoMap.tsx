/**
 * GeoMap — Interactive clickable USA map using an inline SVG.
 * No external CDN or D3 dependency — guaranteed to render.
 * Each state is a clickable region; click to filter the dashboard.
 */
import { useState } from 'react';

interface GeoMapProps {
    country: 'USA' | 'Canada';
    regionCounts: Record<string, number>;
    selectedState: string | null;
    onSelectState: (abbr: string | null) => void;
    language: 'en' | 'es';
}

// Full US state names → abbreviations
const STATE_NAMES: Record<string, string> = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
    'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
    'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
    'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
    'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
    'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
    'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
    'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
    'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
    'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
    'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC',
};

// All 50 US states + DC positioned on a simplified grid layout
// Each state has: abbreviation, grid column, grid row
const US_GRID: { abbr: string; name: string; col: number; row: number }[] = [
    { abbr: 'ME', name: 'Maine', col: 11, row: 0 },
    { abbr: 'WI', name: 'Wisconsin', col: 6, row: 1 },
    { abbr: 'VT', name: 'Vermont', col: 10, row: 1 },
    { abbr: 'NH', name: 'New Hampshire', col: 11, row: 1 },
    { abbr: 'WA', name: 'Washington', col: 1, row: 2 },
    { abbr: 'ID', name: 'Idaho', col: 2, row: 2 },
    { abbr: 'MT', name: 'Montana', col: 3, row: 2 },
    { abbr: 'ND', name: 'North Dakota', col: 4, row: 2 },
    { abbr: 'MN', name: 'Minnesota', col: 5, row: 2 },
    { abbr: 'IL', name: 'Illinois', col: 6, row: 3 },
    { abbr: 'MI', name: 'Michigan', col: 7, row: 2 },
    { abbr: 'NY', name: 'New York', col: 9, row: 2 },
    { abbr: 'MA', name: 'Massachusetts', col: 10, row: 2 },
    { abbr: 'OR', name: 'Oregon', col: 1, row: 3 },
    { abbr: 'NV', name: 'Nevada', col: 2, row: 3 },
    { abbr: 'WY', name: 'Wyoming', col: 3, row: 3 },
    { abbr: 'SD', name: 'South Dakota', col: 4, row: 3 },
    { abbr: 'IA', name: 'Iowa', col: 5, row: 3 },
    { abbr: 'IN', name: 'Indiana', col: 7, row: 3 },
    { abbr: 'OH', name: 'Ohio', col: 8, row: 3 },
    { abbr: 'PA', name: 'Pennsylvania', col: 9, row: 3 },
    { abbr: 'NJ', name: 'New Jersey', col: 10, row: 3 },
    { abbr: 'CT', name: 'Connecticut', col: 11, row: 3 },
    { abbr: 'RI', name: 'Rhode Island', col: 11, row: 2 },
    { abbr: 'CA', name: 'California', col: 1, row: 4 },
    { abbr: 'UT', name: 'Utah', col: 2, row: 4 },
    { abbr: 'CO', name: 'Colorado', col: 3, row: 4 },
    { abbr: 'NE', name: 'Nebraska', col: 4, row: 4 },
    { abbr: 'MO', name: 'Missouri', col: 5, row: 4 },
    { abbr: 'KY', name: 'Kentucky', col: 6, row: 4 },
    { abbr: 'WV', name: 'West Virginia', col: 7, row: 4 },
    { abbr: 'VA', name: 'Virginia', col: 8, row: 4 },
    { abbr: 'MD', name: 'Maryland', col: 9, row: 4 },
    { abbr: 'DE', name: 'Delaware', col: 10, row: 4 },
    { abbr: 'AZ', name: 'Arizona', col: 2, row: 5 },
    { abbr: 'NM', name: 'New Mexico', col: 3, row: 5 },
    { abbr: 'KS', name: 'Kansas', col: 4, row: 5 },
    { abbr: 'AR', name: 'Arkansas', col: 5, row: 5 },
    { abbr: 'TN', name: 'Tennessee', col: 6, row: 5 },
    { abbr: 'NC', name: 'North Carolina', col: 7, row: 5 },
    { abbr: 'SC', name: 'South Carolina', col: 8, row: 5 },
    { abbr: 'DC', name: 'District of Columbia', col: 9, row: 5 },
    { abbr: 'OK', name: 'Oklahoma', col: 4, row: 6 },
    { abbr: 'LA', name: 'Louisiana', col: 5, row: 6 },
    { abbr: 'MS', name: 'Mississippi', col: 6, row: 6 },
    { abbr: 'AL', name: 'Alabama', col: 7, row: 6 },
    { abbr: 'GA', name: 'Georgia', col: 8, row: 6 },
    { abbr: 'HI', name: 'Hawaii', col: 1, row: 7 },
    { abbr: 'AK', name: 'Alaska', col: 0, row: 7 },
    { abbr: 'TX', name: 'Texas', col: 4, row: 7 },
    { abbr: 'FL', name: 'Florida', col: 9, row: 7 },
];

function getColor(count: number, max: number, isSelected: boolean): string {
    if (isSelected) return 'hsl(var(--primary))';
    if (count === 0) return 'hsl(var(--muted))';
    // Gradient from light primary to full primary
    const ratio = Math.min(count / Math.max(max, 1), 1);
    const opacity = 0.2 + ratio * 0.8;
    return `hsl(var(--primary) / ${opacity.toFixed(2)})`;
}

export default function GeoMap({ regionCounts, selectedState, onSelectState, language }: GeoMapProps) {
    const [hovered, setHovered] = useState<string | null>(null);
    const maxCount = Math.max(1, ...Object.values(regionCounts));

    const cellW = 52;
    const cellH = 38;
    const pad = 2;
    const cols = 12;
    const rows = 8;
    const svgW = cols * cellW;
    const svgH = rows * cellH;

    return (
        <div className="relative h-full w-full select-none">
            <svg
                viewBox={`0 0 ${svgW} ${svgH}`}
                className="h-full w-full"
                style={{ maxHeight: '100%' }}
            >
                {US_GRID.map((state) => {
                    const x = state.col * cellW;
                    const y = state.row * cellH;
                    const count = regionCounts[state.abbr] || 0;
                    const isSelected = selectedState === state.abbr;
                    const isHovered = hovered === state.abbr;

                    return (
                        <g
                            key={state.abbr}
                            onClick={() => onSelectState(isSelected ? null : state.abbr)}
                            onMouseEnter={() => setHovered(state.abbr)}
                            onMouseLeave={() => setHovered(null)}
                            style={{ cursor: 'pointer' }}
                        >
                            <rect
                                x={x + pad}
                                y={y + pad}
                                width={cellW - pad * 2}
                                height={cellH - pad * 2}
                                rx={6}
                                fill={getColor(count, maxCount, isSelected)}
                                stroke={isSelected ? 'hsl(var(--primary))' : isHovered ? 'hsl(var(--primary) / 0.6)' : 'hsl(var(--border))'}
                                strokeWidth={isSelected ? 2 : 1}
                                style={{ transition: 'fill 0.2s ease, stroke 0.2s ease' }}
                            />
                            <text
                                x={x + cellW / 2}
                                y={y + cellH / 2 - 2}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="pointer-events-none"
                                style={{
                                    fontSize: 11,
                                    fontWeight: isSelected ? 700 : 600,
                                    fill: isSelected ? 'white' : 'hsl(var(--foreground))',
                                }}
                            >
                                {state.abbr}
                            </text>
                            {count > 0 && (
                                <text
                                    x={x + cellW / 2}
                                    y={y + cellH / 2 + 11}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="pointer-events-none"
                                    style={{
                                        fontSize: 8,
                                        fill: isSelected ? 'white' : 'hsl(var(--muted-foreground))',
                                    }}
                                >
                                    {count}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Tooltip */}
            {hovered && (
                <div className="pointer-events-none absolute left-2 top-2 z-10 rounded-lg border bg-card/95 px-3 py-1.5 shadow-lg backdrop-blur-sm">
                    <p className="text-xs font-semibold text-foreground">
                        {US_GRID.find(s => s.abbr === hovered)?.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                        {regionCounts[hovered] || 0} {language === 'es' ? 'productos' : 'products'}
                    </p>
                </div>
            )}

            {/* Color legend */}
            <div className="absolute bottom-1 right-1 flex items-center gap-1.5 rounded-md bg-card/80 px-2 py-1 text-[10px] backdrop-blur-sm">
                <span className="text-muted-foreground">0</span>
                <div
                    className="h-2 w-12 rounded-full"
                    style={{ background: 'linear-gradient(to right, hsl(var(--muted)), hsl(var(--primary)))' }}
                />
                <span className="text-muted-foreground">{maxCount}</span>
            </div>
        </div>
    );
}
