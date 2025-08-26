/**
 * controller.admin.change.password.ts - version 1.0.02
 * Controller for handling admin requests to reset user passwords.
 * Now uses universal connection handler for standardized HTTP processing.
 */

import { Request as ExpressRequest, Response } from 'express';
import { AdminResetPasswordRequest, ChangePasswordResponse } from './types.change.password';
import resetPassword from './service.admin.change.password';
import { connectionHandler } from '../../helpers/connection.handler';

// Расширяем тип Request для включения свойства user, добавляемого middleware validateJWT
interface Request extends ExpressRequest {
  user?: {
    id: string;
    username: string;
    user_id: string;
  };
}

/**
 * Business logic for admin password reset
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<ChangePasswordResponse>} Promise that resolves with the result
 */
async function adminResetPasswordLogic(req: Request, res: Response): Promise<ChangePasswordResponse> {
  console.log('[Admin Reset Password Controller] Received password reset request');
  
  // Детальное логирование входящего запроса
  console.log('[Admin Reset Password Controller] Request body:', JSON.stringify({
    uuid: req.body?.uuid || 'undefined',
    username: req.body?.username || 'undefined',
    // Скрываем пароль в логах
    newPassword: req.body?.newPassword ? '****' : 'undefined'
  }, null, 2));
  
  // Логирование заголовков
  console.log('[Admin Reset Password Controller] Request headers:', {
    'content-type': req.headers['content-type'],
    'content-length': req.headers['content-length'],
    'x-requested-with': req.headers['x-requested-with']
  });
  
  // Логирование информации о пользователе, делающем запрос
  console.log('[Admin Reset Password Controller] User performing action:', 
    req.user ? `${req.user.username} (${req.user.user_id})` : 'Unknown user');
  
  // Проверка наличия данных в запросе
  if (!req.body || !req.body.uuid || !req.body.username || !req.body.newPassword) {
    console.error('[Admin Reset Password Controller] Invalid request data:', {
      hasBody: !!req.body,
      hasUuid: req.body?.uuid ? true : false,
      hasUsername: req.body?.username ? true : false,
      hasNewPassword: req.body?.newPassword ? true : false
    });
    
    throw new Error('Missing required fields in request');
  }
  
  // Извлекаем данные из запроса
  const resetRequest: AdminResetPasswordRequest = {
    uuid: req.body.uuid,
    username: req.body.username,
    newPassword: req.body.newPassword
  };
  
  console.log('[Admin Reset Password Controller] Extracted data:', {
    uuid: resetRequest.uuid,
    username: resetRequest.username,
    passwordProvided: !!resetRequest.newPassword
  });
  
  // Передаем данные в сервисный слой
  const result: ChangePasswordResponse = await resetPassword(resetRequest);
  
  console.log('[Admin Reset Password Controller] Service response:', {
    success: result.success,
    message: result.message
  });
  
  return result;
}

// Export controller using universal connection handler
export default connectionHandler(adminResetPasswordLogic, 'AdminResetPasswordController');