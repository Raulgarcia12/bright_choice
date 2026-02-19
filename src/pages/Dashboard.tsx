/**
 * Dashboard Page
 * KPI metrics, trend charts, and recent changes overview.
 */
import { useMemo } from 'react';
import { BarChart3, TrendingUp, Zap, DollarSign, Activity, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    PieChart, Pie, Cell,
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

                    {/* Efficiency Radar */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Avg Efficacy by Brand (lm/W)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RadarChart data={efficiencyByBrand}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="brand" tick={{ fontSize: 11 }} />
                                        <PolarRadiusAxis tick={{ fontSize: 10 }} />
                                        <Radar dataKey="efficiency" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Category Distribution */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Category Distribution</CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center">
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={categoryDistribution}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {categoryDistribution.map((_, index) => (
                                                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
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
