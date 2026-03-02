import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product, Region } from '@/lib/store';

/**
 * Fetches ALL products by paginating through Supabase's 1000-row limit.
 * Supabase PostgREST caps responses at 1000 rows per request, so we use
 * `.range()` to pull successive pages and merge them.
 */
async function fetchAllProducts(regionId: string | null): Promise<Product[]> {
  const PAGE_SIZE = 1000;
  let allData: Product[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from('products')
      .select('*, regions(name, abbreviation, country)')
      .range(from, from + PAGE_SIZE - 1)
      .order('brand');

    if (regionId) {
      query = query.eq('region_id', regionId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data || []) as Product[];
    allData = allData.concat(rows);

    if (rows.length < PAGE_SIZE) {
      hasMore = false; // Last page
    } else {
      from += PAGE_SIZE;
    }
  }

  return allData;
}

export function useProducts(regionId: string | null) {
  return useQuery({
    queryKey: ['products', regionId],
    queryFn: () => fetchAllProducts(regionId),
  });
}

export function useRegions() {
  return useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regions')
        .select('*')
        .order('country')
        .order('name');
      if (error) throw error;
      return (data || []) as Region[];
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, regions(name, abbreviation, country)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Product;
    },
    enabled: !!id,
  });
}
