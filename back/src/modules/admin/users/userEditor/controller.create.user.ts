/**
 * controller.create.user.ts - version 1.0.04
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
import { connectionHandler } from '../../../../core/helpers/connection.handler';

async function createUserLogic(req: Request, res: Response): Promise<any> {
  const userData: CreateUserRequest = req.body;

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

  return result;
}

// Export controller using universal connection handler
export default connectionHandler(createUserLogic);