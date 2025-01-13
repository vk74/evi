/**
 * controller.create.user.ts
 * Controller for handling user creation requests from admin panel.
 * Processes requests, handles errors, and formats responses.
 */

import { Request, Response } from 'express';
import { createUser } from './service.create.user';
import type { 
  CreateUserRequest, 
  ServiceError, 
  ValidationError,
  UniqueCheckError,
  RequiredFieldError 
} from './types.user.editor';

function logRequest(message: string, meta?: object): void {
  console.log(`[${new Date().toISOString()}] [CreateUser] ${message}`, meta || '');
}

function logError(message: string, error: unknown, meta?: object): void {
  console.error(
    `[${new Date().toISOString()}] [CreateUser] ${message}`,
    { error, ...meta }
  );
}

async function createUserController(req: Request, res: Response): Promise<void> {
  const userData: CreateUserRequest = req.body;

  try {
    logRequest('Received request to create new user', {
      username: userData.username,
      email: userData.email
    });

    const result = await createUser(userData);

    logRequest('Successfully created user', {
      userId: result.userId,
      username: result.username
    });

    res.status(201).json(result);

  } catch (err) {
    const error = err as ServiceError;
    
    logError('Failed to create user', error, {
      username: userData.username,
      errorCode: error.code
    });

    // Handle specific error types
    switch (error.code) {
      case 'REQUIRED_FIELD_ERROR': {
        const fieldError = error as RequiredFieldError;
        res.status(400).json({
          success: false,
          message: error.message,
          field: fieldError.field
        });
        break;
      }
      case 'VALIDATION_ERROR': {
        const validationError = error as ValidationError;
        res.status(400).json({
          success: false,
          message: error.message,
          field: validationError.field
        });
        break;
      }
      case 'UNIQUE_CONSTRAINT_ERROR': {
        const uniqueError = error as UniqueCheckError;
        res.status(400).json({
          success: false,
          message: error.message,
          field: uniqueError.field
        });
        break;
      }
      default:
        // Handle unexpected errors
        res.status(500).json({
          success: false,
          message: 'Internal server error occurred while creating user',
          details: process.env.NODE_ENV === 'development' ? 
            error.message : undefined
        });
    }
  }
}

module.exports = createUserController;