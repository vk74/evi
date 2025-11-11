/**
 * version: 1.1.0
 * Frontend state management utilities for catalog module.
 * Provides shared reactive state, caching helpers, and view controls for ModuleCatalog.
 * File: state.catalog.ts (frontend)
 *
 * Changes in v1.1.0:
 * - Added rounding precision support to cached product prices
 */

import { ref, computed, type Component } from 'vue';
import { PhCaretDown, PhCaretRight } from '@phosphor-icons/vue';
import type { ProductPriceInfo } from './products/types.products';

// ==================== OPTIONS BAR STATE ====================
export const searchQuery = ref('');
export const sortBy = ref('name');
export const sortDirection = ref('asc');

// Options bar display mode - only 'opened' and 'auto' modes
export const optionsBarMode = ref(
  localStorage.getItem('catalogOptionsBarMode') === 'auto' ? 'auto' : 'opened'
);

// Base visibility controlled by mode
export const baseOptionsBarVisible = ref(optionsBarMode.value === 'opened');

// Hover state for auto mode
export const isHoveringTriggerArea = ref(false);

// Final visibility combines base visibility and hover state
export const isOptionsBarVisible = computed(() => {
  if (optionsBarMode.value === 'opened') {
    return true;
  } else if (optionsBarMode.value === 'auto') {
    return isHoveringTriggerArea.value;
  }
  return false;
});

// ==================== SORT OPTIONS ====================
export const sortOptions = [
  { title: 'По названию', value: 'name' },
  { title: 'По приоритету', value: 'priority' },
  { title: 'По статусу', value: 'status' },
  { title: 'По владельцу', value: 'owner' }
];

export const sortDirections = [
  { title: 'По возрастанию', value: 'asc' },
  { title: 'По убыванию', value: 'desc' }
];

// ==================== OPTIONS BAR MODE MANAGEMENT ====================
export const toggleOptionsBarMode = () => {
  // Toggle between 'opened' and 'auto' only
  if (optionsBarMode.value === 'opened') {
    optionsBarMode.value = 'auto';
    baseOptionsBarVisible.value = false;
  } else {
    optionsBarMode.value = 'opened';
    baseOptionsBarVisible.value = true;
  }
  
  // Save to localStorage for persistence
  localStorage.setItem('catalogOptionsBarMode', optionsBarMode.value);
};

// Computed property for chevron icon based on mode (returns Phosphor component)
export const optionsBarChevronIcon = computed<Component>(() => {
  switch(optionsBarMode.value) {
    case 'opened':
      return PhCaretDown; // Панель открыта
    case 'auto':
      return PhCaretRight; // Автоматический режим
    default:
      return PhCaretDown;
  }
});

// ==================== EVENT HANDLERS ====================
export const clearSearch = () => {
  searchQuery.value = '';
};

export const setHoveringTriggerArea = (isHovering: boolean) => {
  isHoveringTriggerArea.value = isHovering;
}; 

// ==================== VIEW STATE (INTRA-MODULE) ====================
// Selected service for details view (null means catalog root view)
export const selectedServiceId = ref<string | null>(null);

export const setSelectedServiceId = (serviceId: string | null) => {
  selectedServiceId.value = serviceId;
};

// Soft reset to root view: leave filters/sort/sections intact, just exit details view
export const resetCatalogView = () => {
  selectedServiceId.value = null;
};

// ==================== PRICE CACHE ====================
// Cache for product prices (TTL 5 minutes)
interface CachedPriceInfo extends ProductPriceInfo {
  timestamp: number;
}

const priceCache = ref<Map<string, CachedPriceInfo>>(new Map());
const PRICE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached price for a product code
 * @param productCode - Product code
 * @returns Cached price info or null if not found or expired
 */
export function getCachedPrice(productCode: string): ProductPriceInfo | null {
  if (!productCode) {
    return null;
  }
  
  const cached = priceCache.value.get(productCode);
  
  if (!cached) {
    return null;
  }
  
  // Check if cache is still valid
  const now = Date.now();
  if (now - cached.timestamp > PRICE_CACHE_TTL) {
    // Cache expired, remove it
    priceCache.value.delete(productCode);
    return null;
  }
  
  return {
    price: cached.price,
    currencySymbol: cached.currencySymbol,
    roundingPrecision: cached.roundingPrecision
  };
}

/**
 * Cache price for a product code
 * @param productCode - Product code
 * @param price - Price value
 * @param currencySymbol - Currency symbol
 */
export function cachePrice(
  productCode: string,
  price: number,
  currencySymbol: string,
  roundingPrecision: number | null
): void {
  if (!productCode) {
    return;
  }
  
  priceCache.value.set(productCode, {
    price,
    currencySymbol,
    roundingPrecision,
    timestamp: Date.now()
  });
}

/**
 * Check if price cache is valid for a product code
 * @param productCode - Product code
 * @returns True if cache exists and is still valid
 */
export function isPriceCacheValid(productCode: string): boolean {
  if (!productCode) {
    return false;
  }
  
  const cached = priceCache.value.get(productCode);
  
  if (!cached) {
    return false;
  }
  
  const now = Date.now();
  if (now - cached.timestamp > PRICE_CACHE_TTL) {
    // Cache expired, remove it
    priceCache.value.delete(productCode);
    return false;
  }
  
  return true;
}

/**
 * Clear price cache
 */
export function clearPriceCache(): void {
  priceCache.value.clear();
}