/**
 * @file controller.fetch.user.groups.ts
 * Version: 1.0.0
 * Backend controller for fetching groups a user belongs to. Backend file.
 */
import { Request, Response } from 'express'
import { fetchUserGroups } from './service.fetch.user.groups'
import { connectionHandler } from '../../../../core/helpers/connection.handler'

async function fetchUserGroupsLogic(req: Request, res: Response): Promise<any> {
  const userId = req.params.userId as string
  const { page = '1', itemsPerPage = '25', sortBy = '', sortDesc = 'false', search = '' } = req.query as Record<string, string>
  return await fetchUserGroups({
    userId,
    page: Number(page) || 1,
    itemsPerPage: Number(itemsPerPage) || 25,
    sortBy,
    sortDesc: sortDesc === 'true',
    search
  }, req)
}

export default connectionHandler(fetchUserGroupsLogic, 'FetchUserGroupsController')
