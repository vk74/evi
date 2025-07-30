/**
 * @file service.update.catalog.section.ts
 * Service for updating catalog sections via API.
 * Version: 1.0.0
 * FRONTEND service for updating catalog sections through API.
 *
 * Functionality:
 * - Updates catalog sections via API
 * - Handles validation and error responses
 * - Provides user-friendly error messages
 * - Integrates with UI store for toast notifications
 * - Follows established patterns from other services
 */

import { api } from '@/core/api/service.axios'
import { useCatalogAdminStore } from './state.catalog.admin'
import { useUiStore } from '@/core/state/uistate'
import type { 
  UpdateSectionRequest,
  UpdateSectionResponse,
  ApiError
} from './types.catalog.admin'

// Logger for main operations
const logger = {
  info: (message: string, meta?: unknown) => console.log(`[CatalogSectionUpdateService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => console.error(`[CatalogSectionUpdateService] ${message}`, error || '')
}

/**
 * Service for updating catalog sections
 */
export const catalogSectionUpdateService = {
  /**
   * Updates an existing catalog section
   * @param sectionId - ID of the section to update
   * @param sectionData - Data for updating the section
   * @returns Promise<UpdateSectionResponse>
   * @throws {Error} When request fails
   */
  async updateSection(sectionId: string, sectionData: UpdateSectionRequest): Promise<UpdateSectionResponse> {
    const store = useCatalogAdminStore()
    const uiStore = useUiStore()

    logger.info('Updating catalog section', {
      sectionId,
      name: sectionData.name,
      owner: sectionData.owner,
      order: sectionData.order
    })

    try {
      // Prepare request data with section ID
      const requestData = {
        id: sectionId,
        ...sectionData
      }

      // Make API request
      const response = await api.post<UpdateSectionResponse>(
        '/api/admin/catalog/update-section',
        requestData
      )

      // Validate response format
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Invalid API response format')
      }

      logger.info('Successfully updated catalog section', {
        sectionId: response.data.data?.id,
        sectionName: response.data.data?.name,
        message: response.data.message
      })

      // Show success message
      uiStore.showSuccessSnackbar(response.data.message || 'Секция каталога успешно обновлена')

      // Refresh sections list to reflect changes
      await store.refreshSections()

      return response.data

    } catch (error: unknown) {
      // Handle API error responses
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: ApiError } }
        if (axiosError.response?.data) {
          const apiError = axiosError.response.data
          
          // Map error codes to user-friendly messages
          let userMessage = apiError.message || 'Ошибка обновления секции каталога'
          
          if (apiError.code === 'NOT_FOUND') {
            userMessage = 'Секция не найдена'
          } else if (apiError.code === 'FORBIDDEN') {
            userMessage = 'Нельзя обновить системную секцию "main"'
          } else if (apiError.code === 'REQUIRED_FIELD_ERROR') {
            const field = apiError.details?.field as string
            userMessage = `Обязательное поле не заполнено: ${field}`
          } else if (apiError.code === 'VALIDATION_ERROR') {
            const field = apiError.details?.field as string
            if (field === 'order') {
              userMessage = 'Порядковый номер должен быть положительным целым числом'
            } else if (field === 'color') {
              userMessage = 'Цвет должен быть в формате hex (например, #FF0000)'
            } else if (field === 'owner') {
              userMessage = 'Владелец не существует'
            } else if (field === 'backup_owner') {
              userMessage = 'Резервный владелец не существует'
            } else {
              userMessage = `Ошибка валидации поля "${field}": ${apiError.message}`
            }
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

          logger.error('API error updating section:', apiError)
          uiStore.showErrorSnackbar(userMessage)
          
          // Re-throw with user-friendly message
          throw new Error(userMessage)
        }
      } else {
        // Handle network or other errors
        const errorMessage = error instanceof Error ? error.message : 'Ошибка сети при обновлении секции'
        logger.error('Error updating catalog section:', error)
        uiStore.showErrorSnackbar(errorMessage)
        throw new Error(errorMessage)
      }
      
      // This should never be reached, but satisfies TypeScript
      throw new Error('Unexpected error in updateSection')
    }
  }
}

export default catalogSectionUpdateService 