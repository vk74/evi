/**
 * @file service.fetch.user.groups.ts
 * Version: 1.0.1
 * Backend service to fetch groups a user belongs to with pagination and sorting. Backend file.
 */
import { Request } from 'express'
import { Pool } from 'pg'
import { pool as pgPool } from '../../../../core/db/maindb'
import { queries as userQueries } from './queries.user.editor'

const pool = pgPool as Pool

export interface FetchUserGroupsParams {
  userId: string
  page: number
  itemsPerPage: number
  sortBy?: string
  sortDesc?: boolean
  search?: string
}

const SORT_WHITELIST: Record<string, string> = {
  group_id: 'g.group_id',
  group_name: 'g.group_name',
  group_status: 'g.group_status',
  is_system: 'g.is_system'
}

export async function fetchUserGroups(params: FetchUserGroupsParams, req: Request) {
  const { userId, page, itemsPerPage, sortBy, sortDesc, search } = params

  const offset = (page - 1) * itemsPerPage
  const orderExpr = SORT_WHITELIST[sortBy || 'group_name'] || 'g.group_name'
  const orderDir = sortDesc ? 'DESC' : 'ASC'

  // Use common WHERE clause; pass NULL for search when empty to avoid filtering all
  const searchParam = (search && search.trim().length > 0) ? search.trim() : null

  const countSql = `SELECT COUNT(*) AS total ${userQueries.userGroupsWhereClause}`
  const rowsSql = `
    SELECT g.group_id, g.group_name, g.group_status, g.is_system
    ${userQueries.userGroupsWhereClause}
    ORDER BY ${orderExpr} ${orderDir}
    LIMIT $3 OFFSET $4
  `

  const client = await pool.connect()
  try {
    const countRes = await client.query(countSql, [userId, searchParam])
    const total = Number(countRes.rows[0]?.total || 0)
    const rowsRes = await client.query(rowsSql, [userId, searchParam, itemsPerPage, offset])
    return {
      success: true,
      data: { items: rowsRes.rows, total }
    }
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Failed to fetch user groups' }
  } finally {
    client.release()
  }
}
