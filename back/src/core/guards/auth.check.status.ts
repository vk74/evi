/**
 * auth.check.status.ts - backend file
 * version: 1.0.0
 * 
 * This file provides account status verification functionality.
 * It checks if a user account exists and is not disabled before allowing further request processing.
 * Publishes events to event bus for monitoring and tracking
 */

import { Response, NextFunction } from 'express';
import { pool } from '../db/maindb';
import { userQueries } from './queries.users';
import { AuthenticatedRequest, GuardFunction } from './types.guards';
import { createAndPublishEvent } from '../eventBus/fabric.events';
import { AUTH_STATUS_CHECK_EVENTS } from '../auth/events.auth';

/**
 * Middleware to check if a user account is active
 * @param req - Express request with user information
 * @param res - Express response
 * @param next - Express next function
 */
const checkAccountStatus: GuardFunction = async (
   req: AuthenticatedRequest, 
   res: Response, 
   next: NextFunction
): Promise<void> => {
   const { username } = req.body;

   if (!username) {
       // Publish warning event
       await createAndPublishEvent({
           req,
           eventName: AUTH_STATUS_CHECK_EVENTS.STATUS_CHECK_FAILED_MISSING_USERNAME.eventName,
           payload: {
               requestInfo: {
                   hasUsername: !!username
               }
           }
       });
       
       res.status(400).json({
           message: 'Username is required'
       });
       return;
   }

   try {
       // Publish debug event for status check started
       await createAndPublishEvent({
           req,
           eventName: AUTH_STATUS_CHECK_EVENTS.STATUS_CHECK_STARTED.eventName,
           payload: {
               username
           }
       });
       
       const queryResult = await pool.query(
           userQueries.getUserStatus,
           [username]
       );

       if (queryResult.rows.length === 0) {
           // Publish warning event for user not found
           await createAndPublishEvent({
               req,
               eventName: AUTH_STATUS_CHECK_EVENTS.STATUS_CHECK_FAILED_USER_NOT_FOUND.eventName,
               payload: {
                   username
               }
           });
           
           res.status(404).json({
               message: 'User not found'
           });
           return;
       }

       const { account_status } = queryResult.rows[0];
       
       if (account_status === 'disabled') {
           // Publish warning event for account disabled
           await createAndPublishEvent({
               req,
               eventName: AUTH_STATUS_CHECK_EVENTS.STATUS_CHECK_FAILED_ACCOUNT_DISABLED.eventName,
               payload: {
                   username
               }
           });
           
           res.status(403).json({
               message: 'Account is disabled'
           });
           return;
       }

       // Publish debug event for status check success
       await createAndPublishEvent({
           req,
           eventName: AUTH_STATUS_CHECK_EVENTS.STATUS_CHECK_SUCCESS.eventName,
           payload: {
               username
           }
       });
       
       next();

   } catch (error) {
       // Publish error event
       await createAndPublishEvent({
           req,
           eventName: AUTH_STATUS_CHECK_EVENTS.STATUS_CHECK_ERROR.eventName,
           payload: {
               username,
               error: error
           },
           errorData: (error as Error).message
       });
       
       res.status(500).json({
           message: 'Server error during account status check',
           details: (error as Error).message
       });
   }
};

// Export using ES modules syntax
export default checkAccountStatus;