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
import { createAndPublishEvent } from '../../../../core/eventBus/fabric.events'
import type { Service, ApiResponse } from '../types.admin.service'
import { pool } from '../../../../core/db/maindb'
import { fetchGroupnameByUuid } from '../../../../core/helpers/get.groupname.by.uuid'
import { fetchUsernameByUuid } from '../../../../core/helpers/get.username.by.uuid'

// Response interface for single service fetch
export interface FetchSingleServiceResponse extends ApiResponse {
  data?: Service
}

/**
 * Service class for fetching single service data
 */
export class ServiceAdminFetchSingleService {

  /**
   * Fetches single service data by ID
   * @param serviceId - The UUID of the service to fetch
   * @param req - Express request object for event context
   * @returns Promise with service data or error
   */
  async fetchSingleService(serviceId: string, req?: any): Promise<FetchSingleServiceResponse> {
    console.log('[FetchSingleService] Starting fetchSingleService for serviceId:', serviceId)
    const client = await pool.connect()
    
    try {
      // Validate service ID format (basic UUID check)
      if (!serviceId || typeof serviceId !== 'string' || serviceId.trim().length === 0) {
        // Temporarily comment out events to debug
        // await createAndPublishEvent({
        //   req,
        //   eventName: 'admin.service.fetch.validation.error',
        //   payload: { serviceId },
        //   errorData: 'Invalid service ID provided'
        // })
        return {
          success: false,
          message: 'Invalid service ID format'
        }
      }

      // Check if service exists
      const serviceExistsResult = await client.query(queries.checkServiceExists, [serviceId])
      
      if (serviceExistsResult.rows.length === 0) {
        // Temporarily comment out events to debug
        // await createAndPublishEvent({
        //   req,
        //   eventName: 'admin.service.fetch.not_found',
        //   payload: { serviceId }
        // })
        return {
          success: false,
          message: 'Service not found'
        }
      }

      // Fetch service with all roles
      console.log('[FetchSingleService] Executing fetchServiceWithRoles query for serviceId:', serviceId)
      const serviceResult = await client.query(queries.fetchServiceWithRoles, [serviceId])
      
      console.log('[FetchSingleService] Query result rows count:', serviceResult.rows.length)
      
      if (serviceResult.rows.length === 0) {
        console.log('[FetchSingleService] No service data found')
        // Temporarily comment out events to debug
        // await createAndPublishEvent({
        //   req,
        //   eventName: 'admin.service.fetch.data_error',
        //   payload: { serviceId },
        //   errorData: 'Service data not found after existence check'
        // })
        return {
          success: false,
          message: 'Service data not found'
        }
      }

      const serviceRow = serviceResult.rows[0]
      console.log('[FetchSingleService] Service row data:', serviceRow)

      // Log the raw service data from database
      console.log('[FetchSingleService] Raw service data from database:', {
        id: serviceRow.id,
        name: serviceRow.name,
        icon_name: serviceRow.icon_name,
        description_short: serviceRow.description_short,
        description_long: serviceRow.description_long,
        purpose: serviceRow.purpose,
        comments: serviceRow.comments,
        priority: serviceRow.priority,
        status: serviceRow.status
      })

      // Fetch access control groups and users using helpers
      const accessGroupsResult = await client.query(`
        SELECT group_id, role_type 
        FROM app.service_groups 
        WHERE service_id = $1 AND role_type IN ('access_allowed', 'access_denied')
        ORDER BY role_type, group_id
      `, [serviceId])
      
      const accessUsersResult = await client.query(`
        SELECT user_id, role_type 
        FROM app.service_users 
        WHERE service_id = $1 AND role_type = 'access_denied'
        ORDER BY user_id
      `, [serviceId])

      // Log access control query results
      console.log('[FetchSingleService] Access groups result:', accessGroupsResult.rows)
      console.log('[FetchSingleService] Access users result:', accessUsersResult.rows)

      // Process access control data using helpers
      const accessAllowedGroups: string[] = []
      const accessDeniedGroups: string[] = []
      const accessDeniedUsers: string[] = []

      // Process groups using helper
      for (const row of accessGroupsResult.rows) {
        const groupName = await fetchGroupnameByUuid(row.group_id)
        if (groupName) {
          if (row.role_type === 'access_allowed') {
            accessAllowedGroups.push(groupName)
          } else if (row.role_type === 'access_denied') {
            accessDeniedGroups.push(groupName)
          }
        }
      }

      // Process users using helper
      for (const row of accessUsersResult.rows) {
        const username = await fetchUsernameByUuid(row.user_id)
        if (username) {
          accessDeniedUsers.push(username)
        }
      }

      // Log processed access control data
      console.log('[FetchSingleService] Processed access data:', {
        accessAllowedGroups,
        accessDeniedGroups,
        accessDeniedUsers
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

      // Log the final service object
      console.log('[FetchSingleService] Final service object:', {
        id: service.id,
        name: service.name,
        icon_name: service.icon_name,
        description_short: service.description_short,
        description_long: service.description_long,
        purpose: service.purpose,
        comments: service.comments,
        priority: service.priority,
        status: service.status,
        access_allowed_groups: service.access_allowed_groups,
        access_denied_groups: service.access_denied_groups,
        access_denied_users: service.access_denied_users
      })

      // Log the raw service object for debugging
      console.log('[FetchSingleService] Raw service object for API response:', JSON.stringify(service, null, 2))

      // Temporarily comment out event publishing to debug the issue
      // await createAndPublishEvent({
      //   req,
      //   eventName: 'admin.service.fetch.success',
      //   payload: { 
      //     serviceId, 
      //     serviceName: service.name,
      //     serviceOwner: service.owner,
      //     serviceStatus: service.status
      //   }
      // })
      
      return {
        success: true,
        message: 'Service data fetched successfully',
        data: service
      }

    } catch (error) {
      console.error('[FetchSingleService] Error fetching service:', error)
      console.error('[FetchSingleService] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      
      // Temporarily comment out events to debug
      // await createAndPublishEvent({
      //   req,
      //   eventName: 'admin.service.fetch.error',
      //   payload: { serviceId },
      //   errorData: error instanceof Error ? error.message : String(error)
      // })
      
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