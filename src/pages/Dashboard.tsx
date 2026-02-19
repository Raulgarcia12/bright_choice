/**
 * Dashboard Page
 * KPI metrics, trend charts, and recent changes overview.
 */
import { useMemo } from 'react';
import { BarChart3, TrendingUp, Zap, DollarSign, Activity, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    RadarChart, Radar, PolarAngleAxis, PolarRadiusAxis,
    PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, Legend, CartesianGrid
} from 'recharts';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/useProducts';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function KPICard({ title, value, subtitle, icon: Icon, trend }: {
    title: string; value: string; subtitle: string;
    icon: React.ElementType; trend?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <Card className="relative overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{title}</p>
                            <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
                        </div>
                        <div className="rounded-xl bg-primary/10 p-3">
                            <Icon className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    {trend && (
                        <Badge variant="secondary" className="mt-3 text-xs">
                            <TrendingUp className="mr-1 h-3 w-3" /> {trend}
                        </Badge>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default function Dashboard() {
    const { selectedRegion, language } = useAppStore();
    const { data: products } = useProducts(selectedRegion);
    const allProducts = products || [];

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

    // Compute KPIs
    const kpis = useMemo(() => {
        if (allProducts.length === 0) return null;

        const avgEfficiency = allProducts.reduce((s, p) => s + (p.efficiency || 0), 0) / allProducts.length;
        const avgPrice = allProducts.reduce((s, p) => s + p.price, 0) / allProducts.length;
        const avgCRI = allProducts.reduce((s, p) => s + p.cri, 0) / allProducts.length;
        const brands = new Set(allProducts.map((p) => p.brand));
        const certDLC = allProducts.filter((p) => p.cert_dlc).length;

        return {
            totalProducts: allProducts.length,
            avgEfficiency: avgEfficiency.toFixed(1),
            avgPrice: avgPrice.toFixed(2),
            avgCRI: Math.round(avgCRI),
            brandCount: brands.size,
            certDLCPercent: ((certDLC / allProducts.length) * 100).toFixed(0),
        };
    }, [allProducts]);

    // Brand distribution data for bar chart
    const brandDistribution = useMemo(() => {
        const counts = new Map<string, number>();
        allProducts.forEach((p) => counts.set(p.brand, (counts.get(p.brand) || 0) + 1));
        return Array.from(counts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);
    }, [allProducts]);

    // Category distribution for pie chart
    const categoryDistribution = useMemo(() => {
        const counts = new Map<string, number>();
        allProducts.forEach((p) => counts.set(p.category, (counts.get(p.category) || 0) + 1));
        return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
    }, [allProducts]);

    // Efficiency Frontier Data (Price vs Efficiency)
    const frontierData = useMemo(() => {
        return allProducts
            .filter(p => p.price > 0 && p.efficiency > 0)
            .map(p => ({
                name: `${p.brand} ${p.model}`,
                brand: p.brand,
                price: p.price,
                efficiency: p.efficiency,
                lumens: p.lumens
            }));
    }, [allProducts]);

    // Competitive Gaps: Brands vs Market Average
    const competitiveGaps = useMemo(() => {
        if (allProducts.length === 0) return [];
        const marketAvgEff = allProducts.reduce((s, p) => s + (p.efficiency || 0), 0) / allProducts.length;
        const marketAvgPrice = allProducts.reduce((s, p) => s + p.price, 0) / allProducts.length;

        const brandStats = new Map<string, { totalEff: number; totalPrice: number; count: number }>();
        allProducts.forEach(p => {
            const s = brandStats.get(p.brand) || { totalEff: 0, totalPrice: 0, count: 0 };
            s.totalEff += p.efficiency || 0;
            s.totalPrice += p.price || 0;
            s.count += 1;
            brandStats.set(p.brand, s);
        });

        return Array.from(brandStats.entries()).map(([brand, s]) => {
            const brandAvgEff = s.totalEff / s.count;
            const brandAvgPrice = s.totalPrice / s.count;
            return {
                brand,
                effGap: ((brandAvgEff - marketAvgEff) / marketAvgEff) * 100,
                priceGap: ((brandAvgPrice - marketAvgPrice) / marketAvgPrice) * 100
            };
        }).sort((a, b) => b.effGap - a.effGap);
    }, [allProducts]);

    // Efficiency by brand for radar chart
    const efficiencyByBrand = useMemo(() => {
        const brandMap = new Map<string, { totalEff: number; count: number }>();
        allProducts.forEach((p) => {
            const entry = brandMap.get(p.brand) || { totalEff: 0, count: 0 };
            entry.totalEff += p.efficiency || 0;
            entry.count += 1;
            brandMap.set(p.brand, entry);
        });
        return Array.from(brandMap.entries())
            .map(([brand, data]) => ({
                brand,
                efficiency: Math.round(data.totalEff / data.count),
            }))
            .sort((a, b) => b.efficiency - a.efficiency)
            .slice(0, 6);
    }, [allProducts]);

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="mx-auto max-w-7xl px-4 py-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                        {language === 'en' ? 'Intelligence Dashboard' : 'Panel de Inteligencia'}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {language === 'en'
                            ? 'Real-time competitive insights for the North American lighting market'
                            : 'Insights competitivos en tiempo real para el mercado de iluminación norteamericano'}
                    </p>
                </motion.div>

                {/* KPI Cards */}
                {kpis && (
                    <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                        <KPICard icon={BarChart3} title="Products" value={String(kpis.totalProducts)} subtitle="In catalog" />
                        <KPICard icon={Zap} title="Avg Efficacy" value={`${kpis.avgEfficiency}`} subtitle="lm/W" trend="+2.3% vs last quarter" />
                        <KPICard icon={DollarSign} title="Avg Price" value={`$${kpis.avgPrice}`} subtitle="USD" />
                        <KPICard icon={Activity} title="Avg CRI" value={String(kpis.avgCRI)} subtitle="Color Rendering" />
                        <KPICard icon={TrendingUp} title="Brands" value={String(kpis.brandCount)} subtitle="Tracked" />
                        <KPICard icon={Clock} title="DLC Certified" value={`${kpis.certDLCPercent}%`} subtitle="Of catalog" />
                    </div>
                )}

                {/* Charts Grid */}
                <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Brand Distribution */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Products by Brand</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={brandDistribution}>
                                        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Efficiency Frontier (Scatter Plot) */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg">Efficiency Frontier (Value Analysis)</CardTitle>
                                <Badge variant="outline" className="text-[10px] bg-primary/5">Efficiency vs Price</Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[400px] w-full mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                type="number"
                                                dataKey="price"
                                                name="Price"
                                                unit="$"
                                                label={{ value: 'Price (USD)', position: 'bottom', fontSize: 12 }}
                                            />
                                            <YAxis
                                                type="number"
                                                dataKey="efficiency"
                                                name="Efficiency"
                                                unit=" lm/W"
                                                label={{ value: 'Efficiency (lm/W)', angle: -90, position: 'insideLeft', fontSize: 12 }}
                                            />
                                            <ZAxis type="number" dataKey="lumens" range={[60, 400]} name="Lumens" />
                                            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-background border rounded-lg p-3 shadow-xl">
                                                            <p className="font-bold text-sm">{data.name}</p>
                                                            <p className="text-xs text-muted-foreground">{data.brand}</p>
                                                            <div className="mt-2 space-y-1">
                                                                <div className="flex justify-between gap-4 text-xs font-medium">
                                                                    <span>Price:</span>
                                                                    <span>${data.price.toFixed(2)}</span>
                                                                </div>
                                                                <div className="flex justify-between gap-4 text-xs font-medium text-green-600">
                                                                    <span>Efficacy:</span>
                                                                    <span>{data.efficiency} lm/W</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }} />
                                            <Legend verticalAlign="top" height={36} />
                                            {Array.from(new Set(frontierData.map(d => d.brand))).map((brand, i) => (
                                                <Scatter
                                                    key={brand}
                                                    name={brand}
                                                    data={frontierData.filter(d => d.brand === brand)}
                                                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                                                />
                                            ))}
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                </div>
                                <p className="mt-4 text-[11px] text-center text-muted-foreground italic">
                                    Targets: High Efficiency (Up) and Low Price (Left).
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Competitive Gap Table */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle className="text-lg">Competitive Gap Analysis</CardTitle>
                                <p className="text-xs text-muted-foreground">Brand Average vs Market Average</p>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {competitiveGaps.slice(0, 5).map((gap) => (
                                        <div key={gap.brand} className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-sm font-semibold">{gap.brand}</span>
                                                <div className="flex gap-3 text-[10px]">
                                                    <span className={gap.effGap >= 0 ? 'text-green-600' : 'text-red-500'}>
                                                        Eff: {gap.effGap >= 0 ? '+' : ''}{gap.effGap.toFixed(1)}%
                                                    </span>
                                                    <span className={gap.priceGap <= 0 ? 'text-green-600' : 'text-red-500'}>
                                                        Price: {gap.priceGap >= 0 ? '+' : ''}{gap.priceGap.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                    <div className={`h-full ${gap.effGap >= 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(Math.max(50 + gap.effGap, 0), 100)}%` }} />
                                                </div>
                                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                    <div className={`h-full ${gap.priceGap <= 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(Math.max(50 - gap.priceGap, 0), 100)}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Recent Changes */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Recent Spec Changes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {recentChanges && recentChanges.length > 0 ? (
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                        {recentChanges.map((change: any) => (
                                            <div key={change.id} className="flex items-start gap-3 rounded-lg border p-3">
                                                <div className="mt-0.5 rounded-full bg-amber-100 p-1.5 dark:bg-amber-900/30">
                                                    <Activity className="h-3 w-3 text-amber-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">
                                                        {change.products?.brand} {change.products?.model}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        <span className="font-medium">{change.field_name}</span>:{' '}
                                                        <span className="text-red-500 line-through">{change.old_value}</span>
                                                        {' → '}
                                                        <span className="text-green-600">{change.new_value}</span>
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
                                        <p className="text-sm">No changes detected yet</p>
                                        <p className="text-xs">Changes will appear after the first scraper run</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
