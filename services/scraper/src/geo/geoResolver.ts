/**
 * Geo Resolver
 * Converts brand geo config into concrete lists of state/province rows to insert.
 * 
 * Strategy (Option A — one DB row per state/province):
 *   For each product scraped, generate N copies of the normalized payload,
 *   each with a different `state_province` and `currency`.
 */
import { getBrandGeo, ALL_US_STATES, ALL_CA_PROVINCES } from './brandGeoConfig';

export interface GeoVariant {
    state_province: string;
    currency: 'USD' | 'CAD';
    country: 'USA' | 'Canada';
}

/**
 * For a given brand, return all state/province variants to save.
 * Each variant will become one product row in the database.
 */
export function getGeoVariants(brandName: string): GeoVariant[] {
    const geo = getBrandGeo(brandName);
    const variants: GeoVariant[] = [];

    // US states
    if (geo.sells_in_usa) {
        const states = geo.usa_states === 'ALL' ? ALL_US_STATES : geo.usa_states;
        for (const state of states) {
            variants.push({ state_province: state, currency: 'USD', country: 'USA' });
        }
    }

    // Canadian provinces
    if (geo.sells_in_canada) {
        const provinces =
            geo.canadian_provinces === 'ALL' ? ALL_CA_PROVINCES : geo.canadian_provinces;
        for (const prov of provinces) {
            variants.push({ state_province: prov, currency: 'CAD', country: 'Canada' });
        }
    }

    return variants;
}

/**
 * Given a brand name and a list of geo variants, return the region lookup key
 * used for the `region_id` foreign key (optional).
 * Maps country → Supabase region name format.
 */
export function countryLabel(country: 'USA' | 'Canada'): string {
    return country;
}
