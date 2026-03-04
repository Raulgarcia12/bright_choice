/**
 * MarketIntelPanel — Slide-in panel showing retailer market intelligence
 * for a selected US state / Canadian province.
 * Triggered when user clicks a state on the GeoMap.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Package, Users, Building2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRetailersByState, type Retailer } from '@/hooks/useRetailers';
import { t, type Language } from '@/lib/i18n';

interface MarketIntelPanelProps {
    stateAbbr: string | null;
    onClose: () => void;
    language: Language;
}

function RetailerCard({ retailer, language }: { retailer: Retailer; language: Language }) {
    const clients = retailer.reported_clients || [];

    return (
        <Card className="border bg-card/80 backdrop-blur-sm shadow-md overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/60 to-primary/40" />
            <CardHeader className="pb-3 pt-4">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-base font-bold">{retailer.name}</CardTitle>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>
                                {retailer.address && `${retailer.address}, `}
                                {retailer.city && `${retailer.city}, `}
                                {retailer.state_province}
                            </span>
                        </div>
                    </div>
                    {retailer.website_url && (
                        <a href={retailer.website_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                        </a>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pb-4">
                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted/40 p-2.5">
                        <div className="flex items-center gap-1.5">
                            <Package className="h-3.5 w-3.5 text-primary" />
                            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                {t('miInventory', language)}
                            </span>
                        </div>
                        <p className="mt-1 text-lg font-bold">{retailer.inventory_count.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2.5">
                        <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-primary" />
                            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                {t('miBrands', language)}
                            </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                            {(retailer.primary_brands || []).map((brand) => (
                                <Badge key={brand} variant="secondary" className="text-[10px] px-1.5 py-0">
                                    {brand}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Reported clients table */}
                {clients.length > 0 && (
                    <div>
                        <div className="mb-2 flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-semibold">
                                {t('miClients', language)} ({clients.length})
                            </span>
                        </div>
                        <div className="rounded-lg border overflow-hidden">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-muted/50">
                                        <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">#</th>
                                        <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">
                                            {t('miClientName', language)}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clients.map((client, i) => (
                                        <tr key={i} className="border-t hover:bg-muted/20 transition-colors">
                                            <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                                            <td className="px-3 py-1.5 font-medium">{client.name}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function MarketIntelPanel({ stateAbbr, onClose, language }: MarketIntelPanelProps) {
    const { data: retailers, isLoading } = useRetailersByState(stateAbbr);

    return (
        <AnimatePresence>
            {stateAbbr && (
                <motion.div
                    key="market-intel-panel"
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.98 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="relative"
                >
                    <Card className="border-primary/20 shadow-lg overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-emerald-500 to-primary/50" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg bg-primary/10 p-2">
                                    <MapPin className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">
                                        {t('miTitle', language)}
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {t('miSubtitle', language).replace('{state}', stateAbbr)}
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="pb-4 space-y-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                </div>
                            ) : retailers && retailers.length > 0 ? (
                                retailers.map((retailer) => (
                                    <RetailerCard key={retailer.id} retailer={retailer} language={language} />
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                    <Building2 className="mb-2 h-8 w-8 opacity-30" />
                                    <p className="text-sm">{t('miNoRetailers', language)}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
