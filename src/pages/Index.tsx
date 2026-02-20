import { useState, useMemo, useEffect } from 'react';
import { BarChart3, Lightbulb, TrendingUp, Shield, SlidersHorizontal, X } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const Index = () => {
  const { language, selectedRegion, compareList } = useAppStore();
  const { data: products, isLoading } = useProducts(selectedRegion);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [activeTab, setActiveTab] = useState('catalog');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const allProducts = products || [];
  const filtered = useMemo(() => applyFilters(allProducts, filters), [allProducts, filters]);

  // Reset to page 1 whenever filters or products change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, allProducts]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

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
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              {language === 'en' ? 'Find the Best LED Products' : 'Encuentra los Mejores Productos LED'}
            </h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base sm:mt-3">
              {language === 'en'
                ? 'Compare specifications, pricing, and convenience scores across 250+ commercial LED products for the US & Canada market.'
                : 'Compara especificaciones, precios y scores de conveniencia en más de 250 productos LED comerciales para el mercado de EE.UU. y Canadá.'}
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mx-auto mt-6 grid max-w-3xl grid-cols-3 gap-3 sm:mt-8 sm:gap-4"
          >
            {[
              { icon: Lightbulb, value: `${allProducts.length}+`, label: language === 'en' ? 'Products' : 'Productos' },
              { icon: TrendingUp, value: '3', label: language === 'en' ? 'Categories' : 'Categorías' },
              { icon: Shield, value: '3', label: language === 'en' ? 'Certifications' : 'Certificaciones' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center rounded-xl border bg-card/80 p-3 backdrop-blur-sm sm:p-4">
                <stat.icon className="mb-1 h-4 w-4 text-primary sm:mb-2 sm:h-5 sm:w-5" />
                <span className="text-lg font-bold text-foreground sm:text-2xl">{stat.value}</span>
                <span className="text-[10px] text-muted-foreground sm:text-xs">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <main className="mx-auto max-w-7xl px-4 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="flex items-center gap-2">
            <TabsList className="grid w-full max-w-full grid-cols-2 bg-muted/30 p-1 sm:max-w-md">
              <TabsTrigger value="catalog" className="data-[state=active]:bg-card data-[state=active]:shadow-sm text-sm">
                {t('products', language)}
                {filtered.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">{filtered.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="compare" className="data-[state=active]:bg-card data-[state=active]:shadow-sm text-sm">
                {t('comparator', language)}
                {compareList.length > 0 && (
                  <Badge className="ml-2 text-xs">{compareList.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Mobile filter button */}
            {activeTab === 'catalog' && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden gap-1">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('filters', language)}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>{t('filters', language)}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <FilterSidebar products={allProducts} filters={filters} onFiltersChange={setFilters} />
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>

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
                    <aside className="hidden w-60 shrink-0 lg:block">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                        className="sticky top-20 rounded-xl border bg-card p-4 shadow-sm"
                      >
                        <FilterSidebar products={allProducts} filters={filters} onFiltersChange={setFilters} />
                      </motion.div>
                    </aside>

                    <div className="flex-1 min-w-0">
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
                          <div className="mb-4 flex flex-col justify-between gap-2 xs:flex-col sm:flex-row sm:items-center">
                            <p className="text-sm text-muted-foreground">
                              {t('showingProducts', language, { count: filtered.length })}
                            </p>

                            {/* Pagination Controls */}
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                              >
                                {language === 'en' ? '<' : '<'}
                              </Button>

                              <div className="flex items-center gap-1 mx-1">
                                {Array.from({ length: totalPages }).map((_, i) => {
                                  const p = i + 1;
                                  // Show first, last, current, and pages around current
                                  if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                                    return (
                                      <Button
                                        key={p}
                                        variant={currentPage === p ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-8 w-8 p-0 text-xs"
                                        onClick={() => setCurrentPage(p)}
                                      >
                                        {p}
                                      </Button>
                                    );
                                  }
                                  // Show dots
                                  if (p === currentPage - 2 || p === currentPage + 2) {
                                    return <span key={p} className="text-muted-foreground">...</span>;
                                  }
                                  return null;
                                })}
                              </div>

                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                              >
                                {language === 'en' ? '>' : '>'}
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {paginatedProducts.map((product, index) => (
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

                          {/* Bottom Pagination */}
                          {totalPages > 1 && (
                            <div className="mt-8 flex justify-center items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                              >
                                {'<'}
                              </Button>

                              <div className="flex items-center gap-1 mx-2">
                                {Array.from({ length: totalPages }).map((_, i) => {
                                  const p = i + 1;
                                  if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                                    return (
                                      <Button
                                        key={p}
                                        variant={currentPage === p ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-8 w-8 p-0 text-xs"
                                        onClick={() => setCurrentPage(p)}
                                      >
                                        {p}
                                      </Button>
                                    );
                                  }
                                  if (p === currentPage - 2 || p === currentPage + 2) {
                                    return <span key={p} className="text-muted-foreground">...</span>;
                                  }
                                  return null;
                                })}
                              </div>

                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                              >
                                {'>'}
                              </Button>
                            </div>
                          )}
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
