import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useAppStore, type Product } from '@/lib/store';
import { t } from '@/lib/i18n';

interface FilterSidebarProps {
  products: Product[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export interface Filters {
  category: string;
  useType: string;
  brand: string;
  priceRange: [number, number];
  certUl: boolean;
  certDlc: boolean;
  certEnergyStar: boolean;
}

export const defaultFilters: Filters = {
  category: 'all',
  useType: 'all',
  brand: 'all',
  priceRange: [0, 500],
  certUl: false,
  certDlc: false,
  certEnergyStar: false,
};

export function applyFilters(products: Product[], filters: Filters): Product[] {
  return products.filter((p) => {
    if (filters.category !== 'all' && p.category !== filters.category) return false;
    if (filters.useType !== 'all' && p.use_type !== filters.useType) return false;
    if (filters.brand !== 'all' && p.brand !== filters.brand) return false;
    if (p.price < filters.priceRange[0] || p.price > filters.priceRange[1]) return false;
    if (filters.certUl && !p.cert_ul) return false;
    if (filters.certDlc && !p.cert_dlc) return false;
    if (filters.certEnergyStar && !p.cert_energy_star) return false;
    return true;
  });
}

export default function FilterSidebar({ products, filters, onFiltersChange }: FilterSidebarProps) {
  const { language } = useAppStore();
  const brands = [...new Set(products.map((p) => p.brand))].sort();
  const maxPrice = Math.max(...products.map((p) => p.price), 500);

  const update = (partial: Partial<Filters>) => onFiltersChange({ ...filters, ...partial });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{t('filters', language)}</h2>
        <Button variant="ghost" size="sm" onClick={() => onFiltersChange(defaultFilters)} className="h-auto p-0 text-xs text-muted-foreground">
          <X className="mr-1 h-3 w-3" />{t('clearFilters', language)}
        </Button>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label className="text-xs">{t('category', language)}</Label>
        <Select value={filters.category} onValueChange={(v) => update({ category: v })}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allCategories', language)}</SelectItem>
            <SelectItem value="Bulb">{t('Bulb', language)}</SelectItem>
            <SelectItem value="Panel">{t('Panel', language)}</SelectItem>
            <SelectItem value="High Bay">{t('High Bay', language)}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Use type */}
      <div className="space-y-2">
        <Label className="text-xs">{t('useType', language)}</Label>
        <Select value={filters.useType} onValueChange={(v) => update({ useType: v })}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allUseTypes', language)}</SelectItem>
            <SelectItem value="Residential">{t('Residential', language)}</SelectItem>
            <SelectItem value="Commercial">{t('Commercial', language)}</SelectItem>
            <SelectItem value="Industrial">{t('Industrial', language)}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Brand */}
      <div className="space-y-2">
        <Label className="text-xs">{t('brand', language)}</Label>
        <Select value={filters.brand} onValueChange={(v) => update({ brand: v })}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allBrands', language)}</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price range */}
      <div className="space-y-2">
        <Label className="text-xs">{t('priceRange', language)}: ${filters.priceRange[0]} – ${filters.priceRange[1]}</Label>
        <Slider
          min={0}
          max={Math.ceil(maxPrice)}
          step={1}
          value={filters.priceRange}
          onValueChange={(v) => update({ priceRange: v as [number, number] })}
        />
      </div>

      {/* Certifications */}
      <div className="space-y-3">
        <Label className="text-xs">{t('certifications', language)}</Label>
        <div className="flex items-center gap-2">
          <Checkbox id="cert-ul" checked={filters.certUl} onCheckedChange={(c) => update({ certUl: !!c })} />
          <Label htmlFor="cert-ul" className="text-xs">UL</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="cert-dlc" checked={filters.certDlc} onCheckedChange={(c) => update({ certDlc: !!c })} />
          <Label htmlFor="cert-dlc" className="text-xs">DLC</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="cert-es" checked={filters.certEnergyStar} onCheckedChange={(c) => update({ certEnergyStar: !!c })} />
          <Label htmlFor="cert-es" className="text-xs">Energy Star</Label>
        </div>
      </div>
    </div>
  );
}
