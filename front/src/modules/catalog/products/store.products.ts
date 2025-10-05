/**
 * @file store.products.ts
 * Version: 1.0.0
 * Pinia store for catalog products state management.
 * Frontend file that provides centralized state management for products.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CatalogProduct, CatalogProductDetails } from './types.products'
import { 
  fetchActiveProducts, 
  getCachedActiveProducts, 
  isActiveProductsLoading, 
  getActiveProductsError,
  clearActiveProductsCache,
  forceRefreshActiveProducts
} from './service.fetch.active.products'
import { 
  fetchProductDetails, 
  getCachedProductDetails, 
  isProductDetailsLoading, 
  getProductDetailsError,
  clearProductDetailsCache,
  forceRefreshProductDetails
} from './service.fetch.product.details'

export const useProductsStore = defineStore('products', () => {
  // ==================== STATE ====================
  const products = ref<CatalogProduct[]>([])
  const selectedProductId = ref<string | null>(null)
  const productDetails = ref<Record<string, CatalogProductDetails>>({})
  
  // ==================== COMPUTED ====================
  const selectedProduct = computed(() => {
    if (!selectedProductId.value) return null
    return products.value.find(p => p.id === selectedProductId.value) || null
  })
  
  const selectedProductDetails = computed(() => {
    if (!selectedProductId.value) return null
    return productDetails.value[selectedProductId.value] || null
  })
  
  const isLoading = computed(() => isActiveProductsLoading())
  const isDetailsLoading = computed(() => isProductDetailsLoading())
  const error = computed(() => getActiveProductsError())
  const detailsError = computed(() => getProductDetailsError())
  
  // ==================== ACTIONS ====================
  
  // Products list management
  async function loadProducts(options: { sectionId?: string; forceRefresh?: boolean } = {}) {
    try {
      const fetchedProducts = await fetchActiveProducts(options)
      products.value = fetchedProducts
      return fetchedProducts
    } catch (error) {
      console.error('Failed to load products:', error)
      throw error
    }
  }
  
  function getProducts() {
    return getCachedActiveProducts()
  }
  
  function clearProductsCache() {
    clearActiveProductsCache()
    products.value = []
  }
  
  async function refreshProducts(options: { sectionId?: string } = {}) {
    return forceRefreshActiveProducts()
  }
  
  // Product selection management
  function setSelectedProduct(productId: string | null) {
    selectedProductId.value = productId
  }
  
  function clearSelection() {
    selectedProductId.value = null
  }
  
  // Product details management
  async function loadProductDetails(productId: string, options: { forceRefresh?: boolean } = {}) {
    try {
      const details = await fetchProductDetails(productId, options)
      if (details) {
        productDetails.value[productId] = details
      }
      return details
    } catch (error) {
      console.error('Failed to load product details:', error)
      throw error
    }
  }
  
  function getProductDetails(productId: string) {
    return getCachedProductDetails(productId)
  }
  
  function clearProductDetailsCache() {
    clearProductDetailsCache()
    productDetails.value = {}
  }
  
  async function refreshProductDetails(productId: string) {
    const details = await forceRefreshProductDetails(productId)
    if (details) {
      productDetails.value[productId] = details
    }
    return details
  }
  
  // Combined actions
  async function selectProduct(productId: string) {
    setSelectedProduct(productId)
    if (!productDetails.value[productId]) {
      await loadProductDetails(productId)
    }
  }
  
  function reset() {
    clearSelection()
    clearProductsCache()
    clearProductDetailsCache()
  }
  
  // ==================== RETURN ====================
  return {
    // State
    products,
    selectedProductId,
    productDetails,
    
    // Computed
    selectedProduct,
    selectedProductDetails,
    isLoading,
    isDetailsLoading,
    error,
    detailsError,
    
    // Actions
    loadProducts,
    getProducts,
    clearProductsCache,
    refreshProducts,
    setSelectedProduct,
    clearSelection,
    loadProductDetails,
    getProductDetails,
    clearProductDetailsCache,
    refreshProductDetails,
    selectProduct,
    reset
  }
})
