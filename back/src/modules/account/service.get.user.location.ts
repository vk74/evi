/**
 * service.get.user.location.ts - version 1.0.0
 * BACKEND service for retrieving user location
 * 
 * Retrieves user location information from the database
 * Validates user authentication and returns location data or appropriate error messages
 * File: service.get.user.location.ts
 */

import { Request, Response } from 'express';
import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../../core/db/maindb';
import { userProfileQueries } from './queries.account';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { ACCOUNT_SERVICE_EVENTS } from './events.account';

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

// Interface for user location data
interface UserLocationData {
  location: string | null;
  [key: string]: any;
}

/**
 * Retrieves user location
 * @param req Express request with user info
 * @param res Express response
 * @returns Promise<void>
 */
const getUserLocation = async (req: EnhancedRequest, res: Response): Promise<void> => {
  const username = req.user?.username;

  if (!username) {
    await createAndPublishEvent({
      eventName: ACCOUNT_SERVICE_EVENTS.GET_USER_LOCATION_MISSING_USERNAME.eventName,
      payload: {
        requestInfo: {
          method: req.method,
          url: req.url,
          userAgent: req.get('User-Agent')
        }
      }
    });
    res.status(400).json({
      message: 'Username is required'
    });
    return;
  }

  try {
    await createAndPublishEvent({
      eventName: ACCOUNT_SERVICE_EVENTS.GET_USER_LOCATION_RETRIEVING.eventName,
      payload: {
        username
      }
    });

    const result: QueryResult<UserLocationData> = await pool.query(
      userProfileQueries.getUserLocation.text,
      [username]
    );

    if (result.rows.length > 0) {
      await createAndPublishEvent({
        eventName: ACCOUNT_SERVICE_EVENTS.GET_USER_LOCATION_FOUND.eventName,
        payload: {
          username,
          location: result.rows[0].location
        }
      });
      res.json(result.rows[0]);
    } else {
      await createAndPublishEvent({
        eventName: ACCOUNT_SERVICE_EVENTS.GET_USER_LOCATION_NOT_FOUND.eventName,
        payload: {
          username
        }
      });
      res.status(404).json({
        message: 'User not found'
      });
    }

  } catch (error) {
    await createAndPublishEvent({
      eventName: ACCOUNT_SERVICE_EVENTS.GET_USER_LOCATION_ERROR.eventName,
      payload: {
        username,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      errorData: error instanceof Error ? error.message : undefined
    });
    res.status(500).json({
      message: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

// Export for ES modules only
export default getUserLocation;

