/**
 * service.admin.update.sections.publish.ts - version 1.0.0
 * Frontend service for updating product sections publish bindings.
 * 
 * Makes API call to /api/admin/products/update-sections-publish endpoint,
 * handles authentication and error responses, returns formatted data for
 * ProductEditorCatalogPublication component.
 * 
 * Frontend file - service.admin.update.sections.publish.ts
 */

import { api } from '@/core/api/service.axios'
import type { UpdateProductSectionsPublishRequest, UpdateProductSectionsPublishResponse } from '../../types.products.admin'

/**
 * Updates product sections publish bindings
 * @param productId - Product ID to update
 * @param sectionIds - Array of section IDs to publish product in
 * @returns Promise with update result
 * @throws Error if API call fails
 */
export const updateProductSectionsPublish = async (
  productId: string, 
  sectionIds: string[]
): Promise<UpdateProductSectionsPublishResponse> => {
  try {
    const requestData: UpdateProductSectionsPublishRequest = {
      productId,
      sectionIds
    }

    const response = await api.post<UpdateProductSectionsPublishResponse>(
      '/api/admin/products/update-sections-publish', 
      requestData
    )
    
    if (response.data.success) {
      return response.data
    } else {
      throw new Error(response.data.message || 'Failed to update product sections publish')
    }
  } catch (error) {
    // Handle different types of errors
    if (error instanceof Error) {
      if (error.message.includes('Network Error') || error.message.includes('timeout')) {
        throw new Error('Не удалось подключиться к серверу. Проверьте подключение к интернету.')
      }
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        throw new Error('Сессия истекла. Пожалуйста, войдите в систему заново.')
      }
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        throw new Error('У вас нет прав для обновления публикации продуктов.')
      }
      if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        throw new Error('Произошла ошибка на сервере. Попробуйте позже.')
      }
      throw new Error('Произошла ошибка при обновлении публикации продукта.')
    }
    
    throw new Error('Произошла неизвестная ошибка при обновлении данных.')
  }
}

export default updateProductSectionsPublish
