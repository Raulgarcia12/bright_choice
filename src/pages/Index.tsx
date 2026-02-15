import { useState, useMemo } from 'react';
import { BarChart3, Lightbulb, TrendingUp, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [activeTab, setActiveTab] = useState('catalog');

  const allProducts = products || [];
  const filtered = useMemo(() => applyFilters(allProducts, filters), [allProducts, filters]);
  const compareProducts = useMemo(
    () => allProducts.filter((p) => compareList.includes(p.id)),
    [allProducts, compareList]
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="border-b bg-gradient-to-br from-primary/5 via-background to-primary/10"
      >
        <div className="mx-auto max-w-7xl px-4 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {language === 'en' ? 'Find the Best LED Products' : 'Encuentra los Mejores Productos LED'}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
              {language === 'en'
                ? 'Compare specifications, pricing, and convenience scores across 100+ commercial LED products for the US & Canada market.'
                : 'Compara especificaciones, precios y scores de conveniencia en más de 100 productos LED comerciales para el mercado de EE.UU. y Canadá.'}
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mx-auto mt-8 grid max-w-3xl grid-cols-3 gap-4"
          >
            {[
              { icon: Lightbulb, value: `${allProducts.length}+`, label: language === 'en' ? 'Products' : 'Productos' },
              { icon: TrendingUp, value: '3', label: language === 'en' ? 'Categories' : 'Categorías' },
              { icon: Shield, value: '3', label: language === 'en' ? 'Certifications' : 'Certificaciones' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center rounded-xl border bg-card/80 p-4 backdrop-blur-sm">
                <stat.icon className="mb-2 h-5 w-5 text-primary" />
                <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted/30 p-1">
            <TabsTrigger value="catalog" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
              {t('products', language)}
              {filtered.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">{filtered.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="compare" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
              {t('comparator', language)}
              {compareList.length > 0 && (
                <Badge className="ml-2 text-xs">{compareList.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === 'catalog' && (
                <TabsContent value="catalog" forceMount className="mt-0">
                  <div className="flex gap-6">
                    <aside className="hidden w-64 shrink-0 lg:block">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                        className="sticky top-20 rounded-xl border bg-card p-4 shadow-sm"
                      >
                        <FilterSidebar products={allProducts} filters={filters} onFiltersChange={setFilters} />
                      </motion.div>
                    </aside>

                    <div className="flex-1">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent"
                          />
                        </div>
                      ) : filtered.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center justify-center py-20"
                        >
                          <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground/40" />
                          <p className="text-lg font-medium text-muted-foreground">{t('noResults', language)}</p>
                        </motion.div>
                      ) : (
                        <>
                          <p className="mb-4 text-sm text-muted-foreground">
                            {t('showingProducts', language, { count: filtered.length })}
                          </p>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {filtered.map((product, index) => (
                              <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.35 }}
                              >
                                <ProductCard product={product} allProducts={allProducts} />
                              </motion.div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </TabsContent>
              )}

              {activeTab === 'compare' && (
                <TabsContent value="compare" forceMount className="mt-0">
                  <ComparatorView products={compareProducts} allProducts={allProducts} />
                </TabsContent>
              )}
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
