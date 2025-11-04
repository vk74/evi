/**
 * controller.update.user.country.ts - backend file
 * version: 1.0.0
 * Backend controller for updating current user's country location using connection handler.
 * File type: backend controller (Account module)
 */

import { Request, Response } from 'express'
import updateUserCountryService from './service.update.user.country'
import { connectionHandler } from '../../core/helpers/connection.handler'

async function updateUserCountryLogic(req: Request, res: Response) {
  // Delegate to service; service performs validation and update
  return await updateUserCountryService(req, res)
}

export default connectionHandler(updateUserCountryLogic, 'UpdateUserCountryController')

