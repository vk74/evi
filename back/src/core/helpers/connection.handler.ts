/**
 * @file connection.handler.ts
 * @version 1.0.03
 * @description Backend file. Provides a universal handler for Express controllers in the ev2 backend application.
 * The handler standardizes HTTP connection and error handling for all controllers. It accepts a business logic function (async),
 * executes it, and sends a standard response or error. The business logic itself remains in the controller or service files.
 * This file includes comprehensive event logging for monitoring and debugging purposes.
 */

import { Request, Response, NextFunction } from 'express';
import fabricEvents from '../eventBus/fabric.events';
import { CONNECTION_HANDLER_EVENTS } from './events.connection.handler';

// Define error code type
type ErrorCode = 'INVALID_REQUEST' | 'REQUIRED_FIELD_ERROR' | 'VALIDATION_ERROR' | 
                'NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'CONFLICT' | 
                'INTERNAL_SERVER_ERROR';

// Error status code mapping
const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
  'INVALID_REQUEST': 400,
  'REQUIRED_FIELD_ERROR': 400,
  'VALIDATION_ERROR': 400,
  'NOT_FOUND': 404,
  'UNAUTHORIZED': 401,
  'FORBIDDEN': 403,
  'CONFLICT': 409,
  'INTERNAL_SERVER_ERROR': 500
};

/**
 * Universal handler for Express controllers.
 * Accepts business logic, handles errors, and sends a standard response.
 * Includes comprehensive event logging for monitoring and debugging.
 *
 * @param controllerLogic - async function implementing business logic (req, res) => any
 * @param controllerName - optional name for identifying the controller in logs
 * @returns Express middleware
 */
export function connectionHandler<T = any>(
  controllerLogic: (req: Request, res: Response) => Promise<T>,
  controllerName?: string
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || `req-${Date.now()}`;
    const controller = controllerName || 'unknown';
    
    try {
      // Log request received
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: CONNECTION_HANDLER_EVENTS.REQUEST_RECEIVED.eventName,
        payload: {
          method: req.method,
          url: req.url,
          controllerName: controller,
          requestId
        }
      });

      // Log business logic start
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: CONNECTION_HANDLER_EVENTS.BUSINESS_LOGIC_START.eventName,
        payload: {
          controllerName: controller,
          requestId
        }
      });

      const result = await controllerLogic(req, res);
      
      const duration = Date.now() - startTime;
      const responseSize = JSON.stringify(result).length;

      // Log business logic complete
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: CONNECTION_HANDLER_EVENTS.BUSINESS_LOGIC_COMPLETE.eventName,
        payload: {
          controllerName: controller,
          responseSize,
          duration
        }
      });

      // If the controller already sent a response, do not send again
      if (!res.headersSent) {
        res.status(200).json(result);
      }

      // Log response sent
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: CONNECTION_HANDLER_EVENTS.RESPONSE_SENT.eventName,
        payload: {
          statusCode: 200,
          responseSize,
          duration
        }
      });

    } catch (error: any) {
      const duration = Date.now() - startTime;
      const errorCode = (error.code || 'INTERNAL_SERVER_ERROR') as ErrorCode;
      const statusCode = ERROR_STATUS_CODES[errorCode] || 500;

      // Log business logic error
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: CONNECTION_HANDLER_EVENTS.BUSINESS_LOGIC_ERROR.eventName,
        payload: {
          controllerName: controller,
          errorCode,
          errorType: error.constructor.name,
          duration
        },
        errorData: error.message || String(error)
      });

      if (!res.headersSent) {
        // Use structured error response if available, otherwise create one
        const errorResponse = error.code ? {
          code: error.code,
          message: error.message || 'An error occurred',
          details: error.details || (process.env.NODE_ENV === 'development' ? String(error) : undefined)
        } : {
          code: errorCode,
          message: 'An error occurred while processing your request',
          details: process.env.NODE_ENV === 'development' ? String(error) : undefined
        };

        res.status(statusCode).json(errorResponse);

        // Log error response sent
        await fabricEvents.createAndPublishEvent({
          req,
          eventName: CONNECTION_HANDLER_EVENTS.ERROR_RESPONSE_SENT.eventName,
          payload: {
            statusCode,
            errorCode,
            errorType: error.constructor.name,
            duration
          },
          errorData: error.message || String(error)
        });
      }
    }
  };
} 