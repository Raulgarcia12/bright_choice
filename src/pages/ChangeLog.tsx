/**
 * Change Log Page
 * Displays all detected spec changes across all products.
 * Filterable by brand, field, and date range.
 */
import { useState } from 'react';
import { Activity, Filter, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import { Link } from 'react-router-dom';

export default function ChangeLog() {
    const { language } = useAppStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedField, setSelectedField] = useState<string>('all');

    // Fetch all changes with product data
    const { data: changes, isLoading } = useQuery({
        queryKey: ['allChanges'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('change_logs')
                .select('*, products(id, brand, model, category)')
                .order('detected_at', { ascending: false })
                .limit(100);
            if (error) throw error;
            return data || [];
        },
    });

    // Get unique field names for the filter
    const fieldNames = [...new Set((changes || []).map((c: any) => c.field_name))].sort();

    // Filter changes
    const filteredChanges = (changes || []).filter((c: any) => {
        const matchesSearch =
            !searchTerm ||
            c.products?.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.products?.model?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesField = selectedField === 'all' || c.field_name === selectedField;
        return matchesSearch && matchesField;
    });

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="mx-auto max-w-5xl px-4 py-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                        {language === 'en' ? 'Change Log' : 'Registro de Cambios'}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {language === 'en'
                            ? 'Track every specification change across all tracked products'
                            : 'Seguimiento de cada cambio de especificación en todos los productos'}
                    </p>
                </motion.div>

                {/* Filters */}
                <div className="mb-6 flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by brand or model..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={selectedField} onValueChange={setSelectedField}>
                        <SelectTrigger className="w-[200px]">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Filter by field" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Fields</SelectItem>
                            {fieldNames.map((f) => (
                                <SelectItem key={f} value={f}>{f}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Results */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent"
                        />
                    </div>
                ) : filteredChanges.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Activity className="mb-4 h-12 w-12 text-muted-foreground/30" />
                            <p className="text-lg font-medium text-muted-foreground">No changes detected</p>
                            <p className="mt-1 text-sm text-muted-foreground/60">
                                Changes will appear here after the scraper runs
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {filteredChanges.map((change: any, index: number) => (
                            <motion.div
                                key={change.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: Math.min(index * 0.03, 0.3) }}
                            >
                                <Card className="hover:border-primary/30 transition-colors">
                                    <CardContent className="flex items-center gap-4 p-4">
                                        <div className="shrink-0 rounded-full bg-amber-100 p-2 dark:bg-amber-900/30">
                                            <Activity className="h-4 w-4 text-amber-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    to={`/products/${change.products?.id}`}
                                                    className="font-medium text-foreground hover:text-primary transition-colors"
                                                >
                                                    {change.products?.brand} {change.products?.model}
                                                </Link>
                                                <Badge variant="outline" className="text-xs">{change.products?.category}</Badge>
                                            </div>
                                            <p className="mt-1 text-sm">
                                                <span className="font-medium text-muted-foreground">{change.field_name}</span>
                                                {': '}
                                                <span className="text-red-500 line-through">{change.old_value || 'N/A'}</span>
                                                {' → '}
                                                <span className="text-green-600 font-medium">{change.new_value}</span>
                                            </p>
                                        </div>
                                        <p className="shrink-0 text-xs text-muted-foreground">
                                            {new Date(change.detected_at).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
