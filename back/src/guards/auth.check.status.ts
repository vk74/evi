/*
  File version: 1.0.01
  This is a backend file. The file provides account status verification functionality.
  It checks if a user account exists and is not disabled before allowing further request processing.
*/

import { Response, NextFunction } from 'express';
import { pool } from '../db/maindb';
import { userQueries } from '../middleware/queries.users';
import { AuthenticatedRequest, GuardFunction } from './types.guards';

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
       console.log('Status check failed: Missing username');
       res.status(400).json({
           message: 'Username is required'
       });
       return;
   }

   try {
       console.log("Checking account status for user:", username);
       
       const queryResult = await pool.query(
           userQueries.getUserStatus,
           [username]
       );

       if (queryResult.rows.length === 0) {
           console.log("Status check failed: User not found");
           res.status(404).json({
               message: 'User not found'
           });
           return;
       }

       const { account_status } = queryResult.rows[0];
       
       if (account_status === 'disabled') {
           console.log("Status check failed: Account is disabled for user:", username);
           res.status(403).json({
               message: 'Account is disabled'
           });
           return;
       }

       console.log("Status check successful for user:", username);
       next();

   } catch (error) {
       console.error('Error checking account status:', error);
       res.status(500).json({
           message: 'Server error during account status check',
           details: (error as Error).message
       });
   }
};

// Using module.exports for CommonJS compatibility
module.exports = checkAccountStatus;