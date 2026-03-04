import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */

export interface RetailerClient {
    name: string;
}

export interface Retailer {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    state_province: string;
    country: string;
    phone: string | null;
    website_url: string | null;
    inventory_count: number;
    primary_brands: string[] | null;
    reported_clients: RetailerClient[];
    is_active: boolean;
}

export interface RetailerPrice {
    id: string;
    product_id: string;
    retailer_id: string;
    unit_price: number;
    currency: string;
    is_available: boolean;
    last_verified_at: string;
}

/* ──────────────────────────────────────────────
   Mock fallback — Green Lighting Wholesale, OH
   Used when the DB migration hasn't been applied
   ────────────────────────────────────────────── */

const MOCK_RETAILERS: Record<string, Retailer[]> = {
    OH: [
        {
            id: 'mock-glw-oh',
            name: 'Green Lighting Wholesale',
            address: '405 S 22nd St',
            city: 'Heath',
            state_province: 'OH',
            country: 'USA',
            phone: null,
            website_url: null,
            inventory_count: 4900,
            primary_brands: ['Maxlite'],
            reported_clients: [
                { name: 'Lindsay Honda Design Build' },
                { name: 'South Bend FedEx Fulfillment' },
                { name: 'City of Gahanna - LED Canopy' },
                { name: 'City of Gahanna Parking Garage' },
                { name: 'Crossfit OKM of Gahanna' },
                { name: 'Dayco Appliance Parts' },
            ],
            is_active: true,
        },
    ],
};

/* ──────────────────────────────────────────────
   Hooks
   ────────────────────────────────────────────── */

/** Fetch all active retailers for a given state/province abbreviation. */
export function useRetailersByState(stateAbbr: string | null) {
    return useQuery({
        queryKey: ['retailers', stateAbbr],
        queryFn: async (): Promise<Retailer[]> => {
            if (!stateAbbr) return [];

            try {
                const { data, error } = await supabase
                    .from('retailers')
                    .select('*')
                    .eq('state_province', stateAbbr)
                    .eq('is_active', true)
                    .order('name');

                if (error) throw error;

                if (data && data.length > 0) {
                    return data.map((r: { reported_clients?: unknown } & Record<string, unknown>) => ({
                        ...r,
                        reported_clients: Array.isArray(r.reported_clients)
                            ? r.reported_clients
                            : [],
                    })) as unknown as Retailer[];
                }
            } catch {
                // Table might not exist yet — fall through to mock
            }

            // Fallback to mock data
            return MOCK_RETAILERS[stateAbbr] || [];
        },
        enabled: !!stateAbbr,
    });
}

/** Fetch retail prices for a specific retailer. */
export function useRetailerPrices(retailerId: string | null) {
    return useQuery({
        queryKey: ['retailerPrices', retailerId],
        queryFn: async (): Promise<RetailerPrice[]> => {
            if (!retailerId || retailerId.startsWith('mock-')) return [];

            const { data, error } = await supabase
                .from('retailer_prices')
                .select('*')
                .eq('retailer_id', retailerId)
                .eq('is_available', true)
                .order('unit_price');

            if (error) throw error;
            return (data || []) as RetailerPrice[];
        },
        enabled: !!retailerId && !retailerId.startsWith('mock-'),
    });
}

/** Fetch the cheapest price per product across retailers in a state. */
export function useBestPricesByState(stateAbbr: string | null) {
    return useQuery({
        queryKey: ['bestPrices', stateAbbr],
        queryFn: async (): Promise<Record<string, { price: number; retailer_name: string }>> => {
            if (!stateAbbr) return {};

            try {
                // Get retailers in this state
                const { data: retailers } = await supabase
                    .from('retailers')
                    .select('id, name')
                    .eq('state_province', stateAbbr)
                    .eq('is_active', true);

                if (!retailers?.length) return {};

                const retailerIds = retailers.map(r => r.id);
                const retailerMap = Object.fromEntries(retailers.map(r => [r.id, r.name]));

                // Get prices from those retailers
                const { data: prices } = await supabase
                    .from('retailer_prices')
                    .select('product_id, retailer_id, unit_price')
                    .in('retailer_id', retailerIds)
                    .eq('is_available', true);

                if (!prices?.length) return {};

                // Find best (lowest) price per product
                const best: Record<string, { price: number; retailer_name: string }> = {};
                for (const p of prices) {
                    if (!best[p.product_id] || p.unit_price < best[p.product_id].price) {
                        best[p.product_id] = {
                            price: p.unit_price,
                            retailer_name: retailerMap[p.retailer_id] || 'Unknown',
                        };
                    }
                }
                return best;
            } catch {
                return {};
            }
        },
        enabled: !!stateAbbr,
    });
}
