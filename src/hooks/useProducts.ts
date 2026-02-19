import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product, Region } from '@/lib/store';

export function useProducts(regionId: string | null) {
  return useQuery({
    queryKey: ['products', regionId],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, regions(name, abbreviation, country)')
        .limit(1000)
        .order('brand');

      if (regionId) {
        query = query.eq('region_id', regionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Product[];
    },
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
