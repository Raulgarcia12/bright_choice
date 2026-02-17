import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Globe, LogIn, LogOut, Shield, BarChart3, Menu, X, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { useRegions } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/lib/i18n';
import { useTheme } from '@/hooks/useTheme';

export default function Header() {
  const { language, setLanguage, selectedRegion, setSelectedRegion } = useAppStore();
  const { data: regions } = useRegions();
  const { session, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const usaRegions = regions?.filter((r) => r.country === 'USA') || [];
  const canadaRegions = regions?.filter((r) => r.country === 'Canada') || [];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="rounded-lg bg-primary p-1.5 transition-transform duration-200 group-hover:scale-105">
            <BarChart3 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-bold text-foreground tracking-tight">{t('appName', language)}</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-2 md:flex">
          <Select value={selectedRegion || 'all'} onValueChange={(v) => setSelectedRegion(v === 'all' ? null : v)}>
            <SelectTrigger className="w-[160px] h-9 bg-background/50 text-sm">
              <SelectValue placeholder={t('selectRegion', language)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allRegions', language)}</SelectItem>
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">USA</div>
              {usaRegions.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name} ({r.abbreviation})</SelectItem>
              ))}
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Canada</div>
              {canadaRegions.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name} ({r.abbreviation})</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button variant="ghost" size="sm" onClick={() => setLanguage(language === 'en' ? 'es' : 'en')} className="gap-1 font-medium h-9">
            <Globe className="h-4 w-4" />
            {language === 'en' ? 'ES' : 'EN'}
          </Button>

          {session ? (
            <div className="flex items-center gap-1">
              {isAdmin && (
                <Button variant={location.pathname === '/admin' ? 'default' : 'outline'} size="sm" asChild className="h-9">
                  <Link to="/admin"><Shield className="mr-1 h-4 w-4" />{t('admin', language)}</Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={signOut} className="h-9">
                <LogOut className="mr-1 h-4 w-4" />{t('logout', language)}
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" asChild className="h-9">
              <Link to="/login"><LogIn className="mr-1 h-4 w-4" />{t('login', language)}</Link>
            </Button>
          )}
        </div>

        {/* Mobile hamburger */}
        <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t bg-card md:hidden"
          >
            <div className="space-y-3 px-4 py-4">
              <Select value={selectedRegion || 'all'} onValueChange={(v) => setSelectedRegion(v === 'all' ? null : v)}>
                <SelectTrigger className="w-full h-10 bg-background/50">
                  <SelectValue placeholder={t('selectRegion', language)} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allRegions', language)}</SelectItem>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">USA</div>
                  {usaRegions.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name} ({r.abbreviation})</SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Canada</div>
                  {canadaRegions.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name} ({r.abbreviation})</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={toggleTheme}>
                  {theme === 'dark' ? <Sun className="mr-1 h-4 w-4" /> : <Moon className="mr-1 h-4 w-4" />}
                  {theme === 'dark' ? 'Light' : 'Dark'}
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}>
                  <Globe className="mr-1 h-4 w-4" />{language === 'en' ? 'Español' : 'English'}
                </Button>
              </div>

              {session ? (
                <div className="flex gap-2">
                  {isAdmin && (
                    <Button variant="default" size="sm" asChild className="flex-1" onClick={() => setMobileOpen(false)}>
                      <Link to="/admin"><Shield className="mr-1 h-4 w-4" />{t('admin', language)}</Link>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={signOut} className="flex-1">
                    <LogOut className="mr-1 h-4 w-4" />{t('logout', language)}
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" asChild className="w-full" onClick={() => setMobileOpen(false)}>
                  <Link to="/login"><LogIn className="mr-1 h-4 w-4" />{t('login', language)}</Link>
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
