/**
 * service.update.user.country.ts - version 1.0.0
 * BACKEND service for updating user country location
 * 
 * Updates user country information in the database
 * Validates user authentication and country value against app.app_countries ENUM
 * File: service.update.user.country.ts
 */

import { Request, Response } from 'express';
import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../../core/db/maindb';
import { userProfileQueries } from './queries.account';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { ACCOUNT_SERVICE_EVENTS } from './events.account';
import { getAppCountriesList } from '@/core/helpers/get.app.countries.list';

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

// Interface for country update request
interface CountryUpdateRequest {
  country?: string | null;
  [key: string]: any;
}

// Interface for updated country data
interface UserCountryData {
  user_id: string;
  username: string;
  country: string | null;
  [key: string]: any;
}

/**
 * Updates user country location
 * @param req Express request with country update data
 * @param res Express response
 * @returns Promise<void>
 */
const updateUserCountry = async (req: EnhancedRequest, res: Response): Promise<void> => {
  const username = req.user?.username;

  if (!username) {
    await createAndPublishEvent({
      eventName: ACCOUNT_SERVICE_EVENTS.UPDATE_USER_COUNTRY_ERROR.eventName,
      payload: {
        username: null,
        country: null,
        error: 'Username is required'
      },
      errorData: 'Username is required'
    });
    res.status(400).json({
      message: 'Username is required'
    });
    return;
  }

  const { country } = req.body as CountryUpdateRequest;

  try {
    // Validate country value if provided
    if (country !== undefined && country !== null && country !== '') {
      // Get valid countries list from ENUM
      const validCountries = await getAppCountriesList();
      
      if (!validCountries.includes(country)) {
        await createAndPublishEvent({
          eventName: ACCOUNT_SERVICE_EVENTS.UPDATE_USER_COUNTRY_ERROR.eventName,
          payload: {
            username,
            country,
            error: `Invalid country value: ${country}. Must be one of: ${validCountries.join(', ')}`
          },
          errorData: `Invalid country value: ${country}`
        });
        res.status(400).json({
          message: `Invalid country value. Must be one of: ${validCountries.join(', ')}`
        });
        return;
      }
    }

    // Execute update query
    const result: QueryResult<UserCountryData> = await pool.query(
      userProfileQueries.updateUserCountry.text,
      [country || null, username]
    );

    if (result.rows.length > 0) {
      await createAndPublishEvent({
        eventName: ACCOUNT_SERVICE_EVENTS.UPDATE_USER_COUNTRY_SUCCESS.eventName,
        payload: {
          username,
          country: result.rows[0].country
        }
      });
      res.json(result.rows[0]);
    } else {
      await createAndPublishEvent({
        eventName: ACCOUNT_SERVICE_EVENTS.UPDATE_USER_COUNTRY_ERROR.eventName,
        payload: {
          username,
          country,
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
      eventName: ACCOUNT_SERVICE_EVENTS.UPDATE_USER_COUNTRY_ERROR.eventName,
      payload: {
        username,
        country,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      errorData: error instanceof Error ? error.message : undefined
    });
    res.status(500).json({
      message: 'Failed to update country',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

// Export for ES modules only
export default updateUserCountry;

