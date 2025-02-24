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
    // Логируем получение запроса
    console.log(`[${new Date().toISOString()}] [FetchUsernameService] Received request to fetch username for userId: ${userId}`);

    if (!userId) {
      console.log(`[${new Date().toISOString()}] [FetchUsernameService] Validation failed: User ID is required`);
      res.status(400).json({
        success: false,
        message: 'User ID is required',
        data: null
      });
      return;
    }

    // Логируем начало выполнения запроса к базе данных
    console.log(`[${new Date().toISOString()}] [FetchUsernameService] Querying database for userId: ${userId}`);
    
    // Выполняем запрос к базе данных для получения username по user_id
    const result: QueryResult<{ username: string }> = await pool.query(
      'SELECT username FROM app.users WHERE user_id = $1 LIMIT 1', // Убедились, что таблица и поля корректны
      [userId]
    );

    // Логируем результат запроса
    console.log(`[${new Date().toISOString()}] [FetchUsernameService] Database query result for userId ${userId}:`, {
      rowsLength: result.rows.length,
      rows: result.rows
    });

    if (result.rows.length === 0) {
      console.log(`[${new Date().toISOString()}] [FetchUsernameService] User not found for userId: ${userId}`);
      res.status(404).json({
        success: false,
        message: 'User not found',
        data: null
      });
      return;
    }

    const username = result.rows[0].username;

    // Логируем успешное получение username
    console.log(`[${new Date().toISOString()}] [FetchUsernameService] Successfully retrieved username: ${username} for userId: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Username fetched successfully',
      data: { username }
    });
  } catch (error) {
    // Логируем ошибку
    console.error(`[${new Date().toISOString()}] [FetchUsernameService] Error fetching username for userId: ${userId}`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

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