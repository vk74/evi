/**
 * @file service.update.product.ts
 * Service for updating products via API.
 * Version: 1.0.0
 * FRONTEND service for updating products through API.
 *
 * Functionality:
 * - Updates products via API with new architecture
 * - Handles validation and error responses
 * - Provides user-friendly error messages
 * - Integrates with UI store for toast notifications
 * - Follows established patterns from other services
 * - Supports partial updates of product data
 */

import { api } from '@/core/api/service.axios'
import { useProductsAdminStore } from './state.products.admin'
import { useUiStore } from '@/core/state/uistate'
import type { 
  UpdateProductRequest,
  UpdateProductResponse,
  ProductWithFullData,
  ApiError
} from './types.products.admin'

// Logger for main operations
const logger = {
  info: (message: string, meta?: any) => console.log(`[ProductUpdateService] ${message}`, meta || ''),
  error: (message: string, error?: any) => console.error(`[ProductUpdateService] ${message}`, error || '')
}

/**
 * Service for updating products
 */
export const serviceUpdateProduct = {
  /**
   * Updates an existing product
   * @param productData - Data for updating the product
   * @returns Promise<UpdateProductResponse>
   * @throws {Error} When request fails
   */
  async updateProduct(productData: UpdateProductRequest): Promise<UpdateProductResponse> {
    const store = useProductsAdminStore()
    const uiStore = useUiStore()

    logger.info('Updating product', {
      productId: productData.productId,
      productCode: productData.productCode,
      translationKey: productData.translationKey,
      canBeOption: productData.canBeOption,
      optionOnly: productData.optionOnly,
      owner: productData.owner
    })

    try {
      const response = await api.post<UpdateProductResponse>('/api/admin/products/update', productData)

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.message || 'Invalid API response format')
      }

      const { product, translations, owner, backupOwner, specialistsGroups } = response.data.data!

      // Format translations for frontend
      const formattedTranslations: any = {}
      translations.forEach(t => {
        formattedTranslations[t.language_code] = {
          name: t.name,
          shortDesc: t.short_desc,
          longDesc: t.long_desc,
          techSpecs: t.tech_specs,
          areaSpecifics: t.area_specifics,
          industrySpecifics: t.industry_specifics,
          keyFeatures: t.key_features,
          productOverview: t.product_overview
        }
      })

      const updatedProductData: ProductWithFullData = {
        ...product,
        translations: formattedTranslations,
        owner,
        backupOwner,
        specialistsGroups
      }

      // Update store with new data
      store.setEditingProductData(updatedProductData)

      logger.info('Successfully updated product', { 
        productId: product.product_id, 
        productCode: product.product_code 
      })

      uiStore.showSuccessSnackbar('Продукт успешно обновлен')
      return response.data

    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data as ApiError
        let userMessage = apiError.message || 'Ошибка обновления продукта'
        uiStore.showErrorSnackbar(userMessage)
        logger.error('API error updating product', { 
          code: apiError.code, 
          message: apiError.message, 
          details: apiError.details 
        })
        return { success: false, message: apiError.message || 'Ошибка обновления продукта', data: undefined }
      } else {
        const errorMessage = error.message || 'Неизвестная ошибка при обновлении продукта'
        uiStore.showErrorSnackbar(errorMessage)
        logger.error('Network error updating product', error)
      }
      return { success: false, message: error.message || 'Ошибка обновления продукта', data: undefined }
    }
  },

  /**
   * Updates product with current form data from store
   * @returns Promise<UpdateProductResponse>
   */
  async updateProductFromForm(): Promise<UpdateProductResponse> {
    const store = useProductsAdminStore()
    
    if (!store.editingProductId) {
      logger.error('No product ID available for update')
      return { success: false, message: 'No product ID available for update', data: undefined }
    }

    // Prepare update data from current form state
    const updateData: UpdateProductRequest = {
      productId: store.editingProductId,
      productCode: store.formData.productCode,
      translationKey: store.formData.translationKey,
      canBeOption: store.formData.canBeOption,
      optionOnly: store.formData.optionOnly,
      owner: store.formData.owner,
      backupOwner: store.formData.backupOwner,
      specialistsGroups: store.formData.specialistsGroups,
      translations: store.formData.translations,
      visibility: store.formData.visibility
    }

    return await this.updateProduct(updateData)
  }
}

export default serviceUpdateProduct
