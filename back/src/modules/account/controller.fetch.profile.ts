/**
 * controller.fetch.profile.ts - backend file
 * version: 1.0.1
 * Backend controller for fetching current user's profile using connection handler.
 * File type: backend controller (Account module)
 */

import { Request, Response } from 'express'
import getUserProfileService from './service.get.profile'
import { connectionHandler } from '../../core/helpers/connection.handler'

async function fetchProfileLogic(req: Request, res: Response) {
  return await getUserProfileService(req, res)
}

export default connectionHandler(fetchProfileLogic, 'FetchUserProfileController')


