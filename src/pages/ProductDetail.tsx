/**
 * Product Detail Page
 * Full product specs, version history timeline, and related products.
 */
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, History, ExternalLink, Shield, Award, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import { calculateConvenienceScore } from '@/lib/convenienceScore';
import { useProducts } from '@/hooks/useProducts';

export default function ProductDetail() {
    const { id } = useParams<{ id: string }>();
    const { language, selectedRegion } = useAppStore();
    const { data: allProducts } = useProducts(selectedRegion);

    // Fetch product detail
    const { data: product, isLoading } = useQuery({
        queryKey: ['product', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*, regions(name, abbreviation, country)')
                .eq('id', id!)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!id,
    });

    // Fetch version history
    const { data: versions } = useQuery({
        queryKey: ['productVersions', id],
        queryFn: async () => {
            const { data } = await supabase
                .from('product_versions')
                .select('*')
                .eq('product_id', id!)
                .order('version_number', { ascending: false });
            return data || [];
        },
        enabled: !!id,
    });

    // Fetch change logs for this product
    const { data: changes } = useQuery({
        queryKey: ['productChanges', id],
        queryFn: async () => {
            const { data } = await supabase
                .from('change_logs')
                .select('*')
                .eq('product_id', id!)
                .order('detected_at', { ascending: false })
                .limit(20);
            return data || [];
        },
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="flex items-center justify-center py-20">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent"
                    />
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="flex flex-col items-center justify-center py-20">
                    <p className="text-lg text-muted-foreground">Product not found</p>
                    <Link to="/">
                        <Button variant="outline" className="mt-4">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to catalog
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const score = allProducts
        ? calculateConvenienceScore(product as any, allProducts, language)
        : null;

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="mx-auto max-w-5xl px-4 py-6">
                {/* Back link */}
                <Link to="/" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back to catalog
                </Link>

                {/* Product Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium text-primary">{product.brand}</p>
                            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{product.model}</h1>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <Badge>{product.category}</Badge>
                                <Badge variant="outline">{product.use_type}</Badge>
                                <Badge variant="outline">{product.sales_channel}</Badge>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold text-foreground">
                                {product.currency === 'CAD' ? 'C$' : '$'}{product.price}
                            </p>
                            {score && (
                                <Badge className="mt-2 text-lg px-3 py-1" variant={score.total >= 70 ? 'default' : 'secondary'}>
                                    Score: {score.total}/100
                                </Badge>
                            )}
                        </div>
                    </div>
                </motion.div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Specs */}
                    <motion.div
                        className="lg:col-span-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle>Technical Specifications</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                    {[
                                        { label: 'Power', value: `${product.watts}W`, icon: Zap },
                                        { label: 'Lumens', value: `${product.lumens} lm` },
                                        { label: 'Efficacy', value: `${product.efficiency || '-'} lm/W` },
                                        { label: 'CCT', value: `${product.cct}K` },
                                        { label: 'CRI', value: `${product.cri}` },
                                        { label: 'Lifespan', value: `${(product.lifespan / 1000).toFixed(0)}k hrs` },
                                        { label: 'Warranty', value: `${product.warranty} yrs` },
                                    ].map((spec) => (
                                        <div key={spec.label} className="rounded-lg border bg-muted/30 p-3">
                                            <p className="text-xs text-muted-foreground">{spec.label}</p>
                                            <p className="mt-1 text-lg font-semibold">{spec.value}</p>
                                        </div>
                                    ))}
                                </div>

                                <Separator className="my-4" />

                                {/* Certifications */}
                                <div>
                                    <p className="mb-2 text-sm font-medium text-muted-foreground">Certifications</p>
                                    <div className="flex flex-wrap gap-2">
                                        {product.cert_ul && (
                                            <Badge variant="outline" className="gap-1">
                                                <Shield className="h-3 w-3" /> UL Listed
                                            </Badge>
                                        )}
                                        {product.cert_dlc && (
                                            <Badge variant="outline" className="gap-1">
                                                <Award className="h-3 w-3" /> DLC Certified
                                            </Badge>
                                        )}
                                        {product.cert_energy_star && (
                                            <Badge variant="outline" className="gap-1">
                                                <Award className="h-3 w-3" /> ENERGY STAR
                                            </Badge>
                                        )}
                                        {!product.cert_ul && !product.cert_dlc && !product.cert_energy_star && (
                                            <span className="text-sm text-muted-foreground">No certifications listed</span>
                                        )}
                                    </div>
                                </div>

                                {(product as any).product_url && (
                                    <a
                                        href={(product as any).product_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                    >
                                        View on manufacturer site <ExternalLink className="h-3 w-3" />
                                    </a>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Sidebar: Version History */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <History className="h-4 w-4" /> Version History
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {versions && versions.length > 0 ? (
                                    <div className="space-y-4">
                                        {versions.map((v: any) => (
                                            <div key={v.id} className="relative border-l-2 border-primary/20 pl-4">
                                                <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-primary" />
                                                <p className="text-sm font-semibold">Version {v.version_number}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(v.captured_at).toLocaleDateString()}
                                                </p>
                                                {v.change_summary && (
                                                    <p className="mt-1 text-xs text-muted-foreground">{v.change_summary}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No version history yet</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Change Log */}
                        {changes && changes.length > 0 && (
                            <Card className="mt-4">
                                <CardHeader>
                                    <CardTitle className="text-base">Change Log</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {changes.map((c: any) => (
                                            <div key={c.id} className="flex items-start gap-2 text-xs">
                                                <span className="font-medium text-foreground">{c.field_name}:</span>
                                                <span className="text-red-500 line-through">{c.old_value}</span>
                                                <span>→</span>
                                                <span className="text-green-600">{c.new_value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
