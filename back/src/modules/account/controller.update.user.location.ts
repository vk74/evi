/**
 * controller.update.user.location.ts - backend file
 * version: 1.0.0
 * Backend controller for updating current user's location using connection handler.
 * File type: backend controller (Account module)
 */

import { Request, Response } from 'express'
import updateUserLocationService from './service.update.user.location'
import { connectionHandler } from '../../core/helpers/connection.handler'

async function updateUserLocationLogic(req: Request, res: Response) {
  // Delegate to service; service performs validation and update
  return await updateUserLocationService(req, res)
}

export default connectionHandler(updateUserLocationLogic, 'UpdateUserLocationController')

