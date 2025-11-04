/**
 * Version: 1.0.0
 * Helper for getting currency symbol by currency code.
 * Frontend file that provides function to get currency symbol from currency code.
 * Uses caching to avoid repeated API calls.
 * Filename: get.currency.symbol.by.code.ts (frontend)
 */

import { fetchCurrenciesService } from '@/modules/admin/pricing/currencies/service.fetch.currencies';
import type { Currency } from '@/modules/admin/pricing/types.pricing.admin';

// Cache for currencies
let currenciesCache: Currency[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get currency symbol by currency code
 * @param currencyCode - ISO currency code (e.g., 'USD', 'EUR', 'RUB')
 * @returns Promise that resolves to currency symbol or null if not found
 */
export async function getCurrencySymbolByCode(currencyCode: string): Promise<string | null> {
  try {
    // Check cache validity
    const now = Date.now();
    if (!currenciesCache || (now - cacheTimestamp) > CACHE_TTL) {
      // Fetch active currencies only
      currenciesCache = await fetchCurrenciesService(true);
      cacheTimestamp = now;
    }
    
    // Find currency by code
    const currency = currenciesCache.find(c => c.code === currencyCode);
    
    if (!currency) {
      return null;
    }
    
    return currency.symbol || null;
  } catch (error) {
    console.error(`[getCurrencySymbolByCode] Error getting currency symbol for ${currencyCode}:`, error);
    return null;
  }
}

/**
 * Get currency symbol synchronously from cache (if available)
 * @param currencyCode - ISO currency code
 * @returns Currency symbol or null if not found in cache
 */
export function getCurrencySymbolByCodeSync(currencyCode: string): string | null {
  if (!currenciesCache) {
    return null;
  }
  
  const currency = currenciesCache.find(c => c.code === currencyCode);
  
  if (!currency) {
    return null;
  }
  
  return currency.symbol || null;
}

