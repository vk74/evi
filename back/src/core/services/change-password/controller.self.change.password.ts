/**
 * controller.self.change.password.ts
 * Controller for handling requests to change user's own password.
 * Receives request and passes it to the service layer, then formats response.
 */

import { Request, Response } from 'express';
import { SelfChangePasswordRequest } from './types.change.password';
import changePassword from './service.self.change.password';

/**
 * Controller to handle self password change requests
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with result
 */
export async function selfChangePasswordController(req: Request, res: Response): Promise<Response> {
  console.log('[Self Change Password Controller] Received password change request');
  
  try {
    // Pass request to service layer
    const result = await changePassword(req.body as SelfChangePasswordRequest);
    
    // Return appropriate response based on service result
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('[Self Change Password Controller] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default selfChangePasswordController;