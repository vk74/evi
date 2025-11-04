/**
 * service.get.user.country.ts - version 1.0.0
 * BACKEND service for retrieving user country location
 * 
 * Retrieves user country information from the database
 * Validates user authentication and returns country data or appropriate error messages
 * File: service.get.user.country.ts
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

// Interface for user country data
interface UserCountryData {
  country: string | null;
  [key: string]: any;
}

/**
 * Retrieves user country location
 * @param req Express request with user info
 * @param res Express response
 * @returns Promise<void>
 */
const getUserCountry = async (req: EnhancedRequest, res: Response): Promise<void> => {
  const username = req.user?.username;

  if (!username) {
    await createAndPublishEvent({
      eventName: ACCOUNT_SERVICE_EVENTS.GET_USER_COUNTRY_MISSING_USERNAME.eventName,
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
      eventName: ACCOUNT_SERVICE_EVENTS.GET_USER_COUNTRY_RETRIEVING.eventName,
      payload: {
        username
      }
    });

    const result: QueryResult<UserCountryData> = await pool.query(
      userProfileQueries.getUserCountry.text,
      [username]
    );

    if (result.rows.length > 0) {
      await createAndPublishEvent({
        eventName: ACCOUNT_SERVICE_EVENTS.GET_USER_COUNTRY_FOUND.eventName,
        payload: {
          username,
          country: result.rows[0].country
        }
      });
      res.json(result.rows[0]);
    } else {
      await createAndPublishEvent({
        eventName: ACCOUNT_SERVICE_EVENTS.GET_USER_COUNTRY_NOT_FOUND.eventName,
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
      eventName: ACCOUNT_SERVICE_EVENTS.GET_USER_COUNTRY_ERROR.eventName,
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
export default getUserCountry;

