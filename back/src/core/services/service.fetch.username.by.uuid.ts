/**
 * service.fetch.username.by.uuid.ts (Backend)
 * Backend service for fetching username by user UUID from the database.
 * 
 * Functionality:
 * - Handles HTTP GET requests to retrieve username by UUID
 * - Validates request parameters
 * - Queries the database for username
 * - Sends formatted API responses
 * - Manages error handling and logging
 * - Designed as a single-file service for simplicity
 */

import { Request, Response, NextFunction } from 'express';
import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../../db/maindb'; // Импортируем пул из maindb.js (корректировка пути)

// Type assertion for pool
const pool = pgPool as Pool;

// Define types locally in the file
interface FetchUsernameResponse {
  success: boolean;
  message: string;
  data: {
    username: string;
  } | null;
}

interface ServiceError {
  code: 'INTERNAL_SERVER_ERROR';
  message: string;
  details: string;
}

/**
 * Fetches username for a given user UUID from the database
 * @param req Express Request object containing userId in params
 * @param res Express Response object for sending the response
 * @param next Express NextFunction for error handling
 */
export default async function fetchUsernameByUuid(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = req.params.userId;

  try {
    console.log(`[${new Date().toISOString()}] [FetchUsernameService] Received request to fetch username for userId: ${userId}`);

    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'User ID is required',
        data: null
      });
      return;
    }

    const result: QueryResult<{ username: string }> = await pool.query(
      'SELECT username FROM app.users WHERE user_id = $1::uuid LIMIT 1',
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        data: null
      });
      return;
    }

    const username = result.rows[0].username;

    console.log(`[${new Date().toISOString()}] [FetchUsernameService] Successfully retrieved username: ${username} for userId: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Username fetched successfully',
      data: { username }
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [FetchUsernameService] Error fetching username for userId: ${userId}`, error);

    const serviceError: ServiceError = {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch username',
      details: error instanceof Error ? error.message : 'Unknown error'
    };

    res.status(500).json({
      success: false,
      message: serviceError.message,
      data: null
    });
  }
}