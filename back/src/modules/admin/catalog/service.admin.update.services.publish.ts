/**
 * service.admin.update.services.publish.ts
 * Version: 1.0.0
 * Description: Service to replace published services for a catalog section
 * Purpose: Applies full replacement into app.section_services for given section_id
 * Backend file - service.admin.update.services.publish.ts
 */

import { Request } from 'express'
import { Pool } from 'pg'
import { pool as defaultPool } from '@/core/db/maindb'

const pgPool: Pool = (defaultPool as unknown as Pool)

export async function updateSectionServicesPublish(req: Request) {
  const sectionId = (req.body?.section_id || req.body?.sectionId) as string
  const serviceIds: string[] = Array.isArray(req.body?.service_ids) ? req.body.service_ids : []

  if (!sectionId) {
    return { success: false, message: 'section_id is required' }
  }

  const client = await pgPool.connect()
  try {
    await client.query('BEGIN')
    // Clear existing mappings
    await client.query('DELETE FROM app.section_services WHERE section_id = $1', [sectionId])
    // Re-insert with contiguous order starting from 0
    for (let i = 0; i < serviceIds.length; i++) {
      await client.query('INSERT INTO app.section_services(section_id, service_id, service_order) VALUES ($1, $2, $3)', [sectionId, serviceIds[i], i])
    }
    await client.query('COMMIT')
    return { success: true, message: 'Section publish updated', addedCount: serviceIds.length, removedCount: 0 }
  } catch (e: any) {
    await client.query('ROLLBACK')
    throw { success: false, message: e?.message || 'Failed to update section publish' }
  } finally {
    client.release()
  }
}

export default updateSectionServicesPublish


