/**
 * 
 * to be deleted after migration of Account Profile module to new architecture
 * 
 * users.get.uuid.ts - version 1.0.0
 * BACKEND middleware for retrieving user UUID
 * 
 * Gets user UUID from database based on username provided in request
 * Adds UUID to request object for downstream middleware/handlers
 * Uses the new get.uuid.by.username helper function
 */

import { Request, Response, NextFunction } from 'express';
import { getUuidByUsername } from '../core/helpers/get.uuid.by.username';

// Interface for user info in request
interface UserInfo {
  username: string;
  uuid?: string;
  [key: string]: any;
}

// Interface for enhanced request with user info
interface EnhancedRequest extends Request {
  user?: UserInfo;
}

/**
 * Middleware to retrieve and add user UUID to request object
 * @param req Express request with user info
 * @param res Express response
 * @param next Express next function
 * @returns Promise<void>
 */
async function getUserUUID(req: EnhancedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // Проверяем наличие username из предыдущего middleware (validateJWT)
    if (!req.user || !req.user.username) {
      throw new Error('User information not found in request');
    }

    // Используем новый хелпер для получения UUID пользователя
    const uuid = await getUuidByUsername(req.user.username);
    
    if (!uuid) {
      throw new Error('User not found in database');
    }
    
    // Добавляем UUID в объект req.user
    req.user.uuid = uuid;
    console.log('User UUID middleware:', {
      username: req.user.username,
      uuid: req.user.uuid
    });
    
    next();

  } catch (error) {
    console.error('getUserUUID middleware error:', error);
    res.status(401).json({
      message: 'Error getting user UUID',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Export for CommonJS require() compatibility
module.exports = getUserUUID;
// Export for ES modules
export default getUserUUID;