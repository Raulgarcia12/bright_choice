import { Star, Plus, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAppStore, type Product } from '@/lib/store';
import { calculateConvenienceScore } from '@/lib/convenienceScore';
import { t } from '@/lib/i18n';
import ledBulb from '@/assets/led-bulb.jpg';
import ledPanel from '@/assets/led-panel.jpg';
import ledHighbay from '@/assets/led-highbay.jpg';

const categoryImages: Record<string, string> = {
  Bulb: ledBulb,
  Panel: ledPanel,
  'High Bay': ledHighbay,
};

interface ProductCardProps {
  product: Product;
  allProducts: Product[];
}

export default function ProductCard({ product, allProducts }: ProductCardProps) {
  const { language, compareList, addToCompare, removeFromCompare } = useAppStore();
  const isInCompare = compareList.includes(product.id);
  const score = calculateConvenienceScore(product, allProducts, language);

  const scoreColor =
    score.total >= 70 ? 'hsl(var(--score-high))' : score.total >= 40 ? 'hsl(var(--score-medium))' : 'hsl(var(--score-low))';

  return (
    <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
      <Card className="group relative overflow-hidden border bg-card transition-shadow duration-300 hover:shadow-lg">
        {product.is_recommended && (
          <div className="absolute right-2 top-2 z-10">
            <Badge className="gap-1 bg-amber-500 text-white hover:bg-amber-600 shadow-sm">
              <Star className="h-3 w-3" />
              {t('recommended', language)}
            </Badge>
          </div>
        )}

        {/* Top accent bar */}
        <div
          className="h-1 w-full"
          style={{ background: `linear-gradient(90deg, ${scoreColor}, hsl(var(--primary)))` }}
        />

        <CardContent className="p-5">
          {/* Product image */}
          <div className="mb-3 flex justify-center rounded-lg bg-muted/20 p-3">
            <img
              src={categoryImages[product.category] || ledBulb}
              alt={`${product.brand} ${product.model}`}
              className="h-16 w-16 object-contain"
              loading="lazy"
            />
          </div>

          <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{product.brand}</div>
          <h3 className="mb-3 text-sm font-semibold leading-tight text-foreground">{product.model}</h3>

          <div className="mb-3 flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs">{t(product.category as any, language)}</Badge>
            <Badge variant="outline" className="text-xs">{t(product.use_type as any, language)}</Badge>
          </div>

          <div className="mb-3 text-2xl font-bold text-foreground">
            {product.currency === 'CAD' ? 'CA$' : '$'}{product.price.toFixed(2)}
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">{product.efficiency}</span> lm/W
            </div>
            <div>
              <span className="font-medium text-foreground">{product.lumens.toLocaleString()}</span> lm
            </div>
            <div>
              <span className="font-medium text-foreground">{product.warranty}</span> {t('years', language)}
            </div>
            <div>
              <span className="font-medium text-foreground">{(product.lifespan / 1000).toFixed(0)}K</span> {t('hours', language)}
            </div>
          </div>

          {/* Convenience Score */}
          <div className="mb-3 rounded-lg border bg-muted/20 p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{t('convenienceScore', language)}</span>
              <motion.span
                key={score.total}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-lg font-bold"
                style={{ color: scoreColor }}
              >
                {score.total}
              </motion.span>
            </div>
            <Progress value={score.total} className="h-2" />
          </div>

          {product.regions && (
            <div className="mb-3 text-xs text-muted-foreground">
              {product.regions.name} ({product.regions.abbreviation})
            </div>
          )}

          <Button
            variant={isInCompare ? 'default' : 'outline'}
            size="sm"
            className="w-full transition-all duration-200"
            onClick={() => (isInCompare ? removeFromCompare(product.id) : addToCompare(product.id))}
            disabled={!isInCompare && compareList.length >= 3}
          >
            {isInCompare ? (
              <>
                <Check className="mr-1 h-4 w-4" /> {t('remove', language)}
              </>
            ) : (
              <>
                <Plus className="mr-1 h-4 w-4" /> {t('compare', language)}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
