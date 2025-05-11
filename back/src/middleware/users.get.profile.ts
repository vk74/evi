/**
 * users.get.profile.ts - version 1.0.1
 * BACKEND middleware for retrieving user profile data
 * 
 * This file is a candidate for deletion after migration of user profile module to .ts
 * 
 * Retrieves user profile data from the database based on the username in the request
 * Returns profile data to the client or appropriate error responses
 */

import { Request, Response } from 'express';
import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../db/maindb';
import { userQueries } from './queries.users';

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

// Interface for user profile data
interface UserProfile {
  email: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  mobile_phone_number: string | null;
  address: string | null;
  company_name: string | null;
  position: string | null;
  gender: string | null;
  [key: string]: any;
}

/**
 * Retrieves user profile data
 * @param req Express request with user info
 * @param res Express response
 * @returns Promise<void>
 */
const getUserProfile = async (req: EnhancedRequest, res: Response): Promise<void> => {
   const username = req.user?.username;

   if (!username) {
       console.log('Get profile failed: Username is missing');
       res.status(400).json({
           message: 'Username is required'
       });
       return;
   }

   try {
       console.log('Retrieving profile data for user:', username);
       
       const result: QueryResult<UserProfile> = await pool.query(
           userQueries.getProfile.text,
           [username]
       );

       if (result.rows.length > 0) {
           console.log('Profile data found for user:', username);
           res.json(result.rows[0]);
       } else {
           console.log('Profile not found for user:', username);
           res.status(404).json({
               message: 'User profile not found'
           });
       }

   } catch (error) {
       console.error('Error in getUserProfile:', error);
       res.status(500).json({
           message: 'Internal server error',
           details: error instanceof Error ? error.message : String(error)
       });
   }
};

// Export for ES modules only
export default getUserProfile;