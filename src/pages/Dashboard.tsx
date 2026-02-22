/**
 * Dashboard Page
 * KPI metrics, trend charts, Efficiency Frontier, Competitive Gaps,
 * and interactive US + Canada choropleth maps for geographic filtering.
 */
import { useMemo, useState } from 'react';
import { BarChart3, TrendingUp, Zap, DollarSign, Activity, Clock, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, Legend,
    CartesianGrid,
} from 'recharts';
import Header from '@/components/Header';
import GeoMap from '@/components/GeoMap';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/hooks/useProducts';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// ────────────────────────────────────────────────────────────
// KPI Card
// ────────────────────────────────────────────────────────────
function KPICard({ title, value, subtitle, icon: Icon, trend }: {
    title: string; value: string; subtitle: string;
    icon: React.ElementType; trend?: string;
}) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card className="relative overflow-hidden border bg-card shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/60 to-primary/20" />
                <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
                            <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
                        </div>
                        <div className="rounded-xl bg-primary/8 p-2.5">
                            <Icon className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                    {trend && (
                        <Badge variant="secondary" className="mt-2 text-[10px]">
                            <TrendingUp className="mr-1 h-2.5 w-2.5" /> {trend}
                        </Badge>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

// ────────────────────────────────────────────────────────────
// Custom Tooltip for charts
// ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border bg-card/95 px-3 py-2 shadow-xl backdrop-blur-sm text-xs">
            {label && <p className="mb-1 font-semibold text-foreground">{label}</p>}
            {payload.map((entry: any, i: number) => (
                <p key={i} style={{ color: entry.color }} className="font-medium">
                    {entry.name}: {entry.value}
                </p>
            ))}
        </div>
    );
}

