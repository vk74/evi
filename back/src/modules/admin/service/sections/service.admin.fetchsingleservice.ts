/**
 * service.admin.fetchsingleservice.ts
 * Version: 1.0.0
 * Description: Service for fetching single service data by ID
 * Purpose: Provides business logic for fetching detailed service information
 * Backend file - service.admin.fetchsingleservice.ts
 * Created: 2024-12-19
 * Last Updated: 2024-12-19
 */

import { queries } from '../queries.admin.service'
import { createAppLgr } from '../../../../core/lgr/lgr.factory'
import type { Service, ApiResponse } from '../types.admin.service'
import { pool } from '../../../../core/db/maindb'

// Response interface for single service fetch
export interface FetchSingleServiceResponse extends ApiResponse {
  data?: Service
}

/**
 * Service class for fetching single service data
 */
export class ServiceAdminFetchSingleService {
  private logger = createAppLgr({ 
    module: 'admin', 
    component: 'service', 
    operation: 'fetchSingleService' 
  })

  /**
   * Fetches single service data by ID
   * @param serviceId - The UUID of the service to fetch
   * @returns Promise with service data or error
   */
  async fetchSingleService(serviceId: string): Promise<FetchSingleServiceResponse> {
    const client = await pool.connect()
    
    try {
      // Validate service ID format (basic UUID check)
      if (!serviceId || typeof serviceId !== 'string' || serviceId.trim().length === 0) {
        this.logger.error({
          code: 'ADMIN:SERVICE:FETCH_SINGLE:VALIDATION_ERROR:001',
          message: 'Invalid service ID provided',
          details: { serviceId }
        })
        return {
          success: false,
          message: 'Invalid service ID format'
        }
      }

      // Check if service exists
      const serviceExistsResult = await client.query(queries.checkServiceExists, [serviceId])
      
      if (serviceExistsResult.rows.length === 0) {
        this.logger.warn({
          code: 'ADMIN:SERVICE:FETCH_SINGLE:NOT_FOUND:002',
          message: 'Service not found',
          details: { serviceId }
        })
        return {
          success: false,
          message: 'Service not found'
        }
      }

      // Fetch service with all roles
      const serviceResult = await client.query(queries.fetchServiceWithRoles, [serviceId])
      
      if (serviceResult.rows.length === 0) {
        this.logger.error({
          code: 'ADMIN:SERVICE:FETCH_SINGLE:DATA_ERROR:003',
          message: 'Service data not found after existence check',
          details: { serviceId }
        })
        return {
          success: false,
          message: 'Service data not found'
        }
      }

      const serviceRow = serviceResult.rows[0]

      // Fetch access control groups
      const accessGroupsResult = await client.query(queries.fetchServiceAccessGroups, [serviceId])
      
      // Fetch access denied users
      const accessUsersResult = await client.query(queries.fetchServiceAccessUsers, [serviceId])

      // Process access control data
      const accessAllowedGroups: string[] = []
      const accessDeniedGroups: string[] = []
      const accessDeniedUsers: string[] = []

      accessGroupsResult.rows.forEach((row: any) => {
        if (row.role_type === 'access_allowed') {
          accessAllowedGroups.push(row.name)
        } else if (row.role_type === 'access_denied') {
          accessDeniedGroups.push(row.name)
        }
      })

      accessUsersResult.rows.forEach((row: any) => {
        if (row.role_type === 'access_denied') {
          accessDeniedUsers.push(row.username)
        }
      })

      // Build service object
      const service: Service = {
        id: serviceRow.id,
        name: serviceRow.name,
        icon_name: serviceRow.icon_name,
        support_tier1: serviceRow.support_tier1,
        support_tier2: serviceRow.support_tier2,
        support_tier3: serviceRow.support_tier3,
        owner: serviceRow.owner,
        backup_owner: serviceRow.backup_owner,
        technical_owner: serviceRow.technical_owner,
        backup_technical_owner: serviceRow.backup_technical_owner,
        dispatcher: serviceRow.dispatcher,
        priority: serviceRow.priority,
        status: serviceRow.status,
        description_short: serviceRow.description_short,
        description_long: serviceRow.description_long,
        purpose: serviceRow.purpose,
        comments: serviceRow.comments,
        is_public: serviceRow.is_public,
        access_allowed_groups: accessAllowedGroups.length > 0 ? accessAllowedGroups.join(',') : null,
        access_denied_groups: accessDeniedGroups.length > 0 ? accessDeniedGroups.join(',') : null,
        access_denied_users: accessDeniedUsers.length > 0 ? accessDeniedUsers.join(',') : null,
        created_at: serviceRow.created_at,
        created_by: serviceRow.created_by,
        modified_at: serviceRow.modified_at,
        modified_by: serviceRow.modified_by
      }

      this.logger.info({
        code: 'ADMIN:SERVICE:FETCH_SINGLE:SUCCESS:004',
        message: 'Service data fetched successfully',
        details: { serviceId, serviceName: service.name }
      })
      
      return {
        success: true,
        message: 'Service data fetched successfully',
        data: service
      }

    } catch (error) {
      this.logger.error({
        code: 'ADMIN:SERVICE:FETCH_SINGLE:ERROR:005',
        message: 'Error fetching single service',
        details: { serviceId, error: error instanceof Error ? error.message : String(error) }
      })
      
      return {
        success: false,
        message: 'Internal server error while fetching service data'
      }
    } finally {
      client.release()
    }
  }
}

// Export singleton instance
export const serviceAdminFetchSingleService = new ServiceAdminFetchSingleService() 