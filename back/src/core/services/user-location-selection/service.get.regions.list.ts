/**
 * service.get.regions.list.ts - version 1.0.0
 * BACKEND service for fetching regions list from app.regions table
 * 
 * Retrieves all available regions from the database.
 * File: service.get.regions.list.ts (backend)
 */

import { Request } from 'express';
import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '@/core/db/maindb';
import { userLocationSelectionQueries } from './queries.user.location.selection';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { USER_LOCATION_SELECTION_EVENTS } from './events.user.location.selection';
import { RegionsListResponse } from './types.user.location.selection';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Fetches all regions from app.regions table
 * @param req Express request object for event context
 * @returns Promise with regions list response
 */
export async function getRegionsList(req?: Request): Promise<RegionsListResponse> {
  try {
    await createAndPublishEvent({
      eventName: USER_LOCATION_SELECTION_EVENTS.FETCH_REGIONS_STARTED.eventName,
      req: req,
      payload: {
        timestamp: new Date().toISOString()
      }
    });

    const result: QueryResult<{ region_name: string }> = await pool.query(
      userLocationSelectionQueries.fetchAllRegions
    );

    const regions = result.rows.map(row => row.region_name);

    await createAndPublishEvent({
      eventName: USER_LOCATION_SELECTION_EVENTS.FETCH_REGIONS_SUCCESS.eventName,
      req: req,
      payload: {
        totalRegions: regions.length,
        timestamp: new Date().toISOString()
      }
    });

    return {
      success: true,
      message: 'Regions fetched successfully',
      data: {
        regions
      }
    };
  } catch (error) {
    await createAndPublishEvent({
      eventName: USER_LOCATION_SELECTION_EVENTS.FETCH_REGIONS_ERROR.eventName,
      req: req,
      payload: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      errorData: error instanceof Error ? error.message : 'Unknown error'
    });

    throw error;
  }
}

