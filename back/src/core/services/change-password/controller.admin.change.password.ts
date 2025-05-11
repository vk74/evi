/**
 * controller.admin.change.password.ts - version 1.0.01
 * Controller for handling admin requests to reset user passwords.
 * Receives request and passes it to the service layer, then formats response.
 */

import { Request as ExpressRequest, Response } from 'express';
import { AdminResetPasswordRequest, ChangePasswordResponse } from './types.change.password';
import resetPassword from './service.admin.change.password';

// Расширяем тип Request для включения свойства user, добавляемого middleware validateJWT
interface Request extends ExpressRequest {
  user?: {
    id: string;
    username: string;
    user_id: string;
  };
}

/**
 * Controller to handle admin password reset requests
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>} Promise that resolves when response is sent
 */
export async function adminResetPasswordController(req: Request, res: Response): Promise<void> {
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
  
  try {
    // Проверка наличия данных в запросе
    if (!req.body || !req.body.uuid || !req.body.username || !req.body.newPassword) {
      console.error('[Admin Reset Password Controller] Invalid request data:', {
        hasBody: !!req.body,
        hasUuid: req.body?.uuid ? true : false,
        hasUsername: req.body?.username ? true : false,
        hasNewPassword: req.body?.newPassword ? true : false
      });
      
      res.status(400).json({
        success: false,
        message: 'Missing required fields in request',
        error: 'Request validation failed'
      });
      return;
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
    
    // Возвращаем ответ клиенту
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('[Admin Reset Password Controller] Unexpected error:', error);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default adminResetPasswordController;