/**
 * Version: 1.0.0
 * Service for fetching product prices by product codes from pricelist.
 * Frontend file that calls catalog batch API to get prices for multiple products at once.
 * Returns Map of product_code to price info.
 * Filename: service.catalog.fetch.prices.by.codes.ts (frontend)
 */

import { api } from '@/core/api/service.axios';
import { getCurrencySymbolByCode } from '@/core/helpers/get.currency.symbol.by.code';
import type { ProductPriceInfo } from './products/types.products';

interface FetchPricelistItemsByCodesRequest {
  itemCodes: string[];
}

interface PricelistItemPublicDto {
  item_code: string;
  list_price: number;
}

interface FetchPricelistItemsByCodesResponse {
  success: boolean;
  message?: string;
  data?: {
    currency_code: string;
    items: PricelistItemPublicDto[];
  };
}

/**
 * Fetch prices for products by their product codes
 * @param pricelistId - Price list ID
 * @param productCodes - Array of product codes to fetch prices for
 * @returns Promise that resolves to Map of product_code -> ProductPriceInfo, or empty Map on error
 */
export async function fetchPricesByCodes(
  pricelistId: number,
  productCodes: string[]
): Promise<Map<string, ProductPriceInfo>> {
  const priceMap = new Map<string, ProductPriceInfo>();

  try {
    // Validate inputs
    if (!pricelistId || isNaN(pricelistId) || pricelistId < 1) {
      console.error('[fetchPricesByCodes] Invalid pricelistId:', pricelistId);
      return priceMap;
    }

    if (!Array.isArray(productCodes) || productCodes.length === 0) {
      console.warn('[fetchPricesByCodes] Empty productCodes array');
      return priceMap;
    }

    // Filter out null/undefined codes
    const validCodes = productCodes.filter(code => code !== null && code !== undefined && code !== '');
    
    if (validCodes.length === 0) {
      console.warn('[fetchPricesByCodes] No valid product codes');
      return priceMap;
    }

    // Call batch API
    const requestBody: FetchPricelistItemsByCodesRequest = {
      itemCodes: validCodes
    };

    const response = await api.post<FetchPricelistItemsByCodesResponse>(
      `/api/catalog/pricelists/${pricelistId}/items-by-codes`,
      requestBody
    );

    if (!response.data.success || !response.data.data) {
      console.error('[fetchPricesByCodes] API error:', response.data.message);
      return priceMap;
    }

    const { currency_code, items } = response.data.data;

    // Get currency symbol
    const currencySymbol = await getCurrencySymbolByCode(currency_code);

    if (!currencySymbol) {
      console.warn(`[fetchPricesByCodes] Currency symbol not found for code: ${currency_code}`);
    }

    // Build price map
    items.forEach(item => {
      priceMap.set(item.item_code, {
        price: item.list_price,
        currencySymbol: currencySymbol || ''
      });
    });

    return priceMap;
  } catch (error) {
    console.error('[fetchPricesByCodes] Error fetching prices:', error);
    return priceMap;
  }
}

