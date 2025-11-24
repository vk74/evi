/**
 * service.update.user.location.ts - version 1.0.0
 * BACKEND service for updating user location
 * 
 * Updates user location information in the database
 * Validates user authentication and location value against app.regions setting
 * File: service.update.user.location.ts
 */

import { Request, Response } from 'express';
import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../../core/db/maindb';
import { userProfileQueries } from './queries.account';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { ACCOUNT_SERVICE_EVENTS } from './events.account';
import { getSettingValue } from '@/core/helpers/get.setting.value';

// Type assertion for pool
const pool = pgPool as Pool;

// Interface for user info in request
interface UserInfo {
  username: string;
  [key: string]: any;
}

// Interface for enhanced request
interface EnhancedRequest extends Request {
  user?: UserInfo;
}

// Interface for location update request
interface LocationUpdateRequest {
  location?: string | null;
  [key: string]: any;
}

// Interface for updated location data
interface UserLocationData {
  user_id: string;
  username: string;
  location: string | null;
  [key: string]: any;
}

/**
 * Updates user location
 * @param req Express request with location update data
 * @param res Express response
 * @returns Promise<void>
 */
const updateUserLocation = async (req: EnhancedRequest, res: Response): Promise<void> => {
  const username = req.user?.username;

  if (!username) {
    await createAndPublishEvent({
      eventName: ACCOUNT_SERVICE_EVENTS.UPDATE_USER_LOCATION_ERROR.eventName,
      payload: {
        username: null,
        location: null,
        error: 'Username is required'
      },
      errorData: 'Username is required'
    });
    res.status(400).json({
      message: 'Username is required'
    });
    return;
  }

  const { location } = req.body as LocationUpdateRequest;

  try {
    // Validate location value if provided
    if (location !== undefined && location !== null && location !== '') {
      // Get valid regions list from app.regions setting
      const validRegions = await getSettingValue<string[]>(
        'Application.RegionalSettings',
        'app.regions',
        []
      );
      
      if (!validRegions.includes(location)) {
        await createAndPublishEvent({
          eventName: ACCOUNT_SERVICE_EVENTS.UPDATE_USER_LOCATION_ERROR.eventName,
          payload: {
            username,
            location,
            error: `Invalid location value: ${location}. Must be one of: ${validRegions.join(', ')}`
          },
          errorData: `Invalid location value: ${location}`
        });
        res.status(400).json({
          message: `Invalid location value. Must be one of: ${validRegions.join(', ')}`
        });
        return;
      }
    }

    // Execute update query
    const result: QueryResult<UserLocationData> = await pool.query(
      userProfileQueries.updateUserLocation.text,
      [location || null, username]
    );

    if (result.rows.length > 0) {
      await createAndPublishEvent({
        eventName: ACCOUNT_SERVICE_EVENTS.UPDATE_USER_LOCATION_SUCCESS.eventName,
        payload: {
          username,
          location: result.rows[0].location
        }
      });
      res.json(result.rows[0]);
    } else {
      await createAndPublishEvent({
        eventName: ACCOUNT_SERVICE_EVENTS.UPDATE_USER_LOCATION_ERROR.eventName,
        payload: {
          username,
          location,
          error: 'User not found'
        },
        errorData: 'User not found'
      });
      res.status(404).json({
        message: 'User not found'
      });
    }

  } catch (error) {
    await createAndPublishEvent({
      eventName: ACCOUNT_SERVICE_EVENTS.UPDATE_USER_LOCATION_ERROR.eventName,
      payload: {
        username,
        location,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      errorData: error instanceof Error ? error.message : undefined
    });
    res.status(500).json({
      message: 'Failed to update location',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

// Export for ES modules only
export default updateUserLocation;

