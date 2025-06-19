/**
 * @file connection.handler.ts
 * @version 1.0.01
 * @description Backend file. Provides a universal handler for Express controllers in the ev2 backend application.
 * The handler standardizes HTTP connection and error handling for all controllers. It accepts a business logic function (async),
 * executes it, and sends a standard response or error. The business logic itself remains in the controller or service files.
 * This file does not contain any business logic or event bus integration.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Universal handler for Express controllers.
 * Accepts business logic, handles errors, and sends a standard response.
 *
 * @param controllerLogic - async function implementing business logic (req, res) => any
 * @returns Express middleware
 */
export function connectionHandler<T = any>(
  controllerLogic: (req: Request, res: Response) => Promise<T>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await controllerLogic(req, res);
      // If the controller already sent a response, do not send again
      if (!res.headersSent) {
        res.status(200).json(result);
      }
    } catch (error: any) {
      if (!res.headersSent) {
        res.status(500).json({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while processing your request',
          // In development, include error details for debugging
          details: process.env.NODE_ENV === 'development' ? (error?.message || String(error)) : undefined
        });
      }
    }
  };
} 