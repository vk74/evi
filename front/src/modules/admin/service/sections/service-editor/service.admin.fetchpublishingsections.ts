/**
 * service.admin.fetchpublishingsections.ts - version 1.0.0
 * Frontend service for fetching publishing sections from backend API.
 * 
 * Functionality:
 * - Makes API call to /api/admin/services/fetchpublishingsections endpoint
 * - Handles authentication and error responses
 * - Returns formatted data for ServiceEditorMapping component
 * 
 * File: service.admin.fetchpublishingsections.ts
 * Created: 2024-12-19
 * Last updated: 2024-12-19
 */

import { api } from '@/core/api/service.axios'
import type { PublishingSection, FetchPublishingSectionsResponse } from '../../types.services.admin'

/**
 * Fetches publishing sections from backend API
 * @returns Promise with publishing sections data
 * @throws Error if API call fails
 */
export const fetchPublishingSections = async (serviceId?: string): Promise<PublishingSection[]> => {
  try {
    const response = await api.get<FetchPublishingSectionsResponse>('/api/admin/services/fetchpublishingsections', {
      params: serviceId ? { serviceId } : undefined
    })
    
    if (response.data.success) {
      return response.data.data
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