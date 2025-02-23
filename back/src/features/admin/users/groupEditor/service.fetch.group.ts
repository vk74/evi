/**
 * service.fetch.group.ts
 * Service for fetching group data operations.
 * 
 * Functionality:
 * - Retrieves group data from database by ID
 * - Combines group and group details data
 * - Handles data transformation and business logic
 * - Manages database interactions and error handling
 * 
 * Data flow:
 * 1. Receive group ID
 * 2. Query database for group data (app.groups)
 * 3. Query database for group details (app.group_details)
 * 4. Combine and return formatted response
 */

import { Pool, QueryResult } from 'pg';
import { queries } from './queries.group.editor';
import { 
  FetchGroupRequest, 
  FetchGroupResponse, 
  GroupBaseData, 
  GroupDetailsData, 
  GroupData, 
  ServiceError 
} from './types.group.editor';
import { pool as pgPool } from '../../../../db/maindb'; // Импортируем пул напрямую из maindb.js

// Type assertion for pool
const pool = pgPool as Pool;

// Logging helper
function logService(message: string, meta?: object): void {
  console.log(`[${new Date().toISOString()}] [FetchGroupService] ${message}`, meta || '');
}

/**
 * Service function to fetch group data by group ID
 * @param request FetchGroupRequest containing the group ID
 * @returns FetchGroupResponse with group data or error
 */
export async function fetchGroupData(request: FetchGroupRequest): Promise<FetchGroupResponse> {
  const { groupId } = request;

  try {
    // Log operation start
    logService('Fetching group data from database', { groupId });

    // Fetch group data from app.groups
    const groupResult: QueryResult<GroupBaseData> = await pool.query(queries.getGroupById.text, [groupId]);

    if (groupResult.rows.length === 0) {
      return {
        success: false,
        message: 'Group not found in app.groups',
        data: null
      };
    }

    const groupData = groupResult.rows[0];

    // Fetch group details from app.group_details (optional, may not exist)
    const detailsResult: QueryResult<GroupDetailsData> = await pool.query(queries.getGroupDetailsById.text, [groupId]);
    const detailsData = detailsResult.rows[0] || null;

    // Combine data into GroupData
    const responseData: GroupData = {
      group: groupData,
      details: detailsData
    };

    // Log successful fetch
    logService('Successfully retrieved group data', { groupId, groupName: groupData.group_name });

    return {
      success: true,
      message: 'Group data fetched successfully',
      data: responseData
    };
  } catch (error) {
    // Log error
    logService('Error fetching group data', { groupId, error });

    const serviceError: ServiceError = {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch group data',
      details: error instanceof Error ? error.message : 'Unknown error'
    };

    return {
      success: false,
      message: serviceError.message,
      data: null
    };
  }
}

export default fetchGroupData;