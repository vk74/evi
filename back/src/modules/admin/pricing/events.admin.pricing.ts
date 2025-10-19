/**
 * version: 1.0.0
 * Event definitions for pricing administration module (backend).
 * Provides event templates for currencies and future pricing actions.
 * File: events.admin.pricing.ts (backend)
 */

// Currencies fetch events (domain to be finalized later)
export const PRICING_CURRENCIES_FETCH_EVENTS = {
    STARTED: {
        eventName: 'pricing.currencies.fetch.started',
        source: 'admin-pricing',
        eventType: 'app' as const,
        severity: 'debug' as const,
        eventMessage: 'Currencies fetch started',
        payload: null,
        version: '1.0.0'
    },
    SUCCESS: {
        eventName: 'pricing.currencies.fetch.success',
        source: 'admin-pricing',
        eventType: 'app' as const,
        severity: 'info' as const,
        eventMessage: 'Currencies fetched successfully',
        payload: null,
        version: '1.0.0'
    },
    ERROR: {
        eventName: 'pricing.currencies.fetch.error',
        source: 'admin-pricing',
        eventType: 'app' as const,
        severity: 'error' as const,
        eventMessage: 'Currencies fetch failed',
        payload: null,
        errorData: null,
        version: '1.0.0'
    }
};


