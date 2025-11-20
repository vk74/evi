/**
 * service.admin.service.publish.ts
 * Version: 1.0.0
 * Description: Service to publish services to catalog sections
 * Purpose: Adds service-section mappings to app.section_services for given service_ids and section_ids
 * Backend file - service.admin.service.publish.ts
 */

import { Request } from 'express'
import { Pool } from 'pg'
import { pool as defaultPool } from '@/core/db/maindb'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { EVENTS_ADMIN_CATALOG } from './events.admin.catalog'
import { queries } from '../service/queries.admin.service'

const pgPool: Pool = (defaultPool as unknown as Pool)

export interface ServicePublishRequest {
  service_ids: string[]
  section_ids: string[]
}

export interface ServicePublishResponse {
  success: boolean
  message: string
  addedCount: number
  updatedCount: number
}

export async function servicePublish(req: Request): Promise<ServicePublishResponse> {
  const serviceIds: string[] = Array.isArray(req.body?.service_ids) ? req.body.service_ids : []
  const sectionIds: string[] = Array.isArray(req.body?.section_ids) ? req.body.section_ids : []

  createAndPublishEvent({
    eventName: EVENTS_ADMIN_CATALOG['services.publish.started'].eventName,
    payload: {
      serviceIdsCount: serviceIds.length,
      sectionIdsCount: sectionIds.length
    }
  })

  if (!serviceIds || serviceIds.length === 0) {
    return { success: false, message: 'service_ids is required and must not be empty', addedCount: 0, updatedCount: 0 }
  }

  if (!sectionIds || sectionIds.length === 0) {
    return { success: false, message: 'section_ids is required and must not be empty', addedCount: 0, updatedCount: 0 }
  }

  const client = await pgPool.connect()
  try {
    await client.query('BEGIN')

    // Validate services exist and have status = 'in_production'
    const servicesCheck = await client.query(
      'SELECT id, status FROM app.services WHERE id = ANY($1)',
      [serviceIds]
    )
    const existingServiceIds = new Set<string>(servicesCheck.rows.map((r: any) => r.id))
    const invalidServices = serviceIds.filter(id => !existingServiceIds.has(id))
    
    if (invalidServices.length > 0) {
      await client.query('ROLLBACK')
      return { success: false, message: `Some services do not exist: ${invalidServices.join(', ')}`, addedCount: 0, updatedCount: 0 }
    }

    const inactiveServices = servicesCheck.rows
      .filter((r: any) => r.status !== 'in_production')
      .map((r: any) => r.id)
    
    if (inactiveServices.length > 0) {
      await client.query('ROLLBACK')
      return { success: false, message: `Some services are not active: ${inactiveServices.join(', ')}`, addedCount: 0, updatedCount: 0 }
    }

    // Validate sections exist
    const sectionsCheck = await client.query(queries.checkSectionsExist, [sectionIds])
    const existingSectionIds = new Set<string>(sectionsCheck.rows.map((r: any) => r.id))
    const invalidSections = sectionIds.filter(id => !existingSectionIds.has(id))
    
    if (invalidSections.length > 0) {
      await client.query('ROLLBACK')
      return { success: false, message: `Some sections do not exist: ${invalidSections.join(', ')}`, addedCount: 0, updatedCount: 0 }
    }

    // Check existing mappings
    const existingMappings = await client.query(
      'SELECT section_id, service_id FROM app.section_services WHERE service_id = ANY($1) AND section_id = ANY($2)',
      [serviceIds, sectionIds]
    )
    const existingSet = new Set<string>(
      existingMappings.rows.map((r: any) => `${r.service_id}:${r.section_id}`)
    )

    let addedCount = 0
    let updatedCount = 0

    // Insert new mappings
    for (const serviceId of serviceIds) {
      for (const sectionId of sectionIds) {
        const key = `${serviceId}:${sectionId}`
        if (!existingSet.has(key)) {
          // Get next order in section
          const nextOrderRes = await client.query(queries.getNextOrderInSection, [sectionId])
          const nextOrder = Number(nextOrderRes.rows[0]?.next_order ?? 0)
          
          await client.query(queries.insertSectionService, [sectionId, serviceId, nextOrder])
          addedCount++
        } else {
          updatedCount++
        }
      }
    }

    await client.query('COMMIT')

    createAndPublishEvent({
      eventName: EVENTS_ADMIN_CATALOG['services.publish.success'].eventName,
      payload: {
        serviceIdsCount: serviceIds.length,
        sectionIdsCount: sectionIds.length,
        addedCount,
        updatedCount
      }
    })

    return { success: true, message: 'Services published successfully', addedCount, updatedCount }
  } catch (e: any) {
    await client.query('ROLLBACK')

    createAndPublishEvent({
      eventName: EVENTS_ADMIN_CATALOG['services.publish.database_error'].eventName,
      payload: {
        serviceIdsCount: serviceIds.length,
        sectionIdsCount: sectionIds.length,
        error: e?.message || 'Failed to publish services'
      },
      errorData: e?.message || 'Failed to publish services'
    })

    throw { success: false, message: e?.message || 'Failed to publish services', addedCount: 0, updatedCount: 0 }
  } finally {
    client.release()
  }
}

export default servicePublish

