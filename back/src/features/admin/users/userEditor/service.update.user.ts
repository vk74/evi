// service.update.user.ts - version 1.0.02
// Service for updating user accounts, now accepts request object

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../db/maindb';
import { queries } from './queries.user.editor';
import type { UpdateUserRequest, ApiResponse, ServiceError } from './types.user.editor';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';

const pool = pgPool as Pool;

function logService(message: string, meta?: object): void {
  console.log(`[${new Date().toISOString()}] [UpdateUserService] ${message}`, meta || '');
}

export async function updateUserById(updateData: UpdateUserRequest, req: Request): Promise<ApiResponse> {
    const client = await pool.connect();
    
    try {
      // Get the UUID of the user making the request
      const requestorUuid = getRequestorUuidFromReq(req);
      await client.query('BEGIN');
      logService('Starting user update transaction', { 
        userId: updateData.user_id, 
        requestorUuid
      });
  
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
          throw {
          code: 'NOT_FOUND',
          message: 'User profile not found'
          } as ServiceError;
      }
  
      await client.query('COMMIT');
      logService('Successfully updated user data', { 
        userId: updateData.user_id,
        requestorUuid
      });
  
      return {
        success: true,
        message: 'User data updated successfully'
      };
  
    } catch (err: unknown) {
      await client.query('ROLLBACK');
      
      // Приводим error к типу ServiceError
      const error = err as ServiceError;
      logService('Error updating user data', { userId: updateData.user_id, error });
      
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