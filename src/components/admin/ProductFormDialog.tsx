import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import type { Region } from '@/lib/store';

interface ProductForm {
  brand: string; model: string; category: string; watts: string; lumens: string;
  cct: string; cri: string; lifespan: string; warranty: string;
  cert_ul: boolean; cert_dlc: boolean; cert_energy_star: boolean;
  price: string; currency: string; region_id: string; state_province: string;
  sales_channel: string; use_type: string; is_recommended: boolean;
}

const emptyForm: ProductForm = {
  brand: '', model: '', category: 'Bulb', watts: '', lumens: '', cct: '4000', cri: '80',
  lifespan: '25000', warranty: '3', cert_ul: false, cert_dlc: false, cert_energy_star: false,
  price: '', currency: 'USD', region_id: '', state_province: '', sales_channel: 'Distributor',
  use_type: 'Commercial', is_recommended: false,
};

// US States and Canadian Provinces
const US_STATES = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'],
  ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'], ['FL', 'Florida'], ['GA', 'Georgia'],
  ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'],
  ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'],
  ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'], ['MO', 'Missouri'],
  ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'],
  ['NM', 'New Mexico'], ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'],
  ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'],
  ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'],
  ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
];
const CA_PROVINCES = [
  ['AB', 'Alberta'], ['BC', 'British Columbia'], ['MB', 'Manitoba'], ['NB', 'New Brunswick'],
  ['NL', 'Newfoundland and Labrador'], ['NT', 'Northwest Territories'], ['NS', 'Nova Scotia'],
  ['NU', 'Nunavut'], ['ON', 'Ontario'], ['PE', 'Prince Edward Island'], ['QC', 'Quebec'],
  ['SK', 'Saskatchewan'], ['YT', 'Yukon'],
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editProduct: any | null;
  regions: Region[];
}

export default function ProductFormDialog({ open, onOpenChange, editProduct, regions }: Props) {
  const { language } = useAppStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editProduct) {
      setForm({
        brand: editProduct.brand, model: editProduct.model, category: editProduct.category,
        watts: String(editProduct.watts), lumens: String(editProduct.lumens), cct: String(editProduct.cct),
        cri: String(editProduct.cri), lifespan: String(editProduct.lifespan), warranty: String(editProduct.warranty),
        cert_ul: editProduct.cert_ul, cert_dlc: editProduct.cert_dlc, cert_energy_star: editProduct.cert_energy_star,
        price: String(editProduct.price), currency: editProduct.currency, region_id: editProduct.region_id || '',
        sales_channel: editProduct.sales_channel, use_type: editProduct.use_type,
        state_province: editProduct.state_province || '',
        is_recommended: editProduct.is_recommended,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editProduct, open]);

  const updateForm = (field: keyof ProductForm, value: any) => setForm((f) => ({ ...f, [field]: value }));

  async function handleSave() {
    setSaving(true);
    const payload = {
      brand: form.brand, model: form.model, category: form.category,
      watts: Number(form.watts), lumens: Number(form.lumens), cct: Number(form.cct),
      cri: Number(form.cri), lifespan: Number(form.lifespan), warranty: Number(form.warranty),
      cert_ul: form.cert_ul, cert_dlc: form.cert_dlc, cert_energy_star: form.cert_energy_star,
      price: Number(form.price), currency: form.currency, region_id: form.region_id || null,
      state_province: form.state_province || null,
      sales_channel: form.sales_channel, use_type: form.use_type, is_recommended: form.is_recommended,
    };

    let error;
    if (editProduct) {
      ({ error } = await supabase.from('products').update(payload).eq('id', editProduct.id));
    } else {
      ({ error } = await supabase.from('products').insert(payload));
    }

    setSaving(false);
    if (error) {
      toast({ title: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('productSaved', language) });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editProduct ? t('editProduct', language) : t('addProduct', language)}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">{t('brand', language)}</Label>
            <Input value={form.brand} onChange={(e) => updateForm('brand', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('model', language)}</Label>
            <Input value={form.model} onChange={(e) => updateForm('model', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('category', language)}</Label>
            <Select value={form.category} onValueChange={(v) => updateForm('category', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Bulb">Bulb</SelectItem>
                <SelectItem value="Panel">Panel</SelectItem>
                <SelectItem value="High Bay">High Bay</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('useType', language)}</Label>
            <Select value={form.use_type} onValueChange={(v) => updateForm('use_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Residential">Residential</SelectItem>
                <SelectItem value="Commercial">Commercial</SelectItem>
                <SelectItem value="Industrial">Industrial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('watts', language)}</Label>
            <Input type="number" value={form.watts} onChange={(e) => updateForm('watts', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('lumens', language)}</Label>
            <Input type="number" value={form.lumens} onChange={(e) => updateForm('lumens', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('cct', language)} (K)</Label>
            <Input type="number" value={form.cct} onChange={(e) => updateForm('cct', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('cri', language)}</Label>
            <Input type="number" value={form.cri} onChange={(e) => updateForm('cri', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('lifespan', language)} ({t('hours', language)})</Label>
            <Input type="number" value={form.lifespan} onChange={(e) => updateForm('lifespan', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('warranty', language)} ({t('years', language)})</Label>
            <Input type="number" value={form.warranty} onChange={(e) => updateForm('warranty', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('price', language)}</Label>
            <Input type="number" step="0.01" value={form.price} onChange={(e) => updateForm('price', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Currency</Label>
            <Select value={form.currency} onValueChange={(v) => updateForm('currency', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="CAD">CAD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('salesChannel', language)}</Label>
            <Select value={form.sales_channel} onValueChange={(v) => updateForm('sales_channel', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Distributor">Distributor</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('region', language)}</Label>
            <Select value={form.region_id} onValueChange={(v) => updateForm('region_id', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name} ({r.abbreviation})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* ── State / Province ── */}
          <div className="space-y-1.5">
            <Label className="text-xs">State / Province</Label>
            <Select value={form.state_province} onValueChange={(v) => updateForm('state_province', v)}>
              <SelectTrigger><SelectValue placeholder="Select state or province" /></SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="">— None —</SelectItem>
                <SelectItem value="__us__" disabled className="text-[10px] font-semibold uppercase text-muted-foreground">🇺🇸 United States</SelectItem>
                {US_STATES.map(([abbr, name]) => (
                  <SelectItem key={abbr} value={abbr}>{abbr} — {name}</SelectItem>
                ))}
                <SelectItem value="__ca__" disabled className="text-[10px] font-semibold uppercase text-muted-foreground">🇨🇦 Canada</SelectItem>
                {CA_PROVINCES.map(([abbr, name]) => (
                  <SelectItem key={abbr} value={abbr}>{abbr} — {name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1 sm:col-span-2 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Checkbox id="form-ul" checked={form.cert_ul} onCheckedChange={(c) => updateForm('cert_ul', !!c)} />
              <Label htmlFor="form-ul" className="text-xs">UL</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="form-dlc" checked={form.cert_dlc} onCheckedChange={(c) => updateForm('cert_dlc', !!c)} />
              <Label htmlFor="form-dlc" className="text-xs">DLC</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="form-es" checked={form.cert_energy_star} onCheckedChange={(c) => updateForm('cert_energy_star', !!c)} />
              <Label htmlFor="form-es" className="text-xs">Energy Star</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="form-rec" checked={form.is_recommended} onCheckedChange={(c) => updateForm('is_recommended', !!c)} />
              <Label htmlFor="form-rec" className="text-xs">⭐ {t('recommended', language)}</Label>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>{t('cancel', language)}</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? t('loading', language) : t('save', language)}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
