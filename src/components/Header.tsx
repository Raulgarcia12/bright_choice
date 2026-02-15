import { Link, useLocation } from 'react-router-dom';
import { Globe, LogIn, LogOut, Shield, BarChart3, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { useRegions } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/lib/i18n';

export default function Header() {
  const { language, setLanguage, selectedRegion, setSelectedRegion, theme, setTheme } = useAppStore();
  const { data: regions } = useRegions();
  const { session, isAdmin, signOut } = useAuth();
  const location = useLocation();

  const usaRegions = regions?.filter((r) => r.country === 'USA') || [];
  const canadaRegions = regions?.filter((r) => r.country === 'Canada') || [];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="rounded-lg bg-primary p-1.5 transition-transform duration-200 group-hover:scale-105">
            <BarChart3 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">{t('appName', language)}</span>
        </Link>

        <div className="flex items-center gap-3">
          <Select value={selectedRegion || 'all'} onValueChange={(v) => setSelectedRegion(v === 'all' ? null : v)}>
            <SelectTrigger className="w-[180px] bg-background/50">
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

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="gap-1 font-medium"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
            className="gap-1 font-medium"
          >
            <Globe className="h-4 w-4" />
            {language === 'en' ? 'ES' : 'EN'}
          </Button>

          {session ? (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button variant={location.pathname === '/admin' ? 'default' : 'outline'} size="sm" asChild>
                  <Link to="/admin">
                    <Shield className="mr-1 h-4 w-4" />
                    {t('admin', language)}
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="mr-1 h-4 w-4" />
                {t('logout', language)}
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link to="/login">
                <LogIn className="mr-1 h-4 w-4" />
                {t('login', language)}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
