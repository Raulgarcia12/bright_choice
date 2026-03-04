import { Star, Plus, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAppStore, type Product } from '@/lib/store';
import { calculateConvenienceScore } from '@/lib/convenienceScore';
import { t, type TranslationKey } from '@/lib/i18n';
import { useBestPricesByState } from '@/hooks/useRetailers';

interface ProductCardProps {
  product: Product;
  allProducts: Product[];
}

export default function ProductCard({ product, allProducts }: ProductCardProps) {
  const { language, compareList, addToCompare, removeFromCompare, selectedState } = useAppStore();
  const isInCompare = compareList.includes(product.id);

  const { data: bestPrices } = useBestPricesByState(selectedState);

  const retailerInfo = bestPrices?.[product.id] ? {
    bestPrice: bestPrices[product.id].price,
    retailerName: bestPrices[product.id].retailer_name
  } : undefined;

  const score = calculateConvenienceScore(product, allProducts, language, retailerInfo);

  const scoreColor =
    score.total >= 70 ? 'hsl(var(--score-high))' : score.total >= 40 ? 'hsl(var(--score-medium))' : 'hsl(var(--score-low))';

  return (
    <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
      <Card className="group relative overflow-hidden border bg-card transition-shadow duration-300 hover:shadow-lg">
        {product.is_recommended && (
          <div className="absolute right-2 top-2 z-10">
            <Badge className="gap-1 bg-amber-500 text-white hover:bg-amber-600 shadow-sm text-[10px] sm:text-xs">
              <Star className="h-3 w-3" />
              <span className="hidden sm:inline">{t('recommended', language)}</span>
              <span className="sm:hidden">⭐</span>
            </Badge>
          </div>
        )}

        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${scoreColor}, hsl(var(--primary)))` }} />

        <CardContent className="p-4 sm:p-5">
          <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">{product.brand}</div>
          <h3 className="mb-2 text-sm font-semibold leading-tight text-foreground sm:mb-3">{product.model}</h3>

          <div className="mb-2 flex flex-wrap gap-1 sm:mb-3">
            <Badge variant="secondary" className="text-[10px] sm:text-xs">{t(product.category as TranslationKey, language)}</Badge>
            <Badge variant="outline" className="text-[10px] sm:text-xs">{t(product.use_type as TranslationKey, language)}</Badge>
            {product.seller_name && (
              <Badge variant="outline" className="text-[10px] sm:text-xs border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
                🏪 {product.seller_name}
              </Badge>
            )}
            {product.state_province && (
              <Badge variant="outline" className="text-[10px] sm:text-xs border-blue-500/40 text-blue-700 dark:text-blue-400">
                📍 {product.state_province}
              </Badge>
            )}
          </div>

          <div className="mb-2 grid grid-cols-2 gap-1.5 text-[11px] text-muted-foreground sm:mb-3 sm:gap-2 sm:text-xs">
            <div><span className="font-medium text-foreground">{product.efficiency}</span> lm/W</div>
            <div><span className="font-medium text-foreground">{product.lumens.toLocaleString()}</span> lm</div>
            <div><span className="font-medium text-foreground">{product.warranty}</span> {t('years', language)}</div>
            <div><span className="font-medium text-foreground">{(product.lifespan / 1000).toFixed(0)}K</span> {t('hours', language)}</div>
          </div>

          {retailerInfo && (
            <div className="mb-2 flex items-center justify-between rounded bg-emerald-500/10 px-2 py-1.5 text-xs text-emerald-700 dark:text-emerald-400">
              <span className="font-medium">Retail local: ${retailerInfo.bestPrice.toFixed(2)}</span>
              <span className="truncate max-w-[120px] text-[10px] opacity-80" title={retailerInfo.retailerName}>{retailerInfo.retailerName}</span>
            </div>
          )}
          {/* Convenience Score */}
          <div className="mb-2 rounded-lg border bg-muted/20 p-2 sm:mb-3 sm:p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground sm:text-xs">{t('convenienceScore', language)}</span>
              <motion.span
                key={score.total}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-base font-bold sm:text-lg"
                style={{ color: scoreColor }}
              >
                {score.total}
              </motion.span>
            </div>
            <Progress value={score.total} className="h-1.5 sm:h-2" />
          </div>

          {product.regions && (
            <div className="mb-2 text-[10px] text-muted-foreground sm:mb-3 sm:text-xs">
              {product.regions.name} ({product.regions.abbreviation})
            </div>
          )}

          <Button
            variant={isInCompare ? 'default' : 'outline'}
            size="sm"
            className="w-full text-xs transition-all duration-200"
            onClick={() => (isInCompare ? removeFromCompare(product.id) : addToCompare(product.id))}
            disabled={!isInCompare && compareList.length >= 3}
          >
            {isInCompare ? (
              <><Check className="mr-1 h-3.5 w-3.5" /> {t('remove', language)}</>
            ) : (
              <><Plus className="mr-1 h-3.5 w-3.5" /> {t('compare', language)}</>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div >
  );
}
