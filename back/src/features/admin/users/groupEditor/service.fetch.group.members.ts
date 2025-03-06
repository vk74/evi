/**
 * service.fetch.group.members.ts
 * BACKEND service for fetching members of a specific group.
 * 
 * Functionality:
 * - Validates input parameters
 * - Fetches group members from the database
 * - Handles data transformation and business logic
 * - Manages error handling
 * - Provides logging for operations
 */

import { Pool, QueryResult } from 'pg';
import { queries } from './queries.group.editor';
import { 
  FetchGroupMembersRequest, 
  FetchGroupMembersResponse,
  GroupMember,
  ValidationError,
  ServiceError
} from './types.group.editor';
import { pool as pgPool } from '../../../../db/maindb';

// Type assertion for pool
const pool = pgPool as Pool;

// Logging helper
function logService(message: string, meta?: object): void {
  console.log(`[${new Date().toISOString()}] [FetchGroupMembersService] ${message}`, meta || '');
}

/**
 * Service function to fetch members of a group
 * @param request FetchGroupMembersRequest containing the group ID
 * @returns FetchGroupMembersResponse with members data or error information
 */
export async function fetchGroupMembers(request: FetchGroupMembersRequest): Promise<FetchGroupMembersResponse> {
  const { groupId } = request;

  try {
    // Input validation
    if (!groupId) {
      // Создаем ошибку валидации
      const validationError: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'Group ID is required',
        field: 'groupId'
      };
      throw validationError;
    }

    // Log operation start
    logService('Fetching group members from database', { groupId });

    // Perform query to get group members with parameterized values to prevent SQL injection
    const result: QueryResult = await pool.query(queries.getGroupMembers.text, [groupId]);
    
    logService('Raw database query results obtained', { 
      rowCount: result.rowCount,
      groupId 
    });

    // Transform query results to maintain both GroupMember interface compatibility
    // and include all fields needed by the frontend
    const members = result.rows.map(row => {
      // Create display name from first_name, middle_name, last_name for GroupMember interface
      const name = [row.first_name, row.middle_name, row.last_name]
          .filter(Boolean)
          .join(' ');
      
      // Create a member object with all required fields
      return {
        // Fields required by GroupMember interface
        user_id: row.user_id,
        username: row.username,
        name: name,
        email: row.email,
        role: row.is_staff ? 'staff' : 'user',
        
        // Additional fields needed by the frontend
        member_id: row.member_id,
        group_id: row.group_id,
        joined_at: row.joined_at,
        added_by: row.added_by,
        is_active: row.is_active,
        left_at: row.left_at,
        removed_by: row.removed_by,
        is_staff: row.is_staff,
        account_status: row.account_status,
        first_name: row.first_name,
        middle_name: row.middle_name,
        last_name: row.last_name
      };
    });

    // Log successful fetch
    logService('Successfully retrieved group members', {
      groupId,
      totalMembers: members.length,
    });

    // Return formatted response
    return {
      success: true,
      message: members.length > 0 ? 'Group members fetched successfully' : 'Group has no members',
      data: {
        members, // TypeScript допускает присвоение более широкого типа к более узкому при возврате данных
        total: members.length,
      },
    };
  } catch (error) {
    // Log error
    logService('Error in fetchGroupMembers service', { groupId, error });

    // Если ошибка уже в правильном формате (имеет code), просто пробрасываем дальше
    if (error && typeof error === 'object' && 'code' in error) {
      throw error;
    }

    // Иначе создаем сервисную ошибку
    const serviceError: ServiceError = {
      code: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Failed to fetch group members from database',
      details: error instanceof Error ? error.stack : 'Unknown error'
    };

    throw serviceError;
  }
}

export default fetchGroupMembers;