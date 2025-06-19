// service.update.user.ts - version 1.0.03
// Service for updating user accounts, now uses event bus for operation tracking

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../core/db/maindb';
import { queries } from './queries.user.editor';
import type { UpdateUserRequest, ApiResponse, ServiceError } from './types.user.editor';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { USER_UPDATE_EVENTS } from './events.user.editor';

const pool = pgPool as Pool;

export async function updateUserById(updateData: UpdateUserRequest, req: Request): Promise<ApiResponse> {
    const client = await pool.connect();
    
    try {
      // Get the UUID of the user making the request
      const requestorUuid = getRequestorUuidFromReq(req);
      
      // Create and publish validation passed event
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: USER_UPDATE_EVENTS.VALIDATION_PASSED.eventName,
        payload: {
          userId: updateData.user_id,
          requestorUuid,
          updatedFields: Object.keys(updateData).filter(key => key !== 'user_id')
        }
      });
      
      await client.query('BEGIN');
  
      // Подготовка параметров для обновления пользователя
      const userParams = [
        updateData.user_id,
        updateData.username,
        updateData.email,
        updateData.is_staff,
        updateData.account_status,
        updateData.first_name,
        updateData.middle_name,
        updateData.last_name
      ];
  
      // Обновление данных пользователя
      const userResult = await client.query(
        queries.updateUserById,
        userParams
      );
  
      if (userResult.rowCount === 0) {
        // Create and publish user not found event
        await fabricEvents.createAndPublishEvent({
          req,
          eventName: USER_UPDATE_EVENTS.FAILED.eventName,
          payload: {
            userId: updateData.user_id,
            error: {
              code: 'NOT_FOUND',
              message: 'User not found'
            }
          },
          errorData: 'User not found'
        });
        
        throw {
          code: 'NOT_FOUND',
          message: 'User not found'
        };
      }
  
      // Подготовка параметров для обновления профиля
      const profileParams = [
        updateData.user_id,
        updateData.mobile_phone_number,
        updateData.address,
        updateData.company_name,
        updateData.position,
        updateData.gender
      ];
  
      // Обновление профиля пользователя
      const profileResult = await client.query(
          queries.updateUserProfileById,
          profileParams
      );
      
      if (profileResult.rowCount === 0) {
        // Create and publish profile not found event
        await fabricEvents.createAndPublishEvent({
          req,
          eventName: USER_UPDATE_EVENTS.FAILED.eventName,
          payload: {
            userId: updateData.user_id,
            error: {
              code: 'NOT_FOUND',
              message: 'User profile not found'
            }
          },
          errorData: 'User profile not found'
        });
        
        throw {
          code: 'NOT_FOUND',
          message: 'User profile not found'
        } as ServiceError;
      }
  
      await client.query('COMMIT');
      
      // Create and publish successful update event
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: USER_UPDATE_EVENTS.COMPLETE.eventName,
        payload: {
          userId: updateData.user_id,
          updatedFields: Object.keys(updateData).filter(key => key !== 'user_id'),
          requestorUuid
        }
      });
  
      return {
        success: true,
        message: 'User data updated successfully'
      };
  
    } catch (err: unknown) {
      await client.query('ROLLBACK');
      
      // Приводим error к типу ServiceError
      const error = err as ServiceError;
      
      // If this is not a NOT_FOUND error that we already published, publish a FAILED event
      if (error.code !== 'NOT_FOUND') {
        await fabricEvents.createAndPublishEvent({
          req,
          eventName: USER_UPDATE_EVENTS.FAILED.eventName,
          payload: {
            userId: updateData.user_id,
            error: error.code ? error : {
              code: 'UPDATE_FAILED',
              message: error instanceof Error ? error.message : 'Failed to update user data'
            }
          },
          errorData: error instanceof Error ? error.message : String(error)
        });
      }
      
      // Безопасно обращаемся к свойствам error
      throw {
          code: error?.code || 'UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update user data',
          details: error
      } as ServiceError;
  
    } finally {
      client.release();
    }
  }

export default updateUserById;