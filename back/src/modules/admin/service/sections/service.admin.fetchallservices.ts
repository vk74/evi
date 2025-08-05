/**
 * service.admin.fetchallservices.ts - version 1.0.0
 * Service for fetching all services with pagination, search and sorting.
 * 
 * Handles database queries for services list with user roles.
 * 
 * File: service.admin.fetchallservices.ts
 * Created: 2024-12-19
 * Last updated: 2024-12-19
 */

import { Pool } from 'pg'
import { queries } from '../queries.admin.service'
import type { Service, FetchServicesResponse } from '../types.admin.service'

// Request parameters interface
interface FetchServicesParams {
  page: number
  itemsPerPage: number
  searchQuery?: string
  sortBy?: string
  sortDesc?: boolean
}

// Response interface
interface FetchServicesResult {
  services: Service[]
  totalItems: number
  totalPages: number
  currentPage: number
  itemsPerPage: number
}

/**
 * Fetches all services with pagination, search and sorting
 */
export const fetchAllServices = async (
  pool: Pool,
  params: FetchServicesParams
): Promise<FetchServicesResult> => {
  const client = await pool.connect()
  try {
    const { page, itemsPerPage, searchQuery, sortBy, sortDesc } = params
    
    // Validate parameters
    if (page < 1) throw new Error('Page must be greater than 0')
    if (itemsPerPage < 1 || itemsPerPage > 100) throw new Error('Items per page must be between 1 and 100')
    
    // Calculate offset
    const offset = (page - 1) * itemsPerPage
    
    // Prepare search term
    const searchTerm = searchQuery?.trim() || null
    
    // Prepare sort parameters
    const allowedSortFields = ['name', 'priority', 'status', 'owner', 'technical_owner', 'is_public']
    const sortField = allowedSortFields.includes(sortBy || '') ? sortBy : 'name'
    const sortDirection = sortDesc ? 'DESC' : 'ASC'
    
    // Map sort field to actual column name
    const sortFieldMap: Record<string, string> = {
      'name': 's.name',
      'priority': 's.priority',
      'status': 's.status',
      'owner': 'u1.username',
      'technical_owner': 'u2.username',
      'is_public': 's.is_public'
    }
    const actualSortField = sortFieldMap[sortField as keyof typeof sortFieldMap] || 's.name'
    
    // Build dynamic query
    const baseQuery = `
      SELECT 
        s.id, s.name, s.icon_name, s.priority, s.status, s.is_public,
        s.description_short, s.description_long, s.purpose, s.comments,
        s.created_at, s.created_by, s.modified_at, s.modified_by,
        u1.username as owner,
        u2.username as technical_owner
      FROM app.services s
      LEFT JOIN app.service_users su1 ON s.id = su1.service_id AND su1.role_type = 'owner'
      LEFT JOIN app.users u1 ON su1.user_id = u1.user_id
      LEFT JOIN app.service_users su2 ON s.id = su2.service_id AND su2.role_type = 'technical_owner'
      LEFT JOIN app.users u2 ON su2.user_id = u2.user_id
      WHERE ($1::text IS NULL OR LOWER(s.name) LIKE LOWER('%' || $1 || '%'))
      ORDER BY ${actualSortField} ${sortDirection} NULLS LAST
      LIMIT $2 OFFSET $3
    `
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM app.services s
      WHERE ($1::text IS NULL OR LOWER(s.name) LIKE LOWER('%' || $1 || '%'))
    `
    
    // Execute queries
    const [servicesResult, countResult] = await Promise.all([
      client.query(baseQuery, [searchTerm, itemsPerPage, offset]),
      client.query(countQuery, [searchTerm])
    ])
    
    // Log first service data for debugging
    if (servicesResult.rows.length > 0) {
      console.log('[FetchAllServices] First service raw data from DB:', {
        id: servicesResult.rows[0].id,
        name: servicesResult.rows[0].name,
        icon_name: servicesResult.rows[0].icon_name,
        description_short: servicesResult.rows[0].description_short,
        description_long: servicesResult.rows[0].description_long,
        purpose: servicesResult.rows[0].purpose,
        comments: servicesResult.rows[0].comments
      })
    }
    
    // Process results
    const services: Service[] = servicesResult.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      icon_name: row.icon_name || null,
      support_tier1: null, // Not included in this query
      support_tier2: null, // Not included in this query
      support_tier3: null, // Not included in this query
      owner: row.owner || null,
      backup_owner: null, // Not included in this query
      technical_owner: row.technical_owner || null,
      backup_technical_owner: null, // Not included in this query
      dispatcher: null, // Not included in this query
      priority: row.priority,
      status: row.status,
      description_short: row.description_short || null,
      description_long: row.description_long || null,
      purpose: row.purpose || null,
      comments: row.comments || null,
      is_public: row.is_public,
      access_allowed_groups: null, // Not included in this query
      access_denied_groups: null, // Not included in this query
      access_denied_users: null, // Not included in this query
      created_at: row.created_at,
      created_by: row.created_by,
      modified_at: row.modified_at,
      modified_by: row.modified_by
    }))
    
    // Log first mapped service for debugging
    if (services.length > 0) {
      console.log('[FetchAllServices] First service after mapping:', {
        id: services[0].id,
        name: services[0].name,
        icon_name: services[0].icon_name,
        description_short: services[0].description_short,
        description_long: services[0].description_long,
        purpose: services[0].purpose,
        comments: services[0].comments
      })
    }
    
    const totalItems = parseInt(countResult.rows[0].total)
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    
    return {
      services,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage
    }
  } finally {
    client.release()
  }
} 