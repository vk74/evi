import { Request, Response } from 'express';
import { updateUserById as updateUserService } from './service.update.user';
import type { UpdateUserRequest, ServiceError } from './types.user.editor';

function logRequest(message: string, meta: object): void {
  console.log(`[${new Date().toISOString()}] [UpdateUser] ${message}`, meta);
}

function logError(message: string, error: unknown, meta: object): void {
  console.error(`[${new Date().toISOString()}] [UpdateUser] ${message}`, { error, ...meta });
}

async function updateUserById(req: Request, res: Response): Promise<void> {
  const updateData = req.body as UpdateUserRequest;
  
  try {
    logRequest('Received request to update user data', {
      method: req.method,
      url: req.url,
      userId: updateData.user_id
    });

    const result = await updateUserService(updateData);
    
    logRequest('Successfully updated user data', {
      userId: updateData.user_id
    });

    res.status(200).json(result);

  } catch (err: unknown) {
    const error = err as ServiceError;
    
    logError('Error while updating user data', error, { 
      userId: updateData.user_id 
    });

    const statusCode = error.code === 'NOT_FOUND' ? 404 : 500;
    const errorResponse = {
      success: false,
      message: error.message || 'An error occurred while processing your request',
      details: process.env.NODE_ENV === 'development' ? 
        (error instanceof Error ? error.message : String(error)) : 
        undefined
    };

    res.status(statusCode).json(errorResponse);
  }
}

module.exports = updateUserById;