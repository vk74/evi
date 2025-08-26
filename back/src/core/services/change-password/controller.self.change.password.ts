/**
 * controller.self.change.password.ts - version 1.0.02
 * Controller for handling requests to change user's own password.
 * Now uses universal connection handler for standardized HTTP processing.
 */

import { Request, Response } from 'express';
import { SelfChangePasswordRequest } from './types.change.password';
import changePassword from './service.self.change.password';
import { connectionHandler } from '../../helpers/connection.handler';

/**
 * Business logic for self password change
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<any>} Promise that resolves with the result
 */
async function selfChangePasswordLogic(req: Request, res: Response): Promise<any> {
  console.log('[Self Change Password Controller] Received password change request');
  
  // Pass request to service layer
  const result = await changePassword(req.body as SelfChangePasswordRequest);
  
  return result;
}

// Export controller using universal connection handler
export default connectionHandler(selfChangePasswordLogic, 'SelfChangePasswordController');