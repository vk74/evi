/**
 * service.admin.deleteservices.ts - version 1.0.0
 * Service for deleting services with validation and error handling.
 * 
 * Handles database operations for service deletion with proper logging.
 * 
 * File: service.admin.deleteservices.ts
 * Created: 2024-12-19
 * Last updated: 2024-12-19
 */

import { Pool } from 'pg'
import { queries } from '../queries.admin.service'
import { EVENTS_ADMIN_SERVICES } from '../events.admin.services'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'

// Request parameters interface
interface DeleteServicesParams {
  serviceIds: string[]
}

// Response interface
interface DeleteServicesResult {
  deletedServices: Array<{id: string, name: string}>
  errors: Array<{id: string, error: string}>
  totalRequested: number
  totalDeleted: number
  totalErrors: number
}

/**
 * Validates service IDs
 */
const validateServiceIds = (serviceIds: string[]): { isValid: boolean, errors: string[] } => {
  const errors: string[] = []
  
  if (!Array.isArray(serviceIds)) {
    errors.push('Service IDs must be an array')
    return { isValid: false, errors }
  }
  
  if (serviceIds.length === 0) {
    errors.push('At least one service ID must be provided')
    return { isValid: false, errors }
  }
  
  if (serviceIds.length > 100) {
    errors.push('Maximum 100 services can be deleted at once')
    return { isValid: false, errors }
  }
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  for (const id of serviceIds) {
    if (typeof id !== 'string' || !uuidRegex.test(id)) {
      errors.push(`Invalid UUID format: ${id}`)
    }
  }
  
  return { isValid: errors.length === 0, errors }
}

/**
 * Checks which services exist in the database
 */
const checkServicesExist = async (client: any, serviceIds: string[]): Promise<{existing: string[], notFound: string[]}> => {
  const existing: string[] = []
  const notFound: string[] = []
  
  for (const id of serviceIds) {
    try {
      const result = await client.query(queries.checkServiceExists, [id])
      if (result.rows.length > 0) {
        existing.push(id)
        await createAndPublishEvent({
          eventName: EVENTS_ADMIN_SERVICES['service.delete.exists'].eventName,
          payload: {
            serviceId: id,
            timestamp: new Date().toISOString()
          }
        })
      } else {
        notFound.push(id)
        await createAndPublishEvent({
          eventName: EVENTS_ADMIN_SERVICES['service.delete.not_found'].eventName,
          payload: {
            serviceId: id,
            timestamp: new Date().toISOString()
          }
        })
      }
    } catch (error) {
      console.error(`[DeleteServices] Error checking service ${id}:`, error)
      notFound.push(id)
    }
  }
  
  return { existing, notFound }
}

/**
 * Deletes services from database
 */
export const deleteServices = async (
  pool: Pool,
  params: DeleteServicesParams
): Promise<DeleteServicesResult> => {
  const client = await pool.connect()
  
  try {
    const { serviceIds } = params
    
    // Validate input
    const validation = validateServiceIds(serviceIds)
    if (!validation.isValid) {
      await createAndPublishEvent({
        eventName: EVENTS_ADMIN_SERVICES['service.delete.validation.error'].eventName,
        payload: {
          errors: validation.errors,
          serviceIds,
          timestamp: new Date().toISOString()
        }
      })
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }
    
    await createAndPublishEvent({
      eventName: EVENTS_ADMIN_SERVICES['service.delete.validation.success'].eventName,
      payload: {
        serviceIds,
        timestamp: new Date().toISOString()
      }
    })
    
    // Check which services exist
    const { existing, notFound } = await checkServicesExist(client, serviceIds)
    
    if (existing.length === 0) {
      return {
        deletedServices: [],
        errors: notFound.map(id => ({ id, error: 'Service not found' })),
        totalRequested: serviceIds.length,
        totalDeleted: 0,
        totalErrors: notFound.length
      }
    }
    
    // Delete existing services
    const deletedServices: Array<{id: string, name: string}> = []
    const errors: Array<{id: string, error: string}> = []
    
    // Add not found services to errors
    errors.push(...notFound.map(id => ({ id, error: 'Service not found' })))
    
    // Delete existing services
    try {
      const result = await client.query(queries.deleteServices, [existing])
      
      for (const row of result.rows) {
        deletedServices.push({
          id: row.id,
          name: row.name
        })
      }
      
      // Log success
      await createAndPublishEvent({
        eventName: EVENTS_ADMIN_SERVICES['service.delete.success'].eventName,
        payload: {
          deletedServices: deletedServices.map(s => s.id),
          totalDeleted: deletedServices.length,
          timestamp: new Date().toISOString()
        }
      })
      
    } catch (error) {
      console.error('[DeleteServices] Database error:', error)
      await createAndPublishEvent({
        eventName: EVENTS_ADMIN_SERVICES['service.delete.database_error'].eventName,
        payload: {
          serviceIds: existing,
          error: error instanceof Error ? error.message : 'Unknown database error',
          timestamp: new Date().toISOString()
        }
      })
      
      // Add all existing services to errors
      errors.push(...existing.map(id => ({ 
        id, 
        error: 'Database error during deletion' 
      })))
    }
    
    const totalDeleted = deletedServices.length
    const totalErrors = errors.length
    
    // Log partial success if some services were deleted but others failed
    if (totalDeleted > 0 && totalErrors > 0) {
      await createAndPublishEvent({
        eventName: EVENTS_ADMIN_SERVICES['service.delete.partial_success'].eventName,
        payload: {
          deletedServices: deletedServices.map(s => s.id),
          failedServices: errors.map(e => e.id),
          totalDeleted,
          totalErrors,
          timestamp: new Date().toISOString()
        }
      })
    }
    
    return {
      deletedServices,
      errors,
      totalRequested: serviceIds.length,
      totalDeleted,
      totalErrors
    }
    
  } finally {
    client.release()
  }
} 