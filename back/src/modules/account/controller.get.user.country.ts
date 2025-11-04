/**
 * controller.get.user.country.ts - backend file
 * version: 1.0.0
 * Backend controller for fetching current user's country location using connection handler.
 * File type: backend controller (Account module)
 */

import { Request, Response } from 'express'
import getUserCountryService from './service.get.user.country'
import { connectionHandler } from '../../core/helpers/connection.handler'

async function getUserCountryLogic(req: Request, res: Response) {
  return await getUserCountryService(req, res)
}

export default connectionHandler(getUserCountryLogic, 'GetUserCountryController')

