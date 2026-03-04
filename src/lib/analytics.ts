/**
 * Lightweight Google Analytics 4 wrapper.
 */

declare global {
    interface Window {
        dataLayer: unknown[];
        gtag: (...args: unknown[]) => void;
    }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

/** Inject the gtag.js script + initialise the dataLayer. */
export function initGA() {
    if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

    // Prevent double-init
    if (document.querySelector(`script[src*="googletagmanager"]`)) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: unknown[]) {
        window.dataLayer.push(args);
    }
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, { send_page_view: true });

    // Expose globally for trackEvent
    window.gtag = gtag;
}

/** Send a custom GA4 event. Safe to call even if GA is not loaded. */
export function trackEvent(
    eventName: string,
    params?: Record<string, string | number | boolean>,
) {
    const gtag = window.gtag;
    if (typeof gtag !== 'function') return;
    gtag('event', eventName, params);
}

/* ──────────────────────────────────────
   Pre-built event helpers
   ────────────────────────────────────── */

export const analytics = {
    /** Track a page view (auto-called by React Router listener if you set one up). */
    pageView: (path: string) =>
        trackEvent('page_view', { page_path: path }),

    /** Track when a user compares products. */
    productCompared: (productIds: string[]) =>
        trackEvent('product_compared', {
            product_count: productIds.length,
            product_ids: productIds.join(','),
        }),

    /** Track filter usage. */
    filterApplied: (filterType: string, filterValue: string) =>
        trackEvent('filter_applied', { filter_type: filterType, filter_value: filterValue }),

    /** Track contact form submission. */
    contactFormSubmitted: () =>
        trackEvent('contact_form_submitted'),

    /** Track language toggle. */
    languageSwitched: (language: string) =>
        trackEvent('language_switched', { language }),

    /** Track theme toggle. */
    themeToggled: (theme: string) =>
        trackEvent('theme_toggled', { theme }),
};
