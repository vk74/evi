/**
 * controller.admin.change.password.ts
 * Controller for handling admin requests to reset user passwords.
 * Receives request and passes it to the service layer, then formats response.
 */

import { Request, Response } from 'express';
import { AdminResetPasswordRequest } from './types.change.password';
import resetPassword from './service.admin.change.password';

/**
 * Controller to handle admin password reset requests
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with result
 */
export async function adminResetPasswordController(req: Request, res: Response): Promise<Response> {
  console.log('[Admin Reset Password Controller] Received password reset request');
  
  try {
    // Pass request to service layer
    const result = await resetPassword(req.body as AdminResetPasswordRequest);
    
    // Return appropriate response based on service result
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('[Admin Reset Password Controller] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default adminResetPasswordController;