/**
 * service.admin.update.sections.publish.ts
 * Version: 1.0.0
 * Description: Service for updating (replacing) catalog sections publish bindings for a service in one transaction
 * Purpose: Applies full replacement of app.section_services mappings for given service_id; supports unpublish (empty list)
 * Backend file - service.admin.update.sections.publish.ts
 */

import { Request } from 'express'
import { Pool } from 'pg'
import { pool as defaultPool } from '@/core/db/maindb'
import { queries } from '../queries.admin.service'
import { EVENTS_ADMIN_SERVICES } from '../events.admin.services'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import type { UpdateSectionsPublishRequest, UpdateSectionsPublishResponse, ServiceError } from '../types.admin.service'

const pgPool: Pool = (defaultPool as unknown as Pool)

export async function updateSectionsPublish(req: Request): Promise<UpdateSectionsPublishResponse> {
  const body = req.body as UpdateSectionsPublishRequest
  const serviceId = body?.service_id
  const targetSectionIds = Array.isArray(body?.section_ids) ? body.section_ids : []

  try {
    // Basic validation
    if (!serviceId || typeof serviceId !== 'string') {
      const err: ServiceError = { code: 'INVALID_REQUEST', message: 'service_id is required' }
      throw err
    }

    // Check service exists
    const serviceExists = await pgPool.query(queries.checkServiceExists, [serviceId])
    if (serviceExists.rowCount === 0) {
      await createAndPublishEvent({
        req,
        eventName: EVENTS_ADMIN_SERVICES['service.sections.publish.update.not_found'].eventName,
        payload: { serviceId }
      })
      const err: ServiceError = { code: 'NOT_FOUND', message: 'Service not found' }
      throw err
    }

    // Validate sections (if provided)
    if (targetSectionIds.length > 0) {
      const sectionsRes = await pgPool.query(queries.checkSectionsExist, [targetSectionIds])
      const existingSet = new Set<string>(sectionsRes.rows.map((r: any) => r.id))
      const invalid = targetSectionIds.filter(id => !existingSet.has(id))
      if (invalid.length > 0) {
        await createAndPublishEvent({
          req,
          eventName: EVENTS_ADMIN_SERVICES['service.sections.publish.update.validation.error'].eventName,
          payload: { serviceId, invalidSectionIds: invalid }
        })
        const err: ServiceError = { code: 'VALIDATION_ERROR', message: 'Some section_ids do not exist', details: { invalidSectionIds: invalid } }
        throw err
      }
    }

    const client = await pgPool.connect()
    try {
      await client.query('BEGIN')

      // Read current bindings
      const currentRes = await client.query(queries.fetchServiceSectionIds, [serviceId])
      const current = new Set<string>(currentRes.rows.map((r: any) => r.section_id))
      const target = new Set<string>(targetSectionIds)

      const toRemove = [...current].filter(id => !target.has(id))
      const toAdd = [...target].filter(id => !current.has(id))

      // Remove mappings and resequence affected sections
      for (const sectionId of toRemove) {
        await client.query(queries.deleteServiceFromSection, [serviceId, sectionId])
        await client.query(queries.resequenceSectionServices, [sectionId])
        await createAndPublishEvent({
          req,
          eventName: EVENTS_ADMIN_SERVICES['service.sections.publish.update.changed'].eventName,
          payload: { serviceId, removedFromSectionId: sectionId }
        })
        await createAndPublishEvent({
          req,
          eventName: EVENTS_ADMIN_SERVICES['service.sections.publish.update.resequenced'].eventName,
          payload: { sectionId }
        })
      }

      // Add mappings with append order
      for (const sectionId of toAdd) {
        const nextOrderRes = await client.query(queries.getNextOrderInSection, [sectionId])
        const nextOrder = Number(nextOrderRes.rows[0]?.next_order ?? 0)
        await client.query(queries.insertSectionService, [sectionId, serviceId, nextOrder])
        await createAndPublishEvent({
          req,
          eventName: EVENTS_ADMIN_SERVICES['service.sections.publish.update.changed'].eventName,
          payload: { serviceId, addedToSectionId: sectionId, order: nextOrder }
        })
      }

      await client.query('COMMIT')

      const response: UpdateSectionsPublishResponse = {
        success: true,
        message: 'Sections publish mappings updated',
        updatedCount: toAdd.length + toRemove.length,
        addedCount: toAdd.length,
        removedCount: toRemove.length
      }
      return response
    } catch (e: any) {
      await client.query('ROLLBACK')
      await createAndPublishEvent({
        req,
        eventName: EVENTS_ADMIN_SERVICES['service.sections.publish.update.database_error'].eventName,
        payload: { serviceId },
        errorData: e?.message || String(e)
      })
      const err: ServiceError = { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update sections publish', details: e }
      throw err
    } finally {
      client.release()
    }
  } catch (error) {
    if ((error as any).code) {
      throw error
    }
    const err: ServiceError = { code: 'INTERNAL_SERVER_ERROR', message: 'Unexpected error', details: error }
    throw err
  }
}

export default updateSectionsPublish


