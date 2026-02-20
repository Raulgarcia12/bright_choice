import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Globe, LogIn, LogOut, Shield, BarChart3, Menu, X,
  Moon, Sun, Package, Activity, LayoutDashboard,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/lib/i18n';
import { useTheme } from '@/hooks/useTheme';

const NAV_ITEMS = [
  { to: '/', label: 'Products', labelEs: 'Productos', icon: Package, exact: true },
  { to: '/dashboard', label: 'Dashboard', labelEs: 'Dashboard', icon: LayoutDashboard },
  { to: '/changes', label: 'Changes', labelEs: 'Cambios', icon: Activity },
];

export default function Header() {
  const { language, setLanguage } = useAppStore();
  const { session, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  function isActive(item: typeof NAV_ITEMS[0]) {
    return item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80 shadow-sm"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2 group">
          <div className="rounded-lg bg-primary p-1.5 transition-transform duration-200 group-hover:scale-105">
            <BarChart3 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="hidden text-base font-bold tracking-tight text-foreground sm:inline">
            {t('appName', language)}
          </span>
        </Link>

        {/* ── Desktop pill-nav ── */}
        <nav className="hidden flex-1 items-center justify-center md:flex">
          <div className="flex rounded-xl border bg-muted/40 p-1 gap-0.5">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${active
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/60'
                    }`}
                >
                  <item.icon className={`h-3.5 w-3.5 ${active ? 'text-primary' : ''}`} />
                  {language === 'es' ? item.labelEs : item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ── Desktop utilities ── */}
        <div className="hidden shrink-0 items-center gap-1 md:flex">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.25 }}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </motion.span>
            </AnimatePresence>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
            className="h-9 gap-1 rounded-lg font-semibold tracking-wide text-xs"
          >
            <Globe className="h-3.5 w-3.5" />
            {language === 'en' ? 'ES' : 'EN'}
          </Button>

          {session ? (
            <div className="flex items-center gap-1">
              {isAdmin && (
                <Button
                  variant={location.pathname === '/admin' ? 'default' : 'ghost'}
                  size="sm"
                  asChild
                  className="h-9 rounded-lg"
                >
                  <Link to="/admin">
                    <Shield className="mr-1 h-3.5 w-3.5" />
                    {t('admin', language)}
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={signOut} className="h-9 rounded-lg">
                <LogOut className="mr-1 h-3.5 w-3.5" />
                {t('logout', language)}
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" asChild className="h-9 rounded-lg">
              <Link to="/login">
                <LogIn className="mr-1 h-3.5 w-3.5" />
                {t('login', language)}
              </Link>
            </Button>
          )}
        </div>

        {/* ── Mobile hamburger ── */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={mobileOpen ? 'x' : 'menu'}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.span>
          </AnimatePresence>
        </Button>
      </div>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-t bg-card md:hidden"
          >
            <div className="space-y-1 px-4 py-3">
              {/* Nav items */}
              {NAV_ITEMS.map((item) => {
                const active = isActive(item);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {language === 'es' ? item.labelEs : item.label}
                  </Link>
                );
              })}

              <div className="h-px bg-border my-2" />

              {/* Utilities */}
              <div className="flex gap-2 py-1">
                <Button variant="outline" size="sm" className="flex-1" onClick={toggleTheme}>
                  {theme === 'dark'
                    ? <><Sun className="mr-1 h-4 w-4" />Light</>
                    : <><Moon className="mr-1 h-4 w-4" />Dark</>
                  }
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                >
                  <Globe className="mr-1 h-4 w-4" />
                  {language === 'en' ? 'Español' : 'English'}
                </Button>
              </div>

              {session ? (
                <div className="flex gap-2">
                  {isAdmin && (
                    <Button
                      variant="default"
                      size="sm"
                      asChild
                      className="flex-1"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Link to="/admin">
                        <Shield className="mr-1 h-4 w-4" />
                        {t('admin', language)}
                      </Link>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={signOut} className="flex-1">
                    <LogOut className="mr-1 h-4 w-4" />
                    {t('logout', language)}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full"
                  onClick={() => setMobileOpen(false)}
                >
                  <Link to="/login">
                    <LogIn className="mr-1 h-4 w-4" />
                    {t('login', language)}
                  </Link>
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
