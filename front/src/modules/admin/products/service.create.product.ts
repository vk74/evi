/**
 * @file service.create.product.ts
 * Service for creating products via API.
 * Version: 1.0.0
 * FRONTEND service for creating products through API.
 *
 * Functionality:
 * - Creates products via API with new architecture
 * - Handles validation and error responses
 * - Provides user-friendly error messages
 * - Integrates with UI store for toast notifications
 * - Follows established patterns from other services
 * - Supports product types and translations
 */

import { api } from '@/core/api/service.axios'
import { useProductsAdminStore } from './state.products.admin'
import { useUiStore } from '@/core/state/uistate'
import type { 
  CreateProductRequest,
  CreateProductResponse,
  ApiError
} from './types.products.admin'

// Logger for main operations
const logger = {
  info: (message: string, meta?: any) => console.log(`[ProductCreateService] ${message}`, meta || ''),
  error: (message: string, error?: any) => console.error(`[ProductCreateService] ${message}`, error || '')
}

/**
 * Service for creating products
 */
export const serviceCreateProduct = {
  /**
   * Creates a new product
   * @param productData - Data for the new product
   * @returns Promise<CreateProductResponse>
   * @throws {Error} When request fails
   */
  async createProduct(productData: CreateProductRequest): Promise<CreateProductResponse> {
    const store = useProductsAdminStore()
    const uiStore = useUiStore()

    logger.info('Creating product', {
      productCode: productData.productCode,
      translationKey: productData.translationKey,
      canBeOption: productData.canBeOption,
      optionOnly: productData.optionOnly,
      owner: productData.owner
    })

    // Debug: Log full productData received by service
    console.log('[ProductCreateService] Full productData received:', productData)
    console.log('[ProductCreateService] productData.translations:', JSON.stringify(productData.translations, null, 2))
    console.log('[ProductCreateService] productData.translations.en:', JSON.stringify(productData.translations?.en, null, 2))
    console.log('[ProductCreateService] productData.translations.ru:', JSON.stringify(productData.translations?.ru, null, 2))
    console.log('[ProductCreateService] productData.specialistsGroups:', JSON.stringify(productData.specialistsGroups, null, 2))
    // isPublished removed from product creation

    try {
      // Prepare data for API
      const apiData = {
        ...productData,
        // Ensure specialistsGroups is an array
        specialistsGroups: Array.isArray(productData.specialistsGroups) 
          ? productData.specialistsGroups 
          : []
      }

      // Make API request
      const response = await api.post<CreateProductResponse>(
        '/api/admin/products/create',
        apiData
      )

      // Validate response format
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Invalid API response format')
      }

      logger.info('Successfully created product', {
        productId: response.data.data?.id,
        productCode: response.data.data?.productCode,
        translationKey: response.data.data?.translationKey,
        message: response.data.message
      })

      // Show success message
      uiStore.showSuccessSnackbar(response.data.message || 'Продукт успешно создан')

      return response.data

    } catch (error: any) {
      // Handle API error responses
      if (error.response?.data) {
        const apiError = error.response.data as ApiError
        
        // Map error codes to user-friendly messages
        let userMessage = apiError.message || 'Ошибка создания продукта'
        
        if (apiError.code === 'VALIDATION_ERROR') {
          // Handle validation errors with details
          if (apiError.details?.errors) {
            const errors = apiError.details.errors as string[]
            userMessage = errors.join('; ')
          } else {
            userMessage = apiError.message || 'Ошибка валидации данных'
          }
        } else if (apiError.code === 'AUTHENTICATION_ERROR') {
          userMessage = 'Ошибка аутентификации'
        } else if (apiError.code === 'DATABASE_ERROR') {
          userMessage = 'Ошибка базы данных'
        } else if (apiError.message?.includes('already exists')) {
          if (apiError.message.includes('product code')) {
            userMessage = 'Продукт с таким кодом уже существует'
          } else if (apiError.message.includes('translation key')) {
            userMessage = 'Продукт с таким ключом перевода уже существует'
          } else {
            userMessage = 'Продукт с такими данными уже существует'
          }
        }

        // Show error message
        uiStore.showErrorSnackbar(userMessage)
        
        logger.error('API error creating product', {
          code: apiError.code,
          message: apiError.message,
          details: apiError.details
        })
      } else {
        // Handle network or other errors
        const errorMessage = error.message || 'Неизвестная ошибка при создании продукта'
        uiStore.showErrorSnackbar(errorMessage)
        
        logger.error('Network error creating product', error)
      }

      // Re-throw error for component handling
      throw error
    }
  }
}
