/**
 * controller.get.user.location.ts - backend file
 * version: 1.0.0
 * Backend controller for fetching current user's location using connection handler.
 * File type: backend controller (Account module)
 */

import { Request, Response } from 'express'
import getUserLocationService from './service.get.user.location'
import { connectionHandler } from '../../core/helpers/connection.handler'

async function getUserLocationLogic(req: Request, res: Response) {
  return await getUserLocationService(req, res)
}

export default connectionHandler(getUserLocationLogic, 'GetUserLocationController')

