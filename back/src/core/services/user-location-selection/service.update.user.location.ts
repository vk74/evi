/**
 * service.update.user.location.ts - version 1.0.0
 * BACKEND service for updating user location
 * 
 * Updates user location information in the database.
 * Validates location value against app.regions table.
 * File: service.update.user.location.ts (backend)
 */

import { Request, Response } from 'express';
import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '@/core/db/maindb';
import { userLocationSelectionQueries } from './queries.user.location.selection';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { USER_LOCATION_SELECTION_EVENTS } from './events.user.location.selection';
import { UpdateUserLocationRequest, UserLocationData } from './types.user.location.selection';

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
      eventName: USER_LOCATION_SELECTION_EVENTS.UPDATE_LOCATION_ERROR.eventName,
      req: req,
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

  const { location } = req.body as UpdateUserLocationRequest;

  try {
    // Validate location value if provided
    if (location !== undefined && location !== null && location !== '') {
      // Check if region exists in app.regions table
      const regionCheckResult: QueryResult<{ region_name: string }> = await pool.query(
        userLocationSelectionQueries.checkRegionExists,
        [location]
      );

      if (regionCheckResult.rows.length === 0) {
        await createAndPublishEvent({
          eventName: USER_LOCATION_SELECTION_EVENTS.UPDATE_LOCATION_ERROR.eventName,
          req: req,
          payload: {
            username,
            location,
            error: `Invalid location value: ${location}. Region does not exist in app.regions table`
          },
          errorData: `Invalid location value: ${location}`
        });
        res.status(400).json({
          message: `Invalid location value. Region '${location}' does not exist.`
        });
        return;
      }
    }

    // Execute update query
    const result: QueryResult<UserLocationData> = await pool.query(
      userLocationSelectionQueries.updateUserLocation,
      [location || null, username]
    );

    if (result.rows.length > 0) {
      await createAndPublishEvent({
        eventName: USER_LOCATION_SELECTION_EVENTS.UPDATE_LOCATION_SUCCESS.eventName,
        req: req,
        payload: {
          username,
          location: result.rows[0].location
        }
      });
      res.json(result.rows[0]);
    } else {
      await createAndPublishEvent({
        eventName: USER_LOCATION_SELECTION_EVENTS.UPDATE_LOCATION_ERROR.eventName,
        req: req,
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
      eventName: USER_LOCATION_SELECTION_EVENTS.UPDATE_LOCATION_ERROR.eventName,
      req: req,
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

