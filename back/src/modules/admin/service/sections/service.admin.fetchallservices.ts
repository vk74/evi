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
import { EVENTS_ADMIN_SERVICES } from '../events.admin.services'
import { createAndPublishEvent } from '@/core/eventBus/fabric.events'
import type { Service, FetchServicesParams, FetchServicesResult } from '../types.admin.service'

/**
 * Fetches all services with pagination, search and sorting
 */
export const fetchAllServices = async (
  pool: Pool,
  params: FetchServicesParams,
  req: any
): Promise<FetchServicesResult> => {
  const client = await pool.connect()
  try {
    const { page, itemsPerPage, searchQuery, sortBy, sortDesc } = params
    
    // Validate parameters
    if (page < 1) {
      await createAndPublishEvent({
        eventName: EVENTS_ADMIN_SERVICES['service.fetch.validation.error'].eventName,
        req: req,
        payload: {
          error: 'Page must be greater than 0',
          params,
          timestamp: new Date().toISOString()
        }
      })
      throw new Error('Page must be greater than 0')
    }
    
    if (itemsPerPage < 1 || itemsPerPage > 100) {
      await createAndPublishEvent({
        eventName: EVENTS_ADMIN_SERVICES['service.fetch.validation.error'].eventName,
        req: req,
        payload: {
          error: 'Items per page must be between 1 and 100',
          params,
          timestamp: new Date().toISOString()
        }
      })
      throw new Error('Items per page must be between 1 and 100')
    }
    
    // Calculate offset
    const offset = (page - 1) * itemsPerPage
    
    // Prepare search term
    const searchTerm = searchQuery?.trim() || null
    
    // Execute queries using prepared statements
    const [servicesResult, countResult] = await Promise.all([
      client.query(queries.fetchServicesWithRoles, [searchTerm, itemsPerPage, offset]),
      client.query(queries.countServicesWithSearch, [searchTerm])
    ])
    
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
      // Visibility preferences with fallback to false for NULL values
      show_owner: row.show_owner ?? false,
      show_backup_owner: row.show_backup_owner ?? false,
      show_technical_owner: row.show_technical_owner ?? false,
      show_backup_technical_owner: row.show_backup_technical_owner ?? false,
      show_dispatcher: row.show_dispatcher ?? false,
      show_support_tier1: row.show_support_tier1 ?? false,
      show_support_tier2: row.show_support_tier2 ?? false,
      show_support_tier3: row.show_support_tier3 ?? false,
      created_at: row.created_at,
      created_by: row.created_by,
      modified_at: row.modified_at,
      modified_by: row.modified_by
    }))
    
    const totalItems = parseInt(countResult.rows[0].total)
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    
    // Log success
    await createAndPublishEvent({
      eventName: EVENTS_ADMIN_SERVICES['service.fetch.success'].eventName,
      req: req,
      payload: {
        totalServices: services.length,
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage,
        searchQuery: searchQuery || null,
        sortBy: sortBy,
        sortDesc,
        timestamp: new Date().toISOString()
      }
    })
    
    return {
      services,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage
    }
  } catch (error) {
    await createAndPublishEvent({
      eventName: EVENTS_ADMIN_SERVICES['service.fetch.data_error'].eventName,
      req: req,
      payload: {
        error: error instanceof Error ? error.message : 'Unknown database error',
        params,
        timestamp: new Date().toISOString()
      }
    })
    throw error
  } finally {
    client.release()
  }
} 