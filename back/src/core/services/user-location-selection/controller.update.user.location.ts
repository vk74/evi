/**
 * controller.update.user.location.ts - version 1.0.0
 * Controller for updating user location.
 * 
 * Handles HTTP requests for location updates and delegates to service layer.
 * File: controller.update.user.location.ts (backend)
 */

import { Request, Response } from 'express';
import updateUserLocationService from './service.update.user.location';
import { connectionHandler } from '@/core/helpers/connection.handler';

/**
 * Controller for updating user location
 */
const updateUserLocationController = async (req: Request, res: Response): Promise<any> => {
  // Delegate to service; service performs validation and update
  return await updateUserLocationService(req, res);
};

export default connectionHandler(updateUserLocationController, 'UpdateUserLocationController');

