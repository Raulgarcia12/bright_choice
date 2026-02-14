import { useState, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import FilterSidebar, { defaultFilters, applyFilters, type Filters } from '@/components/FilterSidebar';
import ComparatorView from '@/components/ComparatorView';
import { useProducts } from '@/hooks/useProducts';
import { useAppStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const Index = () => {
  const { language, selectedRegion, compareList } = useAppStore();
  const { data: products, isLoading } = useProducts(selectedRegion);
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const allProducts = products || [];
  const filtered = useMemo(() => applyFilters(allProducts, filters), [allProducts, filters]);
  const compareProducts = useMemo(
    () => allProducts.filter((p) => compareList.includes(p.id)),
    [allProducts, compareList]
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Tabs defaultValue="catalog" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="catalog">
              {t('products', language)}
              {filtered.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">{filtered.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="compare">
              {t('comparator', language)}
              {compareList.length > 0 && (
                <Badge className="ml-2 text-xs">{compareList.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog">
            <div className="flex gap-6">
              {/* Filters sidebar */}
              <aside className="hidden w-64 shrink-0 lg:block">
                <div className="sticky top-20 rounded-lg border bg-card p-4">
                  <FilterSidebar products={allProducts} filters={filters} onFiltersChange={setFilters} />
                </div>
              </aside>

              {/* Product grid */}
              <div className="flex-1">
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-muted-foreground">{t('loading', language)}</div>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground/40" />
                    <p className="text-lg font-medium text-muted-foreground">{t('noResults', language)}</p>
                  </div>
                ) : (
                  <>
                    <p className="mb-4 text-sm text-muted-foreground">
                      {t('showingProducts', language, { count: filtered.length })}
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {filtered.map((product) => (
                        <ProductCard key={product.id} product={product} allProducts={allProducts} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="compare">
            <ComparatorView products={compareProducts} allProducts={allProducts} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
