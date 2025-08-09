/**
 * service.admin.fetch.publishingservices.ts
 * Version: 1.0.0
 * Description: Service for fetching services list with selection flag and order for a catalog section
 * Purpose: Implements GET /api/admin/catalog/fetchpublishingservices with pagination/search/sort
 * Backend file - service.admin.fetch.publishingservices.ts
 */

import { Request } from 'express'
import { Pool } from 'pg'
import { pool as defaultPool } from '@/core/db/maindb'

const pgPool: Pool = (defaultPool as unknown as Pool)

export async function fetchPublishingServices(req: Request) {
  const sectionId = (req.query.sectionId || req.query.section_id) as string
  const page = Number(req.query.page ?? 1)
  const perPage = Number(req.query.perPage ?? 25)
  const search = (req.query.search as string) || ''
  const sortBy = (req.query.sortBy as string) || 'name'
  const sortOrder = ((req.query.sortOrder as string) || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC'

  if (!sectionId) {
    return { success: false, message: 'sectionId is required' }
  }

  const offset = (page - 1) * perPage

  // Basic safe sort columns
  const sortColumn = ['name', 'owner', 'status', 'is_public'].includes(sortBy) ? sortBy : 'name'

  // Query selected services for section with order
  const selectedSql = `
    SELECT ss.service_id, ss.service_order
    FROM app.section_services ss
    WHERE ss.section_id = $1
  `
  const selectedRes = await pgPool.query(selectedSql, [sectionId])
  const selectedOrder = new Map<string, number>(selectedRes.rows.map((r: any) => [r.service_id, Number(r.service_order)]))
  const selectedSet = new Set<string>(selectedRes.rows.map((r: any) => r.service_id))

  // Main services list with optional search by name/owner
  const listSql = `
    WITH owners AS (
      SELECT su.service_id, u.username AS owner
      FROM app.service_users su
      JOIN app.users u ON su.user_id = u.user_id
      WHERE su.role_type = 'owner'
    )
    SELECT s.id, s.name, s.is_public, s.status, o.owner
    FROM app.services s
    LEFT JOIN owners o ON o.service_id = s.id
    WHERE ($1::text IS NULL OR $1 = '' OR LOWER(s.name) LIKE LOWER('%' || $1 || '%') OR LOWER(COALESCE(o.owner,'')) LIKE LOWER('%' || $1 || '%'))
    ORDER BY ${sortColumn} ${sortOrder}
    LIMIT $2 OFFSET $3
  `
  const countSql = `
    WITH owners AS (
      SELECT su.service_id, u.username AS owner
      FROM app.service_users su
      JOIN app.users u ON su.user_id = u.user_id
      WHERE su.role_type = 'owner'
    )
    SELECT COUNT(*) AS total
    FROM app.services s
    LEFT JOIN owners o ON o.service_id = s.id
    WHERE ($1::text IS NULL OR $1 = '' OR LOWER(s.name) LIKE LOWER('%' || $1 || '%') OR LOWER(COALESCE(o.owner,'')) LIKE LOWER('%' || $1 || '%'))
  `

  const [listRes, countRes] = await Promise.all([
    pgPool.query(listSql, [search, perPage, offset]),
    pgPool.query(countSql, [search])
  ])

  const items = listRes.rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    owner: r.owner ?? null,
    status: r.status ?? null,
    is_public: !!r.is_public,
    selected: selectedSet.has(r.id),
    order: selectedOrder.get(r.id) ?? null
  }))

  return {
    success: true,
    message: 'ok',
    data: {
      items,
      page,
      perPage,
      total: Number(countRes.rows[0]?.total ?? 0)
    }
  }
}

export default fetchPublishingServices


