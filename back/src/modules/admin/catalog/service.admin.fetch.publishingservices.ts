/**
 * service.admin.fetch.publishingservices.ts
 * Version: 1.2.0
 * Description: Service for fetching active services with their publication status across all catalog sections
 * Purpose: Implements GET /api/admin/catalog/fetchpublishingservices - returns all active services with sections where published
 * Backend file - service.admin.fetch.publishingservices.ts
 * 
 * Changes in v1.1.0:
 * - Removed sectionId parameter requirement
 * - Returns all active services (status = 'in_production') with their publication status
 * - For each service, returns array of sections where it's published
 * - Returns all catalog sections in separate field
 * - Structured for ServicesPublisher.vue component
 * 
 * Changes in v1.2.0:
 * - Removed "started" event
 * - Enhanced payload for services.sections.fetch.success with serviceIds and sectionIds arrays
 */

import { Request } from 'express'
import { Pool } from 'pg'
import { pool as defaultPool } from '@/core/db/maindb'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import { EVENTS_ADMIN_CATALOG } from './events.admin.catalog'

const pgPool: Pool = (defaultPool as unknown as Pool)

export async function fetchPublishingServices(req: Request) {
  try {
    // Fetch all active services (status = 'in_production')
    const servicesSql = `
      WITH owners AS (
        SELECT su.service_id, u.username AS owner
        FROM app.service_users su
        JOIN app.users u ON su.user_id = u.user_id
        WHERE su.role_type = 'owner'
      )
      SELECT s.id, s.name, s.status, o.owner
      FROM app.services s
      LEFT JOIN owners o ON o.service_id = s.id
      WHERE s.status = 'in_production'
      ORDER BY s.name ASC
    `
    const servicesRes = await pgPool.query(servicesSql)

    // Fetch all section-service mappings
    const mappingsSql = `
      SELECT ss.service_id, ss.section_id, cs.name AS section_name, cs.status AS section_status
      FROM app.section_services ss
      JOIN app.catalog_sections cs ON ss.section_id = cs.id
    `
    const mappingsRes = await pgPool.query(mappingsSql)

    // Build map of service_id -> sections where published
    const serviceSectionsMap = new Map<string, Array<{ id: string; name: string; status: string }>>()
    mappingsRes.rows.forEach((r: any) => {
      if (!serviceSectionsMap.has(r.service_id)) {
        serviceSectionsMap.set(r.service_id, [])
      }
      serviceSectionsMap.get(r.service_id)!.push({
        id: r.section_id,
        name: r.section_name,
        status: r.section_status
      })
    })

    // Fetch all catalog sections
    const sectionsSql = `
      SELECT id, name, owner, backup_owner, description, comments, status, is_public, "order", parent_id, icon_name, color, created_at, created_by, modified_at, modified_by
      FROM app.catalog_sections
      ORDER BY name ASC
    `
    const sectionsRes = await pgPool.query(sectionsSql)

    // Build services array with publication info
    const services = servicesRes.rows.map((r: any) => {
      const sections = serviceSectionsMap.get(r.id) || []
      const allSectionStatuses = [...new Set(sections.map((s: any) => s.status))].filter(Boolean)
      
      return {
        id: r.id,
        serviceId: r.id,
        serviceName: r.name,
        serviceStatus: r.status,
        sections: sections,
        published: sections.length > 0,
        allSectionStatuses: allSectionStatuses
      }
    })

    // Format sections for response
    const sections = sectionsRes.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      owner: r.owner,
      backup_owner: r.backup_owner,
      description: r.description,
      comments: r.comments,
      status: r.status,
      is_public: r.is_public,
      order: r.order,
      parent_id: r.parent_id,
      icon_name: r.icon_name,
      color: r.color,
      created_at: r.created_at,
      created_by: r.created_by,
      modified_at: r.modified_at,
      modified_by: r.modified_by
    }))

    const result = {
      success: true,
      message: 'ok',
      data: {
        services,
        sections
      }
    }

    createAndPublishEvent({
      eventName: EVENTS_ADMIN_CATALOG['services.sections.fetch.success'].eventName,
      payload: {
        servicesCount: services.length,
        sectionsCount: sections.length,
        serviceIds: services.map(s => s.id),
        sectionIds: sections.map(s => s.id)
      }
    })

    return result
  } catch (e: any) {
    createAndPublishEvent({
      eventName: EVENTS_ADMIN_CATALOG['services.publish.fetch.validation_error'].eventName,
      payload: {
        error: e?.message || 'Failed to fetch services and sections'
      },
      errorData: e?.message || 'Failed to fetch services and sections'
    })
    throw { success: false, message: e?.message || 'Failed to fetch services and sections' }
  }
}

export default fetchPublishingServices


