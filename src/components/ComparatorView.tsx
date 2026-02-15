import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Trophy, DollarSign, Zap, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAppStore, type Product } from '@/lib/store';
import { calculateConvenienceScore } from '@/lib/convenienceScore';
import { t } from '@/lib/i18n';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ComparatorViewProps {
  products: Product[];
  allProducts: Product[];
}

export default function ComparatorView({ products, allProducts }: ComparatorViewProps) {
  const { language, removeFromCompare, clearCompare } = useAppStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const scored = useMemo(
    () =>
      products.map((p) => ({
        product: p,
        score: calculateConvenienceScore(p, allProducts, language),
      })),
    [products, allProducts, language]
  );

  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-16 text-center"
      >
        <Trophy className="mb-4 h-14 w-14 text-muted-foreground/30" />
        <p className="text-lg font-semibold text-muted-foreground">{t('noProductsToCompare', language)}</p>
        <p className="mt-2 text-sm text-muted-foreground/70">{t('addProducts', language)}</p>
      </motion.div>
    );
  }

  const bestPrice = scored.reduce((a, b) => (a.product.price < b.product.price ? a : b));
  const bestEff = scored.reduce((a, b) => (a.product.efficiency > b.product.efficiency ? a : b));
  const bestLife = scored.reduce((a, b) => (a.product.lifespan > b.product.lifespan ? a : b));
  const bestWarranty = scored.reduce((a, b) => (a.product.warranty > b.product.warranty ? a : b));

  function getBadges(productId: string) {
    const badges: { label: string; icon: React.ReactNode }[] = [];
    if (scored.length > 1) {
      if (bestPrice.product.id === productId) badges.push({ label: t('bestPrice', language), icon: <DollarSign className="h-3 w-3" /> });
      if (bestEff.product.id === productId) badges.push({ label: t('bestEfficiency', language), icon: <Zap className="h-3 w-3" /> });
      if (bestLife.product.id === productId) badges.push({ label: t('bestDurability', language), icon: <Clock className="h-3 w-3" /> });
      if (bestWarranty.product.id === productId) badges.push({ label: t('bestWarranty', language), icon: <Trophy className="h-3 w-3" /> });
    }
    return badges;
  }

  function getCellClass(productId: string, field: string): string {
    if (scored.length <= 1) return '';
    const vals = scored.map((s) => ({ id: s.product.id, val: (s.product as any)[field] }));
    const best = field === 'price' ? Math.min(...vals.map((v) => v.val)) : Math.max(...vals.map((v) => v.val));
    const worst = field === 'price' ? Math.max(...vals.map((v) => v.val)) : Math.min(...vals.map((v) => v.val));
    const current = vals.find((v) => v.id === productId)?.val;
    if (current === best) return 'text-score-high font-semibold';
    if (current === worst) return 'text-muted-foreground';
    return '';
  }

  const specRows = [
    { key: 'price', label: t('price', language), format: (p: Product) => `${p.currency === 'CAD' ? 'CA$' : '$'}${p.price.toFixed(2)}` },
    { key: 'efficiency', label: t('efficiency', language), format: (p: Product) => `${p.efficiency} lm/W` },
    { key: 'lumens', label: t('lumens', language), format: (p: Product) => `${p.lumens.toLocaleString()} lm` },
    { key: 'watts', label: t('watts', language), format: (p: Product) => `${p.watts}W` },
    { key: 'cct', label: t('cct', language), format: (p: Product) => `${p.cct}K` },
    { key: 'cri', label: t('cri', language), format: (p: Product) => `${p.cri}` },
    { key: 'lifespan', label: t('lifespan', language), format: (p: Product) => `${(p.lifespan / 1000).toFixed(0)}K ${t('hours', language)}` },
    { key: 'warranty', label: t('warranty', language), format: (p: Product) => `${p.warranty} ${t('years', language)}` },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">{t('compareProducts', language)}</h2>
        <Button variant="ghost" size="sm" onClick={clearCompare}>{t('clearAll', language)}</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {scored.map(({ product: p, score }, index) => {
            const scoreColor = score.total >= 70 ? 'hsl(var(--score-high))' : score.total >= 40 ? 'hsl(var(--score-medium))' : 'hsl(var(--score-low))';
            const badges = getBadges(p.id);
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                layout
              >
                <Card className="relative overflow-hidden">
                  <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${scoreColor}, hsl(var(--primary)))` }} />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{p.brand}</div>
                        <h3 className="text-sm font-semibold text-foreground">{p.model}</h3>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeFromCompare(p.id)} className="h-6 px-2 text-xs">✕</Button>
                    </div>
                    {badges.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {badges.map((b) => (
                          <Badge key={b.label} className="gap-1 bg-score-high/10 text-score-high border-score-high/20 text-xs">
                            {b.icon}{b.label}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{t('convenienceScore', language)}</span>
                        <motion.span
                          key={score.total}
                          initial={{ scale: 0.5 }}
                          animate={{ scale: 1 }}
                          className="text-xl font-bold"
                          style={{ color: scoreColor }}
                        >
                          {score.total}
                        </motion.span>
                      </div>
                      <Progress value={score.total} className="h-2" />
                    </div>

                    <div className="space-y-1">
                      {specRows.map((row) => (
                        <div key={row.key} className="flex justify-between text-xs py-1 border-b border-border/50 last:border-0">
                          <span className="text-muted-foreground">{row.label}</span>
                          <span className={getCellClass(p.id, row.key)}>{row.format(p)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-1">
                      {p.cert_ul && <Badge variant="outline" className="text-xs">UL</Badge>}
                      {p.cert_dlc && <Badge variant="outline" className="text-xs">DLC</Badge>}
                      {p.cert_energy_star && <Badge variant="outline" className="text-xs">E★</Badge>}
                    </div>

                    <Collapsible open={expandedId === p.id} onOpenChange={(open) => setExpandedId(open ? p.id : null)}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                          {t('whyBetter', language)}
                          {expandedId === p.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-1 rounded-md bg-muted/30 p-3 text-xs"
                        >
                          {score.explanations.length > 0 ? (
                            score.explanations.map((ex, i) => <div key={i} className="text-muted-foreground">• {ex}</div>)
                          ) : (
                            <div className="text-muted-foreground">Score: {score.total}/100</div>
                          )}
                        </motion.div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
