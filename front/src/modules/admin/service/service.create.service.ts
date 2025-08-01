/**
 * @file service.create.service.ts
 * Service for creating services via API.
 * Version: 1.0.0
 * FRONTEND service for creating services through API.
 *
 * Functionality:
 * - Creates services via API
 * - Handles validation and error responses
 * - Provides user-friendly error messages
 * - Integrates with UI store for toast notifications
 * - Follows established patterns from other services
 */

import { api } from '@/core/api/service.axios'
import { useServicesAdminStore } from './state.services.admin'
import { useUiStore } from '@/core/state/uistate'
import type { 
  CreateServiceRequest,
  CreateServiceResponse,
  ApiError
} from './types.services.admin'

// Logger for main operations
const logger = {
  info: (message: string, meta?: any) => console.log(`[ServiceCreateService] ${message}`, meta || ''),
  error: (message: string, error?: any) => console.error(`[ServiceCreateService] ${message}`, error || '')
}

/**
 * Service for creating services
 */
export const serviceCreateService = {
  /**
   * Creates a new service
   * @param serviceData - Data for the new service
   * @returns Promise<CreateServiceResponse>
   * @throws {Error} When request fails
   */
  async createService(serviceData: CreateServiceRequest): Promise<CreateServiceResponse> {
    const store = useServicesAdminStore()
    const uiStore = useUiStore()

    logger.info('Creating service', {
      name: serviceData.name,
      owner: serviceData.owner,
      priority: serviceData.priority
    })

    try {
      // Make API request
      const response = await api.post<CreateServiceResponse>(
        '/api/admin/services/create',
        serviceData
      )

      // Validate response format
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Invalid API response format')
      }

      logger.info('Successfully created service', {
        serviceId: response.data.data?.id,
        serviceName: response.data.data?.name,
        message: response.data.message
      })

      // Show success message
      uiStore.showSuccessSnackbar(response.data.message || 'Сервис успешно создан')

      // Close editor and return to services list
      store.closeServiceEditor()

      return response.data

    } catch (error: any) {
      // Handle API error responses
      if (error.response?.data) {
        const apiError = error.response.data as ApiError
        
        // Map error codes to user-friendly messages
        let userMessage = apiError.message || 'Ошибка создания сервиса'
        
        if (apiError.code === 'REQUIRED_FIELD_ERROR') {
          const field = apiError.details?.field as string
          userMessage = `Обязательное поле не заполнено: ${field}`
        } else if (apiError.code === 'VALIDATION_ERROR') {
          const field = apiError.details?.field as string
          userMessage = `Ошибка валидации поля "${field}": ${apiError.message}`
        } else if (apiError.code === 'CONFLICT') {
          const field = apiError.details?.field as string
          if (field === 'name') {
            userMessage = 'Сервис с таким именем уже существует'
          } else {
            userMessage = apiError.message || 'Конфликт данных'
          }
        } else if (apiError.code === 'AUTHENTICATION_ERROR') {
          userMessage = 'Ошибка аутентификации'
        } else if (apiError.code === 'DATABASE_ERROR') {
          userMessage = 'Ошибка базы данных'
        }

        // Show error message
        uiStore.showErrorSnackbar(userMessage)
        
        logger.error('API error creating service', {
          code: apiError.code,
          message: apiError.message,
          details: apiError.details
        })
      } else {
        // Handle network or other errors
        const errorMessage = error.message || 'Неизвестная ошибка при создании сервиса'
        uiStore.showErrorSnackbar(errorMessage)
        
        logger.error('Network error creating service', error)
      }

      // Re-throw error for component handling
      throw error
    }
  }
} 