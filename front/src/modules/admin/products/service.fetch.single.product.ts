/**
 * @file service.fetch.single.product.ts
 * Service for fetching single product data via API.
 * Version: 1.0.1
 * FRONTEND service for fetching single product data through API.
 *
 * Functionality:
 * - Fetches single product data via API with new architecture
 * - Handles validation and error responses
 * - Provides user-friendly error messages
 * - Integrates with UI store for toast notifications
 * - Follows established patterns from other services
 * - Supports product data with translations and relationships
 * 
 * Changes in v1.0.1:
 * - Added status_code field processing from API response
 * - Added product statuses array processing for UI dropdown
 */

import { api } from '@/core/api/service.axios'
import { useProductsAdminStore } from './state.products.admin'
import { useUiStore } from '@/core/state/uistate'
import type { 
  FetchProductResponse,
  ProductWithFullData,
  ProductTranslations,
  ApiError
} from './types.products.admin'

// Logger for main operations
const logger = {
  info: (message: string, meta?: any) => console.log(`[ProductFetchSingleService] ${message}`, meta || ''),
  error: (message: string, error?: any) => console.error(`[ProductFetchSingleService] ${message}`, error || '')
}

/**
 * Service for fetching single product data
 */
export const serviceFetchSingleProduct = {
  /**
   * Fetches product data by ID
   * @param productId - UUID of the product to fetch
   * @returns Promise<ProductWithFullData | null>
   * @throws {Error} When request fails
   */
  async fetchProduct(productId: string): Promise<ProductWithFullData | null> {
    const store = useProductsAdminStore()
    const uiStore = useUiStore()

    logger.info('Fetching product data', {
      productId
    })

    try {
      // Make API request
      const response = await api.get<FetchProductResponse>(
        '/api/admin/products/fetch',
        {
          params: { id: productId }
        }
      )

      // Validate response format
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Invalid API response format')
      }

      if (!response.data.data) {
        throw new Error('No product data received')
      }

      const { product, translations, owner, backupOwner, specialistsGroups, statuses } = response.data.data

      // Transform translations from API format to frontend format
      const frontendTranslations: ProductTranslations = {}
      
      for (const translation of translations) {
        const langCode = translation.language_code
        frontendTranslations[langCode] = {
          name: translation.name,
          shortDesc: translation.short_desc,
          longDesc: translation.long_desc,
          techSpecs: translation.tech_specs,
          areaSpecifics: translation.area_specifics,
          industrySpecifics: translation.industry_specifics,
          keyFeatures: translation.key_features,
          productOverview: translation.product_overview
        }
      }

      // Build full product data object
      const productWithFullData: ProductWithFullData = {
        ...product,
        translations: frontendTranslations,
        owner,
        backupOwner,
        specialistsGroups: specialistsGroups || []
      }

      // Store statuses in store for use in component
      if (statuses && statuses.length > 0) {
        store.setProductStatuses(statuses)
      }

      logger.info('Successfully fetched product data', {
        productId: product.product_id,
        productCode: product.product_code,
        translationKey: product.translation_key,
        translationsCount: Object.keys(frontendTranslations).length,
        specialistsGroupsCount: specialistsGroups?.length || 0
      })

      return productWithFullData

    } catch (error: any) {
      // Handle API error responses
      if (error.response?.data) {
        const apiError = error.response.data as ApiError
        
        // Map error codes to user-friendly messages
        let userMessage = apiError.message || 'Ошибка получения данных продукта'
        
        if (apiError.code === 'VALIDATION_ERROR') {
          userMessage = 'Ошибка валидации запроса'
        } else if (apiError.code === 'AUTHENTICATION_ERROR') {
          userMessage = 'Ошибка аутентификации'
        } else if (apiError.code === 'DATABASE_ERROR') {
          userMessage = 'Ошибка базы данных'
        } else if (apiError.message?.includes('not found')) {
          userMessage = 'Продукт не найден'
        }

        // Show error message
        uiStore.showErrorSnackbar(userMessage)
        
        logger.error('API error fetching product', {
          code: apiError.code,
          message: apiError.message,
          details: apiError.details
        })
      } else {
        // Handle network or other errors
        const errorMessage = error.message || 'Неизвестная ошибка при получении данных продукта'
        uiStore.showErrorSnackbar(errorMessage)
        
        logger.error('Network error fetching product', error)
      }

      // Return null instead of throwing to allow graceful handling
      return null
    }
  },

  /**
   * Fetches product data and updates store
   * @param productId - UUID of the product to fetch
   * @returns Promise<boolean> - true if successful, false otherwise
   */
  async fetchAndUpdateStore(productId: string): Promise<boolean> {
    const store = useProductsAdminStore()
    
    try {
      const productData = await this.fetchProduct(productId)
      
      if (productData) {
        // Update store with fetched data
        store.setEditingProductData(productData)
        return true
      }
      
      return false
    } catch (error) {
      logger.error('Error fetching and updating store', error)
      return false
    }
  }
}
