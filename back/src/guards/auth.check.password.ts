/*
  File version: 1.0.02
  This is a backend file. The file provides password verification functionality.
  It validates user credentials by checking username and password against the database.
*/

import bcrypt from 'bcrypt';
import { Response, NextFunction } from 'express';
import { pool } from '../db/maindb';
import { userQueries } from '../middleware/queries.users';
import { AuthenticatedRequest, GuardFunction } from './types.guards';

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
       console.log('Password check failed: Missing credentials');
       res.status(400).json({ 
           message: 'Username and password are required' 
       });
       return;
   }

   try {
       console.log("Password check for user:", username);
       
       const userResult = await pool.query(
           userQueries.getUserPassword,
           [username]
       );

       if (userResult.rows.length === 0) {
           console.log("Password check failed: User not found");
           res.status(401).json({ 
               message: 'Invalid credentials' 
           });
           return;
       }

       const { user_id, hashed_password } = userResult.rows[0];
       const isValid = await bcrypt.compare(password, hashed_password);

       if (isValid) {
           console.log("Password check successful for user:", username);
           req.user = { 
               user_id,
               username 
           };
           next();
       } else {
           console.log("Password check failed: Invalid password for user:", username);
           res.status(401).json({ 
               message: 'Invalid credentials' 
           });
       }

   } catch (error) {
       console.error('Error checking account password:', error);
       res.status(500).json({
           message: 'Server error during authentication',
           details: (error as Error).message
       });
   }
};

// Export using ES modules syntax
export default checkAccountPassword;