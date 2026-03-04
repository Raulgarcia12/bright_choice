/**
 * Lightweight Google Analytics 4 wrapper.
 *
 * Usage:
 *   1. Set your Measurement ID in the GA_MEASUREMENT_ID constant below.
 *   2. Call `initGA()` once from main.tsx.
 *   3. Use `trackEvent()` from anywhere to send custom events.
 *
 * If no Measurement ID is set, all calls are silently no-ops so the app
 * works identically in development without GA loaded.
 */

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: unknown[]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).dataLayer.push(args);
    }
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, { send_page_view: true });

    // Expose globally for trackEvent
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).gtag = gtag;
}

/** Send a custom GA4 event. Safe to call even if GA is not loaded. */
export function trackEvent(
    eventName: string,
    params?: Record<string, string | number | boolean>,
) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gtag = (window as any).gtag;
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
