/**
 * service.fetch.group.ts - version 1.0.01
 * Service for fetching group data by group ID.
 * 
 * Functionality:
 * - Validates request parameters
 * - Fetches group data from the database
 * - Combines group and group details data
 * - Handles error cases gracefully
 * - Now accepts request object for access to user context
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../db/maindb';
import { queries } from './queries.group.editor';
import { 
  FetchGroupRequest, 
  FetchGroupResponse, 
  GroupBaseData, 
  GroupDetailsData, 
  NotFoundError,
  ServiceError
} from './types.group.editor';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';

// Type assertion for pool
const pool = pgPool as Pool;

// Logging helper
function logService(message: string, meta?: object): void {
  console.log(`[${new Date().toISOString()}] [FetchGroupService] ${message}`, meta || '');
}

/**
 * Fetches group data by group ID
 * @param request - Contains groupId to fetch
 * @param req - Express request object for context
 * @returns Promise with group data in a format ready for API response
 */
export async function fetchGroupData(request: FetchGroupRequest, req: Request): Promise<FetchGroupResponse> {
  const { groupId } = request;
  
  try {
    // Get the UUID of the user making the request
    const requestorUuid = getRequestorUuidFromReq(req);
    logService('Fetching group data from database', { groupId, requestorUuid });

    // Fetch group base data
    const groupResult = await pool.query<GroupBaseData>(
      queries.getGroupById.text,
      [groupId]
    );
    
    if (groupResult.rows.length === 0) {
      throw {
        code: 'NOT_FOUND',
        message: 'Group not found'
      } as NotFoundError;
    }
    
    const groupData = groupResult.rows[0];
    
    // Fetch group details data
    const detailsResult = await pool.query<GroupDetailsData>(
      queries.getGroupDetailsById.text,
      [groupId]
    );
    
    // Group details might not exist if they haven't been created yet
    const detailsData = detailsResult.rows.length > 0 
      ? detailsResult.rows[0] 
      : null;
    
    // Log successful data retrieval
    logService('Successfully retrieved group data', { 
      groupId, 
      groupName: groupData.group_name,
      requestorUuid
    });
    
    // Return formatted response
    return {
      success: true,
      message: 'Group data retrieved successfully',
      data: {
        group: groupData,
        details: detailsData
      }
    };
    
  } catch (error) {
    // Log error
    logService('Error in service while loading group data', { groupId, error });
    
    // Return formatted error response
    if ((error as NotFoundError).code === 'NOT_FOUND') {
      return {
        success: false,
        message: 'Group not found',
        data: null
      };
    }
    
    // For other errors, throw to be caught by controller
    throw {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Error retrieving group data',
      details: error instanceof Error ? error.message : String(error)
    } as ServiceError;
  }
}

export default fetchGroupData;