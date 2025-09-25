/**
 * @file service.update.group.ts
 * Version: 1.0.0
 * Service for updating group data.
 * Frontend file that handles group data updates, error handling, and operation logging.
 *
 * Functionality:
 * - Update group data via API
 * - Handle request errors
 * - Log operations
 */
import { api } from '@/core/api/service.axios'
import type { IUpdateGroupRequest, IApiResponse } from './types.group.editor'

/**
 * Logger for service operations
 */
const logger = {
  info: (message: string, meta?: object) =>
    console.log(`[UpdateGroupService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) =>
    console.error(`[UpdateGroupService] ${message}`, error || '')
}

/**
 * Service for updating group data
 */
export const updateGroupService = {
  /**
   * Updates group data
   * @param groupData - Group data to update
   * @returns Promise<boolean> - Success status
   * @throws Error when update fails
   */
  async updateGroup(groupData: IUpdateGroupRequest): Promise<boolean> {
    logger.info('Starting group update with data:', {
      group_id: groupData.group_id,
      changed_fields: Object.keys(groupData).filter(key => key !== 'group_id')
    })

    try {
      const response = await api.post<IApiResponse>(
        '/api/admin/groups/update-group-by-groupid',
        groupData
      )

      if (!response?.data) {
        const errorMessage = 'Invalid server response'
        logger.error(errorMessage)
        throw new Error(errorMessage)
      }

      if (response.data.success) {
        logger.info('Group successfully updated', {
          group_id: groupData.group_id
        })
        return true
      } else {
        const errorMessage = response.data.message || 'Unknown error during group data update'
        logger.error(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Failed to update group', error)
        throw error
      }

      const errorMessage = 'Unexpected error during group update'
      logger.error(errorMessage, error)
      throw new Error(errorMessage)
    }
  }
}

export default updateGroupService