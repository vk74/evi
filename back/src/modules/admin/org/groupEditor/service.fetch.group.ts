/**
 * service.fetch.group.ts - version 1.0.02
 * Service for fetching group data by group ID.
 * 
 * Functionality:
 * - Validates request parameters
 * - Fetches group data from the database
 * - Combines group and group details data
 * - Handles error cases gracefully
 * - Uses event bus for tracking operations and enhancing observability
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../core/db/maindb';
import { queries } from './queries.group.editor';
import { 
  FetchGroupRequest, 
  FetchGroupResponse, 
  GroupData, 
  NotFoundError,
  ServiceError
} from './types.group.editor';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { GROUP_FETCH_EVENTS } from './events.group.editor';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Fetches group data by group ID
 * @param request - Contains groupId to fetch
 * @param req - Express request object for context
 * @returns Promise with group data in a format ready for API response
 */
export async function fetchGroupData(request: FetchGroupRequest, req: Request): Promise<FetchGroupResponse> 
{
  const { groupId } = request;
  
  try {
    // Get the UUID of the user making the request
    const requestorUuid = getRequestorUuidFromReq(req);
    
    // Создаем событие для начала операции получения данных группы
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_FETCH_EVENTS.REQUEST_RECEIVED.eventName,
      payload: { 
        groupId, 
        requestorUuid 
      }
    });

    // Fetch group base data
    const groupResult = await pool.query<GroupData>(
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
    
    // Создаем событие для успешного получения данных группы
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_FETCH_EVENTS.COMPLETE.eventName,
      payload: { 
        groupId, 
        groupName: groupData.group_name,
        requestorUuid
      }
    });
    
    // Return formatted response
    return {
      success: true,
      message: 'Group data retrieved successfully',
      data: groupData
    };
    
  } catch (error) {
    // Обрабатываем ошибку и создаем соответствующее событие
    if ((error as NotFoundError).code === 'NOT_FOUND') {
      // Создаем событие для ошибки "не найдено"
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: GROUP_FETCH_EVENTS.FAILED.eventName,
        payload: {
          groupId,
          error: 'Group not found'
        },
        errorData: 'Group not found'
      });
      
      return {
        success: false,
        message: 'Group not found',
        data: null
      };
    }
    
    // Создаем событие для других ошибок
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_FETCH_EVENTS.FAILED.eventName,
      payload: {
        groupId,
        error: 'Error retrieving group data'
      },
      errorData: error instanceof Error ? error.message : String(error)
    });
    
    // For other errors, throw to be caught by controller
    throw {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Error retrieving group data',
      details: error instanceof Error ? error.message : String(error)
    } as ServiceError;
  }
}

export default fetchGroupData;