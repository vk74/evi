/**
 * controller.update.profile.ts - backend file
 * version: 1.0.0
 * Backend controller for updating current user's profile using connection handler.
 * File type: backend controller (Account module)
 */

import { Request, Response } from 'express'
import updateUserProfileService from './service.update.profile'
import { connectionHandler } from '../../core/helpers/connection.handler'

async function updateProfileLogic(req: Request, res: Response) {
  // Delegate to service; service performs validation and update
  return await updateUserProfileService(req, res)
}

export default connectionHandler(updateProfileLogic, 'UpdateUserProfileController')


