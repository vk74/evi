/**
 * @file get.uuid.by.group.name.ts
 * Version: 1.0.0
 * Backend helper for retrieving group UUID by its name
 * Purpose: Gets group UUID from cache or database by group name
 * Backend file - get.uuid.by.group.name.ts
 */

import { Pool, QueryResult } from 'pg'
import { pool as pgPool } from '../db/maindb'
import { createAndPublishEvent } from '../eventBus/fabric.events'
import { GET_UUID_BY_GROUP_NAME_EVENTS } from './events.helpers'
import { get, set, CacheKeys } from './cache.helpers'

// Type assertion for pool
const pool = pgPool as Pool

interface GroupUuidError {
  code: string
  message: string
  details?: any
}

/**
 * Get group UUID by group name
 * @param groupName Name of the group to find
 * @returns UUID string or null if not found
 * @throws GroupUuidError on database errors
 */
export async function getUuidByGroupName(groupName: string): Promise<string | null> {
  try {
    await createAndPublishEvent({
      eventName: GET_UUID_BY_GROUP_NAME_EVENTS.START.eventName,
      payload: { groupName }
    })

    // Try cache first
    const cacheKey = CacheKeys.forGroupUuid(groupName)
    const cachedUuid = await get<string | null>(cacheKey)
    if (cachedUuid !== undefined) {
      await createAndPublishEvent({
        eventName: GET_UUID_BY_GROUP_NAME_EVENTS.SUCCESS_CACHE.eventName,
        payload: { groupName, groupId: cachedUuid, source: 'cache' }
      })
      return cachedUuid
    }

    // Query DB
    const query = { text: 'SELECT group_id FROM app.groups WHERE group_name = $1', values: [groupName] }
    const result: QueryResult = await pool.query(query)

    if (!result.rows || result.rows.length === 0) {
      await createAndPublishEvent({
        eventName: GET_UUID_BY_GROUP_NAME_EVENTS.NOT_FOUND.eventName,
        payload: { groupName }
      })
      await set(cacheKey, null)
      return null
    }

    const groupId = result.rows[0].group_id
    await set(cacheKey, groupId)

    await createAndPublishEvent({
      eventName: GET_UUID_BY_GROUP_NAME_EVENTS.SUCCESS_DB.eventName,
      payload: { groupName, groupId, source: 'database' }
    })

    return groupId
  } catch (error) {
    await createAndPublishEvent({
      eventName: GET_UUID_BY_GROUP_NAME_EVENTS.ERROR.eventName,
      payload: { groupName, error: error instanceof Error ? error.message : String(error) },
      errorData: error instanceof Error ? error.message : String(error)
    })

    const groupUuidError: GroupUuidError = {
      code: 'DB_ERROR',
      message: error instanceof Error ? error.message : 'Failed to get group UUID',
      details: { groupName, error }
    }
    throw groupUuidError
  }
}

export default getUuidByGroupName


