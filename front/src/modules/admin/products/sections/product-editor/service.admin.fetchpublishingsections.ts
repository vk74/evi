/**
 * service.admin.fetchpublishingsections.ts - version 1.0.1
 * Frontend service for fetching publishing sections from backend API for products.
 * 
 * Makes API call to /api/admin/products/fetchpublishingsections endpoint,
 * handles authentication and error responses, returns formatted data for
 * ProductEditorCatalogPublication component.
 * 
 * Frontend file - service.admin.fetchpublishingsections.ts
 */

import { api } from '@/core/api/service.axios'
import type { CatalogSection, FetchPublishingSectionsResponse } from '../../types.products.admin'

/**
 * Fetches publishing sections from backend API for products
 * @param productId - Optional product ID to get current publication status
 * @returns Promise with publishing sections data
 * @throws Error if API call fails
 */
export const fetchPublishingSections = async (productId?: string): Promise<CatalogSection[]> => {
  try {
    const response = await api.get<FetchPublishingSectionsResponse>('/api/admin/products/fetchpublishingsections', {
      params: productId ? { productId } : undefined
    })
    
    if (response.data.success && response.data.data) {
      return response.data.data.sections
    } else {
      throw new Error(response.data.message || 'Failed to fetch publishing sections')
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
        throw new Error('У вас нет прав для просмотра секций публикации.')
      }
      if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        throw new Error('Произошла ошибка на сервере. Попробуйте позже.')
      }
      throw new Error('Произошла ошибка при загрузке секций публикации.')
    }
    
    throw new Error('Произошла неизвестная ошибка при загрузке данных.')
  }
}

export default fetchPublishingSections
