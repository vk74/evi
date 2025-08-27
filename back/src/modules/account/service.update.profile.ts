/**
 * service.update.profile.ts - version 1.0.02
 * BACKEND service for updating user profile data
 * 
 * Updates user profile information in the database
 * Validates user authentication and updates profile data or returns appropriate error messages
 * File: service.update.profile.ts
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

// Interface for profile update request
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
   await createAndPublishEvent({
     eventName: ACCOUNT_SERVICE_EVENTS.UPDATE_PROFILE_REQUEST_RECEIVED.eventName,
     payload: {
       requestInfo: {
         method: req.method,
         url: req.url,
         userAgent: req.get('User-Agent')
       }
     }
   });

   const username = req.user?.username;
   await createAndPublishEvent({
     eventName: ACCOUNT_SERVICE_EVENTS.UPDATE_PROFILE_PROCESSING.eventName,
     payload: {
       username
     }
   });

   if (!username) {
       await createAndPublishEvent({
         eventName: ACCOUNT_SERVICE_EVENTS.UPDATE_PROFILE_MISSING_USERNAME.eventName,
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

   await createAndPublishEvent({
     eventName: ACCOUNT_SERVICE_EVENTS.UPDATE_PROFILE_DATA_RECEIVED.eventName,
     payload: {
       username,
       updateData: {
         first_name,
         last_name,
         middle_name,
         gender,
         phone_number,
         email,
         address,
         company_name,
         position
       }
     }
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

       await createAndPublishEvent({
         eventName: ACCOUNT_SERVICE_EVENTS.UPDATE_PROFILE_EXECUTING.eventName,
         payload: {
           username,
           values
         }
       });
       
       const result: QueryResult<UserProfileData> = await pool.query(
           userProfileQueries.updateProfile.text,
           values
       );

       if (result.rows.length > 0) {
           await createAndPublishEvent({
             eventName: ACCOUNT_SERVICE_EVENTS.UPDATE_PROFILE_SUCCESS.eventName,
             payload: {
               username
             }
           });
           res.json(result.rows[0]);
       } else {
           await createAndPublishEvent({
             eventName: ACCOUNT_SERVICE_EVENTS.UPDATE_PROFILE_NOT_FOUND.eventName,
             payload: {
               username
             }
           });
           res.status(404).json({
               message: 'User profile not found'
           });
       }

   } catch (error) {
       await createAndPublishEvent({
         eventName: ACCOUNT_SERVICE_EVENTS.UPDATE_PROFILE_ERROR.eventName,
         payload: {
           username,
           error: error instanceof Error ? error.message : 'Unknown error'
         },
         errorData: error instanceof Error ? error.message : undefined
       });
       res.status(500).json({
           message: 'Failed to update profile',
           details: error instanceof Error ? error.message : String(error)
       });
   }
};

// Export for ES modules only
export default updateUserProfile; 