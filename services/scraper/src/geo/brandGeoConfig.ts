/**
 * Brand Geo Configuration
 * Static map of each brand's:
 *  - Home country / HQ state
 *  - US states they sell in (or 'ALL')
 *  - Canadian provinces they sell in (or empty = not sold in Canada)
 *
 * Sources: company "Where to Buy" pages, distributor networks, annual reports.
 * A company can be US-headquartered but have strong Canadian distribution (and vice versa).
 */

export interface BrandGeo {
    /** 2-letter ISO country code of the HQ ('US' | 'CA' | 'NL' etc.) */
    hq_country: string;
    /** 2-letter US state of HQ (if applicable) */
    hq_state?: string;
    /** True if this brand distributes in the USA */
    sells_in_usa: boolean;
    /**
     * List of US state abbreviations this brand sells in,
     * or 'ALL' to mean every state.
     */
    usa_states: string[] | 'ALL';
    /** True if this brand distributes in Canada */
    sells_in_canada: boolean;
    /**
     * List of Canadian province abbreviations this brand sells in,
     * or 'ALL' to mean every province.
     */
    canadian_provinces: string[] | 'ALL';
    /** Default currency for USD products */
    usd_currency: boolean;
    /** Default currency for CAD products */
    cad_currency: boolean;
}

const ALL_US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const ALL_CA_PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'ON', 'PE', 'QC', 'SK'];

export const BRAND_GEO: Record<string, BrandGeo> = {
    // ── Acuity Brands ─────────────────────────────────────────────────────────
    // HQ: Atlanta, GA. One of the largest US commercial lighting companies.
    // Distributes nationally in USA + major Canadian markets via Distech Controls.
    'Acuity Brands': {
        hq_country: 'US',
        hq_state: 'GA',
        sells_in_usa: true,
        usa_states: 'ALL',
        sells_in_canada: true,
        canadian_provinces: ['ON', 'BC', 'AB', 'QC', 'MB', 'SK'],
        usd_currency: true,
        cad_currency: true,
    },

    // ── Cree Lighting ─────────────────────────────────────────────────────────
    // HQ: Durham, NC. Sells nationwide via electrical distributors.
    // Canadian presence through Sonepar, WesElectric, and others.
    'Cree Lighting': {
        hq_country: 'US',
        hq_state: 'NC',
        sells_in_usa: true,
        usa_states: 'ALL',
        sells_in_canada: true,
        canadian_provinces: ['ON', 'BC', 'AB', 'QC'],
        usd_currency: true,
        cad_currency: true,
    },

    // ── Philips / Signify ─────────────────────────────────────────────────────
    // HQ: Netherlands. Operates separate regional websites: usa.lighting.philips.com
    // and canada.lighting.philips.com. Major presence in both countries.
    'Philips': {
        hq_country: 'NL',
        sells_in_usa: true,
        usa_states: 'ALL',
        sells_in_canada: true,
        canadian_provinces: 'ALL',
        usd_currency: true,
        cad_currency: true,
    },

    // ── GE Current (Daintree) ─────────────────────────────────────────────────
    'GE Current': {
        hq_country: 'US',
        hq_state: 'OH',
        sells_in_usa: true,
        usa_states: 'ALL',
        sells_in_canada: true,
        canadian_provinces: ['ON', 'BC', 'AB', 'QC'],
        usd_currency: true,
        cad_currency: false,
    },

    // ── Lithonia Lighting (Acuity sub-brand) ─────────────────────────────────
    'Lithonia Lighting': {
        hq_country: 'US',
        hq_state: 'GA',
        sells_in_usa: true,
        usa_states: 'ALL',
        sells_in_canada: true,
        canadian_provinces: ['ON', 'BC', 'AB', 'QC'],
        usd_currency: true,
        cad_currency: false,
    },

    // ── Leviton Manufacturing ─────────────────────────────────────────────────
    // HQ: Melville, NY. Primarily US but Canadian presence in major provinces.
    'Leviton': {
        hq_country: 'US',
        hq_state: 'NY',
        sells_in_usa: true,
        usa_states: 'ALL',
        sells_in_canada: true,
        canadian_provinces: ['ON', 'BC', 'AB', 'QC', 'MB'],
        usd_currency: true,
        cad_currency: true,
    },

    // ── Hubbell Lighting ─────────────────────────────────────────────────────
    'Hubbell Lighting': {
        hq_country: 'US',
        hq_state: 'CT',
        sells_in_usa: true,
        usa_states: 'ALL',
        sells_in_canada: true,
        canadian_provinces: ['ON', 'BC', 'AB', 'QC'],
        usd_currency: true,
        cad_currency: false,
    },

    // ── RAB Lighting ─────────────────────────────────────────────────────────
    // HQ: Northvale, NJ. Sells across US and Canada.
    'RAB Lighting': {
        hq_country: 'US',
        hq_state: 'NJ',
        sells_in_usa: true,
        usa_states: 'ALL',
        sells_in_canada: true,
        canadian_provinces: ['ON', 'BC', 'AB', 'QC', 'MB', 'SK'],
        usd_currency: true,
        cad_currency: true,
    },

    // ── Lumenera (Canadian) ───────────────────────────────────────────────────
    // Canadian company with growing US distributor network.
    'Lumenera': {
        hq_country: 'CA',
        hq_state: undefined,
        sells_in_usa: true,
        usa_states: ['CA', 'TX', 'FL', 'NY', 'IL', 'WA', 'OR'],
        sells_in_canada: true,
        canadian_provinces: 'ALL',
        usd_currency: false,
        cad_currency: true,
    },
};

/** Resolve brand geo config, with a safe fallback for unknown brands */
export function getBrandGeo(brandName: string): BrandGeo {
    return (
        BRAND_GEO[brandName] ?? {
            hq_country: 'US',
            sells_in_usa: true,
            usa_states: 'ALL',
            sells_in_canada: false,
            canadian_provinces: [],
            usd_currency: true,
            cad_currency: false,
        }
    );
}

export { ALL_US_STATES, ALL_CA_PROVINCES };
