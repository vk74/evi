/**
 * service.admin.service.unpublish.ts
 * Version: 1.1.0
 * Description: Service to unpublish services from catalog sections
 * Purpose: Removes service-section mappings from app.section_services for given service_ids and section_ids
 * Backend file - service.admin.service.unpublish.ts
 * 
 * Changes in v1.1.0:
 * - Removed "started" event
 * - Enhanced payload for services.unpublish.success with detailed service/section names and mappings
 * - Enhanced payload for services.unpublish.database_error with serviceIds and sectionIds arrays
 */

import { Request } from 'express'
import { Pool } from 'pg'
import { pool as defaultPool } from '@/core/db/maindb'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { EVENTS_ADMIN_CATALOG } from './events.admin.catalog'
import { queries } from '../service/queries.admin.service'

const pgPool: Pool = (defaultPool as unknown as Pool)

export interface ServiceUnpublishRequest {
  service_ids: string[]
  section_ids: string[]
}

export interface ServiceUnpublishResponse {
  success: boolean
  message: string
  removedCount: number
}

export async function serviceUnpublish(req: Request): Promise<ServiceUnpublishResponse> {
  const serviceIds: string[] = Array.isArray(req.body?.service_ids) ? req.body.service_ids : []
  const sectionIds: string[] = Array.isArray(req.body?.section_ids) ? req.body.section_ids : []

  if (!serviceIds || serviceIds.length === 0) {
    return { success: false, message: 'service_ids is required and must not be empty', removedCount: 0 }
  }

  if (!sectionIds || sectionIds.length === 0) {
    return { success: false, message: 'section_ids is required and must not be empty', removedCount: 0 }
  }

  const client = await pgPool.connect()
  try {
    await client.query('BEGIN')

    // Validate services exist
    const servicesCheck = await client.query(
      'SELECT id FROM app.services WHERE id = ANY($1)',
      [serviceIds]
    )
    const existingServiceIds = new Set<string>(servicesCheck.rows.map((r: any) => r.id))
    const invalidServices = serviceIds.filter(id => !existingServiceIds.has(id))
    
    if (invalidServices.length > 0) {
      await client.query('ROLLBACK')
      return { success: false, message: `Some services do not exist: ${invalidServices.join(', ')}`, removedCount: 0 }
    }

    // Validate sections exist
    const sectionsCheck = await client.query(queries.checkSectionsExist, [sectionIds])
    const existingSectionIds = new Set<string>(sectionsCheck.rows.map((r: any) => r.id))
    const invalidSections = sectionIds.filter(id => !existingSectionIds.has(id))
    
    if (invalidSections.length > 0) {
      await client.query('ROLLBACK')
      return { success: false, message: `Some sections do not exist: ${invalidSections.join(', ')}`, removedCount: 0 }
    }

    let removedCount = 0
    const affectedSections = new Set<string>()
    const unpublishedMappings: Array<{ serviceId: string; sectionId: string }> = []

    // Delete mappings
    for (const serviceId of serviceIds) {
      for (const sectionId of sectionIds) {
        const deleteRes = await client.query(queries.deleteServiceFromSection, [serviceId, sectionId])
        if (deleteRes.rowCount && deleteRes.rowCount > 0) {
          removedCount++
          affectedSections.add(sectionId)
          unpublishedMappings.push({ serviceId, sectionId })
        }
      }
    }

    // Resequence orders in affected sections
    for (const sectionId of affectedSections) {
      await client.query(queries.resequenceSectionServices, [sectionId])
    }

    await client.query('COMMIT')

    // Fetch service and section names for detailed payload
    const servicesRes = await client.query(
      'SELECT id, name FROM app.services WHERE id = ANY($1)',
      [serviceIds]
    )
    const sectionsRes = await client.query(
      'SELECT id, name FROM app.catalog_sections WHERE id = ANY($1)',
      [sectionIds]
    )

    const servicesMap = new Map<string, string>()
    servicesRes.rows.forEach((r: any) => {
      servicesMap.set(r.id, r.name)
    })

    const sectionsMap = new Map<string, string>()
    sectionsRes.rows.forEach((r: any) => {
      sectionsMap.set(r.id, r.name)
    })

    const unpublishedMappingsDetailed = unpublishedMappings.map(m => ({
      serviceId: m.serviceId,
      serviceName: servicesMap.get(m.serviceId) || 'Unknown',
      sectionId: m.sectionId,
      sectionName: sectionsMap.get(m.sectionId) || 'Unknown'
    }))

    createAndPublishEvent({
      eventName: EVENTS_ADMIN_CATALOG['services.unpublish.success'].eventName,
      payload: {
        serviceIdsCount: serviceIds.length,
        sectionIdsCount: sectionIds.length,
        removedCount,
        services: Array.from(servicesMap.entries()).map(([id, name]) => ({ id, name })),
        sections: Array.from(sectionsMap.entries()).map(([id, name]) => ({ id, name })),
        unpublishedMappings: unpublishedMappingsDetailed
      }
    })

    return { success: true, message: 'Services unpublished successfully', removedCount }
  } catch (e: any) {
    await client.query('ROLLBACK')

    createAndPublishEvent({
      eventName: EVENTS_ADMIN_CATALOG['services.unpublish.database_error'].eventName,
      payload: {
        serviceIdsCount: serviceIds.length,
        sectionIdsCount: sectionIds.length,
        serviceIds,
        sectionIds,
        error: e?.message || 'Failed to unpublish services'
      },
      errorData: e?.message || 'Failed to unpublish services'
    })

    throw { success: false, message: e?.message || 'Failed to unpublish services', removedCount: 0 }
  } finally {
    client.release()
  }
}

export default serviceUnpublish

