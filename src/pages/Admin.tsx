import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProducts, useRegions } from '@/hooks/useProducts';
import { useAppStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ProductForm {
  brand: string;
  model: string;
  category: string;
  watts: string;
  lumens: string;
  cct: string;
  cri: string;
  lifespan: string;
  warranty: string;
  cert_ul: boolean;
  cert_dlc: boolean;
  cert_energy_star: boolean;
  price: string;
  currency: string;
  region_id: string;
  sales_channel: string;
  use_type: string;
  is_recommended: boolean;
}

const emptyForm: ProductForm = {
  brand: '', model: '', category: 'Bulb', watts: '', lumens: '', cct: '4000', cri: '80',
  lifespan: '25000', warranty: '3', cert_ul: false, cert_dlc: false, cert_energy_star: false,
  price: '', currency: 'USD', region_id: '', sales_channel: 'Distributor', use_type: 'Commercial', is_recommended: false,
};

export default function AdminPage() {
  const { language } = useAppStore();
  const { session, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: products, isLoading } = useProducts(null);
  const { data: regions } = useRegions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && (!session || !isAdmin)) {
      navigate('/login');
    }
  }, [session, isAdmin, authLoading, navigate]);

  if (authLoading || !isAdmin) return null;

  const filtered = (products || []).filter((p) =>
    `${p.brand} ${p.model}`.toLowerCase().includes(search.toLowerCase())
  );

  function openEdit(product: any) {
    setEditId(product.id);
    setForm({
      brand: product.brand, model: product.model, category: product.category,
      watts: String(product.watts), lumens: String(product.lumens), cct: String(product.cct),
      cri: String(product.cri), lifespan: String(product.lifespan), warranty: String(product.warranty),
      cert_ul: product.cert_ul, cert_dlc: product.cert_dlc, cert_energy_star: product.cert_energy_star,
      price: String(product.price), currency: product.currency, region_id: product.region_id || '',
      sales_channel: product.sales_channel, use_type: product.use_type, is_recommended: product.is_recommended,
    });
    setDialogOpen(true);
  }

  function openNew() {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      brand: form.brand, model: form.model, category: form.category,
      watts: Number(form.watts), lumens: Number(form.lumens), cct: Number(form.cct),
      cri: Number(form.cri), lifespan: Number(form.lifespan), warranty: Number(form.warranty),
      cert_ul: form.cert_ul, cert_dlc: form.cert_dlc, cert_energy_star: form.cert_energy_star,
      price: Number(form.price), currency: form.currency, region_id: form.region_id || null,
      sales_channel: form.sales_channel, use_type: form.use_type, is_recommended: form.is_recommended,
    };

    let error;
    if (editId) {
      ({ error } = await supabase.from('products').update(payload).eq('id', editId));
    } else {
      ({ error } = await supabase.from('products').insert(payload));
    }

    setSaving(false);
    if (error) {
      toast({ title: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('productSaved', language) });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    const { error } = await supabase.from('products').delete().eq('id', deleteId);
    if (error) {
      toast({ title: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('productDeleted', language) });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
    setDeleteId(null);
  }

  const updateForm = (field: keyof ProductForm, value: any) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">{t('adminPanel', language)}</h1>
          <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />{t('addProduct', language)}</Button>
        </div>

        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('brand', language)}</TableHead>
                <TableHead>{t('model', language)}</TableHead>
                <TableHead>{t('category', language)}</TableHead>
                <TableHead>{t('price', language)}</TableHead>
                <TableHead>{t('efficiency', language)}</TableHead>
                <TableHead>{t('region', language)}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.brand}</TableCell>
                  <TableCell>{p.model}</TableCell>
                  <TableCell><Badge variant="secondary">{p.category}</Badge></TableCell>
                  <TableCell>{p.currency === 'CAD' ? 'CA$' : '$'}{p.price}</TableCell>
                  <TableCell>{p.efficiency} lm/W</TableCell>
                  <TableCell>{p.regions?.abbreviation || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Product form dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editId ? t('editProduct', language) : t('addProduct', language)}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('brand', language)}</Label>
              <Input value={form.brand} onChange={(e) => updateForm('brand', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('model', language)}</Label>
              <Input value={form.model} onChange={(e) => updateForm('model', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('category', language)}</Label>
              <Select value={form.category} onValueChange={(v) => updateForm('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bulb">Bulb</SelectItem>
                  <SelectItem value="Panel">Panel</SelectItem>
                  <SelectItem value="High Bay">High Bay</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('useType', language)}</Label>
              <Select value={form.use_type} onValueChange={(v) => updateForm('use_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Residential">Residential</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Industrial">Industrial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('watts', language)}</Label>
              <Input type="number" value={form.watts} onChange={(e) => updateForm('watts', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('lumens', language)}</Label>
              <Input type="number" value={form.lumens} onChange={(e) => updateForm('lumens', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('cct', language)} (K)</Label>
              <Input type="number" value={form.cct} onChange={(e) => updateForm('cct', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('cri', language)}</Label>
              <Input type="number" value={form.cri} onChange={(e) => updateForm('cri', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('lifespan', language)} ({t('hours', language)})</Label>
              <Input type="number" value={form.lifespan} onChange={(e) => updateForm('lifespan', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('warranty', language)} ({t('years', language)})</Label>
              <Input type="number" value={form.warranty} onChange={(e) => updateForm('warranty', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('price', language)}</Label>
              <Input type="number" step="0.01" value={form.price} onChange={(e) => updateForm('price', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={(v) => updateForm('currency', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('salesChannel', language)}</Label>
              <Select value={form.sales_channel} onValueChange={(v) => updateForm('sales_channel', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Distributor">Distributor</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('region', language)}</Label>
              <Select value={form.region_id} onValueChange={(v) => updateForm('region_id', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(regions || []).map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name} ({r.abbreviation})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Checkbox id="ul" checked={form.cert_ul} onCheckedChange={(c) => updateForm('cert_ul', !!c)} />
                <Label htmlFor="ul">UL</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="dlc" checked={form.cert_dlc} onCheckedChange={(c) => updateForm('cert_dlc', !!c)} />
                <Label htmlFor="dlc">DLC</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="es" checked={form.cert_energy_star} onCheckedChange={(c) => updateForm('cert_energy_star', !!c)} />
                <Label htmlFor="es">Energy Star</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="rec" checked={form.is_recommended} onCheckedChange={(c) => updateForm('is_recommended', !!c)} />
                <Label htmlFor="rec">⭐ {t('recommended', language)}</Label>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel', language)}</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? t('loading', language) : t('save', language)}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteProduct', language)}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmDelete', language)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel', language)}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">{t('deleteProduct', language)}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