// ────────────────────────────────────────────────────────────
// Main Dashboard
// ────────────────────────────────────────────────────────────
export default function Dashboard() {
    const { selectedRegion, language } = useAppStore();
    const { data: products } = useProducts(selectedRegion);
    const [selectedState, setSelectedState] = useState<string | null>(null);

    const allProducts = products || [];

    // Filter products by selected US/CA state
    const filteredProducts = useMemo(() => {
        if (!selectedState) return allProducts;
        return allProducts.filter(p => {
            const state = p.state_province || (p as any).regions?.abbreviation;
            return state === selectedState;
        });
    }, [allProducts, selectedState]);

    // Fetch recent changes
    const { data: recentChanges } = useQuery({
        queryKey: ['recentChanges'],
        queryFn: async () => {
            const { data } = await supabase
                .from('change_logs')
                .select('*, products(brand, model, category)')
                .order('detected_at', { ascending: false })
                .limit(10);
            return data || [];
        },
    });

    // ── Region counts for choropleth (always based on all products) ──
    const usaRegionCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        allProducts.forEach(p => {
            // Prefer direct field; fall back to joined region
            const abbr = p.state_province || (p as any).regions?.abbreviation;
            const country = p.currency === 'USD'
                ? 'USA'
                : ((p as any).regions?.country ?? null);
            if (abbr && country === 'USA') {
                counts[abbr] = (counts[abbr] || 0) + 1;
            }
        });
        return counts;
    }, [allProducts]);

    const canadaRegionCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        allProducts.forEach(p => {
            const abbr = p.state_province || (p as any).regions?.abbreviation;
            const country = p.currency === 'CAD'
                ? 'Canada'
                : ((p as any).regions?.country ?? null);
            if (abbr && country === 'Canada') {
                counts[abbr] = (counts[abbr] || 0) + 1;
            }
        });
        return counts;
    }, [allProducts]);

    // ── KPIs (based on filtered products) ──
    const kpis = useMemo(() => {
        if (filteredProducts.length === 0) return null;
        const avgEfficiency = filteredProducts.reduce((s, p) => s + (p.efficiency || 0), 0) / filteredProducts.length;
        const avgPrice = filteredProducts.reduce((s, p) => s + p.price, 0) / filteredProducts.length;
        const avgCRI = filteredProducts.reduce((s, p) => s + p.cri, 0) / filteredProducts.length;
        const brands = new Set(filteredProducts.map(p => p.brand));
        const certDLC = filteredProducts.filter(p => p.cert_dlc).length;
        return {
            totalProducts: filteredProducts.length,
            avgEfficiency: avgEfficiency.toFixed(1),
            avgPrice: avgPrice.toFixed(2),
            avgCRI: Math.round(avgCRI),
            brandCount: brands.size,
            certDLCPercent: ((certDLC / filteredProducts.length) * 100).toFixed(0),
        };
    }, [filteredProducts]);

    // ── Chart data ──
    const brandDistribution = useMemo(() => {
        const counts = new Map<string, number>();
        filteredProducts.forEach(p => counts.set(p.brand, (counts.get(p.brand) || 0) + 1));
        return Array.from(counts.entries()).map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count).slice(0, 8);
    }, [filteredProducts]);

    const categoryDistribution = useMemo(() => {
        const counts = new Map<string, number>();
        filteredProducts.forEach(p => counts.set(p.category, (counts.get(p.category) || 0) + 1));
        return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
    }, [filteredProducts]);

    const frontierData = useMemo(() => {
        return filteredProducts
            .filter(p => p.price > 0 && p.efficiency > 0)
            .map(p => ({ name: `${p.brand} ${p.model}`, brand: p.brand, price: p.price, efficiency: p.efficiency, lumens: p.lumens }));
    }, [filteredProducts]);

    const competitiveGaps = useMemo(() => {
        if (filteredProducts.length === 0) return [];
        const marketAvgEff = filteredProducts.reduce((s, p) => s + (p.efficiency || 0), 0) / filteredProducts.length;
        const marketAvgPrice = filteredProducts.reduce((s, p) => s + p.price, 0) / filteredProducts.length;
        const brandStats = new Map<string, { totalEff: number; totalPrice: number; count: number }>();
        filteredProducts.forEach(p => {
            const s = brandStats.get(p.brand) || { totalEff: 0, totalPrice: 0, count: 0 };
            s.totalEff += p.efficiency || 0; s.totalPrice += p.price || 0; s.count += 1;
            brandStats.set(p.brand, s);
        });
        return Array.from(brandStats.entries()).map(([brand, s]) => ({
            brand,
            effGap: ((s.totalEff / s.count - marketAvgEff) / marketAvgEff) * 100,
            priceGap: ((s.totalPrice / s.count - marketAvgPrice) / marketAvgPrice) * 100,
        })).sort((a, b) => b.effGap - a.effGap);
    }, [filteredProducts]);

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="mx-auto max-w-7xl px-4 py-6 space-y-8">

                {/* ── Page title ── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                                {language === 'en' ? 'Intelligence Dashboard' : 'Panel de Inteligencia'}
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {language === 'en'
                                    ? 'Real-time competitive insights for the North American lighting market'
                                    : 'Insights competitivos en tiempo real para el mercado norteamericano'}
                            </p>
                        </div>
                        {selectedState && (
                            <AnimatePresence>
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                                    <Button variant="outline" size="sm" onClick={() => setSelectedState(null)} className="gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-primary" />
                                        {selectedState}
                                        <X className="h-3 w-3 text-muted-foreground" />
                                    </Button>
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                </motion.div>

                {/* ── Geographic Filters ── */}
                <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                    <div className="mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                            {language === 'en' ? 'Geographic Filter' : 'Filtro Geográfico'}
                        </h2>
                        <span className="text-xs text-muted-foreground">
                            {language === 'en' ? '— click a state or province' : '— haz clic en un estado o provincia'}
                        </span>
                    </div>
                    <Card className="overflow-hidden">
                        <CardHeader className="pb-1 pt-3 px-4">
                            <CardTitle className="text-sm font-medium text-muted-foreground">🌎 North America</CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 pt-0">
                            <div className="h-[320px] sm:h-[380px]">
                                <ErrorBoundary fallback={<div className="flex h-full items-center justify-center text-xs text-muted-foreground">Map unavailable</div>}>
                                    <GeoMap
                                        usaRegionCounts={usaRegionCounts}
                                        canadaRegionCounts={canadaRegionCounts}
                                        selectedState={selectedState}
                                        onSelectState={setSelectedState}
                                        language={language}
                                    />
                                </ErrorBoundary>
                            </div>
                        </CardContent>
                    </Card>
                </motion.section>

                {/* ── KPI Cards ── */}
                {kpis ? (
                    <section>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-6">
                            <KPICard icon={BarChart3} title="Products" value={String(kpis.totalProducts)} subtitle="In catalog" />
                            <KPICard icon={Zap} title={language === 'en' ? 'Avg Efficacy' : 'Eficacia'} value={`${kpis.avgEfficiency}`} subtitle="lm/W" trend="+2.3% vs Q3" />
                            <KPICard icon={DollarSign} title={language === 'en' ? 'Avg Price' : 'Precio Prom.'} value={`$${kpis.avgPrice}`} subtitle="USD" />
                            <KPICard icon={Activity} title="Avg CRI" value={String(kpis.avgCRI)} subtitle="Color Rendering" />
                            <KPICard icon={TrendingUp} title={language === 'en' ? 'Brands' : 'Marcas'} value={String(kpis.brandCount)} subtitle={language === 'en' ? 'Tracked' : 'Rastreadas'} />
                            <KPICard icon={Clock} title="DLC" value={`${kpis.certDLCPercent}%`} subtitle="Certified" />
                        </div>
                    </section>
                ) : (
                    <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
                        {language === 'en' ? 'No products match the current filter.' : 'Ningún producto coincide con el filtro actual.'}
                    </div>
                )}

                {/* ── Charts Grid ── */}
                <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Bar: Products by Brand */}
                    <motion.div
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="h-full shadow-sm">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">
                                        {language === 'en' ? 'Products by Brand' : 'Productos por Marca'}
                                    </CardTitle>
                                    {selectedState && (
                                        <Badge variant="secondary" className="text-[10px] font-normal px-2 py-0">
                                            {selectedState}: {brandDistribution.reduce((sum, d) => sum + d.count, 0)}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={brandDistribution} margin={{ top: 4, right: 8, bottom: 40, left: 0 }}>
                                        <defs>
                                            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                                                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.4} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.4} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10 }}
                                            angle={-45}
                                            textAnchor="end"
                                            interval={0}
                                            height={60}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Bar
                                            dataKey="count"
                                            fill="url(#barGrad)"
                                            radius={[4, 4, 0, 0]}
                                            isAnimationActive={true}
                                            animationDuration={800}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Pie: Category Distribution */}
                    <motion.div
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.25 }}
                    >
                        <Card className="h-full shadow-sm">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">
                                        {language === 'en' ? 'Category Distribution' : 'Distribución por Categoría'}
                                    </CardTitle>
                                    {selectedState && (
                                        <Badge variant="secondary" className="text-[10px] font-normal px-2 py-0">
                                            {selectedState}: {categoryDistribution.reduce((sum, d) => sum + d.value, 0)}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <defs>
                                            {CHART_COLORS.map((color, i) => (
                                                <linearGradient key={i} id={`pieGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                                                    <stop offset="100%" stopColor={color} stopOpacity={0.5} />
                                                </linearGradient>
                                            ))}
                                        </defs>
                                        <Pie
                                            data={categoryDistribution}
                                            cx="50%" cy="50%"
                                            innerRadius={55} outerRadius={90}
                                            paddingAngle={3}
                                            dataKey="value"
                                            isAnimationActive={true}
                                            animationDuration={800}
                                        >
                                            {categoryDistribution.map((_, i) => (
                                                <Cell key={i} fill={`url(#pieGrad${i % CHART_COLORS.length})`} stroke="transparent" />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<ChartTooltip />} />
                                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Efficiency Frontier — full width */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-base">{language === 'en' ? 'Efficiency Frontier' : 'Frontera de Eficiencia'}</CardTitle>
                                    <p className="text-xs text-muted-foreground mt-0.5">{language === 'en' ? 'Ideal: high efficiency, low price (top-left)' : 'Ideal: alta eficiencia, bajo precio (arriba-izquierda)'}</p>
                                </div>
                                <Badge variant="outline" className="text-[10px] self-start sm:self-auto">Efficiency vs Price</Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[240px] sm:h-[340px] lg:h-[380px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ScatterChart margin={{ top: 16, right: 24, bottom: 32, left: 16 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                                            <XAxis type="number" dataKey="price" name="Price" unit="$" tick={{ fontSize: 11 }} label={{ value: 'Price (USD)', position: 'bottom', fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                                            <YAxis type="number" dataKey="efficiency" name="Efficiency" unit=" lm/W" tick={{ fontSize: 11 }} label={{ value: 'Efficiency (lm/W)', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                                            <ZAxis type="number" dataKey="lumens" range={[40, 300]} name="Lumens" />
                                            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                                                if (active && payload?.length) {
                                                    const d = payload[0].payload;
                                                    return (
                                                        <div className="rounded-xl border bg-card/95 p-3 shadow-xl backdrop-blur-sm text-xs">
                                                            <p className="font-bold">{d.name}</p>
                                                            <p className="text-muted-foreground">{d.brand}</p>
                                                            <div className="mt-1.5 space-y-0.5">
                                                                <div className="flex justify-between gap-4"><span>Price</span><span className="font-medium">${d.price.toFixed(2)}</span></div>
                                                                <div className="flex justify-between gap-4 text-green-600"><span>Efficacy</span><span className="font-medium">{d.efficiency} lm/W</span></div>
                                                                <div className="flex justify-between gap-4 text-blue-500"><span>Lumens</span><span className="font-medium">{d.lumens.toLocaleString()}</span></div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }} />
                                            <Legend verticalAlign="top" height={32} iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                                            {Array.from(new Set(frontierData.map(d => d.brand))).map((brand, i) => (
                                                <Scatter key={brand} name={brand} data={frontierData.filter(d => d.brand === brand)} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.75} />
                                            ))}
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Competitive Gap */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
                        <Card className="h-full shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">{language === 'en' ? 'Competitive Gap Analysis' : 'Análisis de Brechas'}</CardTitle>
                                <p className="text-xs text-muted-foreground">{language === 'en' ? 'Brand avg vs market avg' : 'Promedio de marca vs mercado'}</p>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {competitiveGaps.slice(0, 6).map((gap) => (
                                        <div key={gap.brand} className="space-y-1.5">
                                            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                                                <span className="text-sm font-semibold">{gap.brand}</span>
                                                <div className="flex gap-3 text-[10px] sm:text-xs">
                                                    <span className={gap.effGap >= 0 ? 'text-emerald-600 font-medium' : 'text-red-500'}>
                                                        Eff: {gap.effGap >= 0 ? '+' : ''}{gap.effGap.toFixed(1)}%
                                                    </span>
                                                    <span className={gap.priceGap <= 0 ? 'text-emerald-600 font-medium' : 'text-red-500'}>
                                                        Price: {gap.priceGap >= 0 ? '+' : ''}{gap.priceGap.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                    <div className={`h-full rounded-full transition-all duration-500 ${gap.effGap >= 0 ? 'bg-emerald-500' : 'bg-red-400'}`} style={{ width: `${Math.min(Math.max(50 + gap.effGap, 2), 100)}%` }} />
                                                </div>
                                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                    <div className={`h-full rounded-full transition-all duration-500 ${gap.priceGap <= 0 ? 'bg-emerald-500' : 'bg-red-400'}`} style={{ width: `${Math.min(Math.max(50 - gap.priceGap, 2), 100)}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Recent Changes */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                        <Card className="h-full shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">{language === 'en' ? 'Recent Spec Changes' : 'Cambios Recientes'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {recentChanges && recentChanges.length > 0 ? (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                        {recentChanges.map((change: any) => (
                                            <div key={change.id} className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3 transition-colors hover:bg-muted/40">
                                                <div className="mt-0.5 shrink-0 rounded-full bg-amber-100 p-1.5 dark:bg-amber-900/30">
                                                    <Activity className="h-3 w-3 text-amber-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-foreground">
                                                        {change.products?.brand} {change.products?.model}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        <span className="font-medium">{change.field_name}</span>:{' '}
                                                        <span className="text-red-500 line-through">{change.old_value}</span>
                                                        {' → '}
                                                        <span className="text-emerald-600 font-medium">{change.new_value}</span>
                                                    </p>
                                                    <p className="mt-1 text-[10px] text-muted-foreground/60">
                                                        {new Date(change.detected_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                        <Clock className="mb-2 h-8 w-8 opacity-30" />
                                        <p className="text-sm">{language === 'en' ? 'No changes detected yet' : 'Sin cambios detectados'}</p>
                                        <p className="text-xs opacity-70">{language === 'en' ? 'Runs after first scraper cycle' : 'Aparecerán tras el primer scraper'}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </section>
            </main>
        </div>
    );
}
