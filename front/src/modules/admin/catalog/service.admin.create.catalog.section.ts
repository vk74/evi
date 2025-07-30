/**
 * @file service.create.catalog.section.ts
 * Service for creating catalog sections via API.
 * Version: 1.0.0
 * FRONTEND service for creating catalog sections through API.
 *
 * Functionality:
 * - Creates catalog sections via API
 * - Handles validation and error responses
 * - Provides user-friendly error messages
 * - Integrates with UI store for toast notifications
 * - Follows established patterns from other services
 */

import { api } from '@/core/api/service.axios'
import { useCatalogAdminStore } from './state.catalog.admin'
import { useUiStore } from '@/core/state/uistate'
import type { 
  CreateSectionRequest,
  CreateSectionResponse,
  ApiError
} from './types.catalog.admin'

// Logger for main operations
const logger = {
  info: (message: string, meta?: any) => console.log(`[CatalogSectionCreateService] ${message}`, meta || ''),
  error: (message: string, error?: any) => console.error(`[CatalogSectionCreateService] ${message}`, error || '')
}

/**
 * Service for creating catalog sections
 */
export const catalogSectionCreateService = {
  /**
   * Creates a new catalog section
   * @param sectionData - Data for the new section
   * @returns Promise<CreateSectionResponse>
   * @throws {Error} When request fails
   */
  async createSection(sectionData: CreateSectionRequest): Promise<CreateSectionResponse> {
    const store = useCatalogAdminStore()
    const uiStore = useUiStore()

    logger.info('Creating catalog section', {
      name: sectionData.name,
      owner: sectionData.owner,
      order: sectionData.order
    })

    try {
      // Make API request
      const response = await api.post<CreateSectionResponse>(
        '/api/admin/catalog/create-section',
        sectionData
      )

      // Validate response format
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Invalid API response format')
      }

      logger.info('Successfully created catalog section', {
        sectionId: response.data.data?.id,
        sectionName: response.data.data?.name,
        message: response.data.message
      })

      // Show success message
      uiStore.showSuccessSnackbar(response.data.message || 'Секция каталога успешно создана')

      // Refresh sections list to include the new section
      await store.refreshSections()

      return response.data

    } catch (error: any) {
      // Handle API error responses
      if (error.response?.data) {
        const apiError = error.response.data as ApiError
        
        // Map error codes to user-friendly messages
        let userMessage = apiError.message || 'Ошибка создания секции каталога'
        
        if (apiError.code === 'REQUIRED_FIELD_ERROR') {
          const field = apiError.details?.field as string
          userMessage = `Обязательное поле не заполнено: ${field}`
        } else if (apiError.code === 'VALIDATION_ERROR') {
          const field = apiError.details?.field as string
          userMessage = `Ошибка валидации поля "${field}": ${apiError.message}`
        } else if (apiError.code === 'CONFLICT') {
          const field = apiError.details?.field as string
          if (field === 'name') {
            userMessage = 'Секция с таким именем уже существует'
          } else if (field === 'order') {
            userMessage = 'Секция с таким порядковым номером уже существует'
          } else {
            userMessage = apiError.message || 'Конфликт данных'
          }
        }

        logger.error('API error creating section:', apiError)
        uiStore.showErrorSnackbar(userMessage)
        
        // Re-throw with user-friendly message
        throw new Error(userMessage)
      } else {
        // Handle network or other errors
        const errorMessage = error.message || 'Ошибка сети при создании секции'
        logger.error('Error creating catalog section:', error)
        uiStore.showErrorSnackbar(errorMessage)
        throw new Error(errorMessage)
      }
    }
  }
}

export default catalogSectionCreateService 