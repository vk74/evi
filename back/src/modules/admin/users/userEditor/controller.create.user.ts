/**
 * controller.create.user.ts - version 1.0.03
 * Controller for handling user creation requests from admin panel.
 * Processes requests, handles errors, and formats responses.
 * Now uses event bus for operation tracking.
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
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { USER_CREATION_CONTROLLER_EVENTS } from './events.user.editor';

async function createUserController(req: Request, res: Response): Promise<void> {
  const userData: CreateUserRequest = req.body;

  try {
    // Log HTTP request received event
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: USER_CREATION_CONTROLLER_EVENTS.HTTP_REQUEST_RECEIVED.eventName,
      payload: {
        method: req.method,
        url: req.url,
        username: userData.username,
        email: userData.email
      }
    });

    // Pass the entire req object to the service
    const result = await createUser(userData, req);

    // Log HTTP response sent event
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: USER_CREATION_CONTROLLER_EVENTS.HTTP_RESPONSE_SENT.eventName,
      payload: {
        userId: result.userId,
        username: result.username,
        statusCode: 201
      }
    });

    res.status(201).json(result);

  } catch (err) {
    const error = err as ServiceError;
    
    // Log HTTP error event
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: USER_CREATION_CONTROLLER_EVENTS.HTTP_ERROR.eventName,
      payload: {
        username: userData.username,
        errorCode: error.code || 'INTERNAL_SERVER_ERROR',
        statusCode: getStatusCodeForError(error)
      },
      errorData: error instanceof Error ? error.message : String(error)
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

/**
 * Helper function to determine HTTP status code based on error type
 */
function getStatusCodeForError(error: ServiceError): number {
  switch (error.code) {
    case 'REQUIRED_FIELD_ERROR':
    case 'VALIDATION_ERROR':
    case 'UNIQUE_CONSTRAINT_ERROR':
      return 400;
    case 'NOT_FOUND':
      return 404;
    default:
      return 500;
  }
}

// Export using ES modules syntax
export default createUserController;