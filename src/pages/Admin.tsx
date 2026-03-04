import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProducts, useRegions } from '@/hooks/useProducts';
import { useAppStore, type Product } from '@/lib/store';
import { t } from '@/lib/i18n';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import ProductFormDialog from '@/components/admin/ProductFormDialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Language } from '@/lib/i18n';

/* ── Contact Requests Section ── */
function ContactRequestsSection({ language }: { language: Language }) {
  const { data: requests, isLoading } = useQuery({
    queryKey: ['contact_requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading || !requests || requests.length === 0) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8">
      <div className="mb-4 mt-10 flex items-center gap-2">
        <Mail className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">
          {language === 'es' ? 'Solicitudes de Demo' : 'Demo Requests'}
        </h2>
        <Badge variant="secondary" className="ml-2">{requests.length}</Badge>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === 'es' ? 'Nombre' : 'Name'}</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>{language === 'es' ? 'Empresa' : 'Company'}</TableHead>
              <TableHead>{language === 'es' ? 'Fecha' : 'Date'}</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.full_name}</TableCell>
                <TableCell>
                  <a href={`mailto:${r.email}`} className="text-primary hover:underline">{r.email}</a>
                </TableCell>
                <TableCell>{r.company}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(r.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge variant={r.status === 'new' ? 'default' : 'secondary'}>
                    {r.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

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
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!session || !isAdmin)) navigate('/login');
  }, [session, isAdmin, authLoading, navigate]);

  if (authLoading || !isAdmin) return null;

  const filtered = (products || []).filter((p) =>
    `${p.brand} ${p.model}`.toLowerCase().includes(search.toLowerCase())
  );

  function openEdit(product: Product) {
    setEditProduct(product);
    setDialogOpen(true);
  }

  function openNew() {
    setEditProduct(null);
    setDialogOpen(true);
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">{t('adminPanel', language)}</h1>
          <Button onClick={openNew} size="sm"><Plus className="mr-2 h-4 w-4" />{t('addProduct', language)}</Button>
        </div>

        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        {/* Mobile card list */}
        <div className="space-y-3 sm:hidden">
          {filtered.map((p) => (
            <div key={p.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-foreground">{p.brand}</div>
                  <div className="text-sm text-muted-foreground">{p.model}</div>
                </div>
                <Badge variant="secondary">{p.category}</Badge>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span>{p.currency === 'CAD' ? 'CA$' : '$'}{p.price}</span>
                <span className="text-muted-foreground">{p.efficiency} lm/W</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(p)}><Pencil className="mr-1 h-3 w-3" />Edit</Button>
                <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden rounded-lg border bg-card sm:block">
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

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editProduct={editProduct}
        regions={regions || []}
      />

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

      {/* ── Contact / Demo Requests ── */}
      <ContactRequestsSection language={language} />
    </div>
  );
}
