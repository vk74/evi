/**
 * users.update.profile.ts - version 1.0.1
 * BACKEND middleware for updating user profile data
 * 
 * This file is a candidate for deletion after migration of user profile module to .ts
 * 
 * Processes requests to update user profile information in the database
 * Validates input data and returns updated profile or appropriate error messages
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

// Interface for profile update request body
interface ProfileUpdateRequest {
  first_name?: string;
  last_name?: string;
  middle_name?: string | null;
  gender?: string | null;
  phone_number?: string | null;
  email?: string | null;
  address?: string | null;
  company_name?: string | null;
  position?: string | null;
  [key: string]: any;
}

// Interface for updated profile data
interface UserProfileData {
  user_id: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string | null;
  gender?: string | null;
  mobile_phone_number?: string | null;
  address?: string | null;
  company_name?: string | null;
  position?: string | null;
  [key: string]: any;
}

/**
 * Updates user profile information
 * @param req Express request with profile update data
 * @param res Express response
 * @returns Promise<void>
 */
const updateUserProfile = async (req: EnhancedRequest, res: Response): Promise<void> => {
   console.log('Received request for user profile data update');

   const username = req.user?.username;
   console.log('Processing update for user:', username);

   if (!username) {
       console.error('Request does not contain username');
       res.status(400).json({
           message: 'Username is required'
       });
       return;
   }

   const {
       first_name,
       last_name,
       middle_name,
       gender,
       phone_number,
       email,
       address,
       company_name,
       position
   } = req.body as ProfileUpdateRequest;

   console.log('Received profile update data:', {
       first_name,
       last_name,
       middle_name,
       gender,
       phone_number,
       email,
       address,
       company_name,
       position
   });

   try {
       const values = [
           first_name,
           last_name,
           middle_name,
           gender,
           phone_number,
           address,
           company_name,
           position,
           username
       ];

       console.log('Executing profile update query with values:', values);
       
       const result: QueryResult<UserProfileData> = await pool.query(
           userQueries.updateProfile.text,
           values
       );

       if (result.rows.length > 0) {
           console.log('Profile successfully updated for user:', username);
           res.json(result.rows[0]);
       } else {
           console.error('Profile not found for user:', username);
           res.status(404).json({
               message: 'User profile not found'
           });
       }

   } catch (error) {
       console.error('Error updating profile:', error);
       res.status(500).json({
           message: 'Failed to update profile',
           details: error instanceof Error ? error.message : String(error)
       });
   }
}

// Export for ES modules
export default updateUserProfile;