/**
 * auth.check.password.ts - backend file
 * version: 1.0.0
 * 
 * This file provides password verification functionality.
 * It validates user credentials by checking username and password against the database.
 * Publishes events to event bus for monitoring and tracking
 */

import bcrypt from 'bcrypt';
import { Response, NextFunction } from 'express';
import { pool } from '../db/maindb';
import { userQueries } from './queries.users';
import { AuthenticatedRequest, GuardFunction } from './types.guards';
import { createAndPublishEvent } from '../eventBus/fabric.events';
import { AUTH_PASSWORD_CHECK_EVENTS } from '../auth/events.auth';

/**
 * Middleware to validate user credentials
 * @param req - Express request with credentials in body
 * @param res - Express response
 * @param next - Express next function
 */
const checkAccountPassword: GuardFunction = async (
   req: AuthenticatedRequest, 
   res: Response, 
   next: NextFunction
): Promise<void> => {
   const { username, password } = req.body;

   if (!username || !password) {
       // Publish warning event
       await createAndPublishEvent({
           req,
           eventName: AUTH_PASSWORD_CHECK_EVENTS.PASSWORD_CHECK_FAILED_MISSING_CREDENTIALS.eventName,
           payload: {
               requestInfo: {
                   hasUsername: !!username,
                   hasPassword: !!password
               }
           }
       });
       
       res.status(400).json({ 
           message: 'Username and password are required' 
       });
       return;
   }

   try {
       // Publish debug event for password check started
       await createAndPublishEvent({
           req,
           eventName: AUTH_PASSWORD_CHECK_EVENTS.PASSWORD_CHECK_STARTED.eventName,
           payload: {
               username
           }
       });
       
       const userResult = await pool.query(
           userQueries.getUserPassword,
           [username]
       );

       if (userResult.rows.length === 0) {
           // Publish warning event for user not found
           await createAndPublishEvent({
               req,
               eventName: AUTH_PASSWORD_CHECK_EVENTS.PASSWORD_CHECK_FAILED_USER_NOT_FOUND.eventName,
               payload: {
                   username
               }
           });
           
           res.status(401).json({ 
               message: 'Invalid credentials' 
           });
           return;
       }

       const { user_id, hashed_password } = userResult.rows[0];
       const isValid = await bcrypt.compare(password, hashed_password);

       if (isValid) {
           // Publish info event for password check success
           await createAndPublishEvent({
               req,
               eventName: AUTH_PASSWORD_CHECK_EVENTS.PASSWORD_CHECK_SUCCESS.eventName,
               payload: {
                   username
               }
           });
           
           req.user = { 
               user_id,
               username 
           };
           next();
       } else {
           // Publish warning event for invalid password
           await createAndPublishEvent({
               req,
               eventName: AUTH_PASSWORD_CHECK_EVENTS.PASSWORD_CHECK_FAILED_INVALID_PASSWORD.eventName,
               payload: {
                   username
               }
           });
           
           res.status(401).json({ 
               message: 'Invalid credentials' 
           });
       }

   } catch (error) {
       // Publish error event
       await createAndPublishEvent({
           req,
           eventName: AUTH_PASSWORD_CHECK_EVENTS.PASSWORD_CHECK_ERROR.eventName,
           payload: {
               username,
               error: error
           },
           errorData: (error as Error).message
       });
       
       res.status(500).json({
           message: 'Server error during authentication',
           details: (error as Error).message
       });
   }
};

// Export using ES modules syntax
export default checkAccountPassword;