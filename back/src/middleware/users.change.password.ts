/**
 * users.change.password.ts - version 1.0.1
 * BACKEND middleware for user password change
 * 
 * Validates password change requests, checks current password
 * and updates the password in the database
 */

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../core/db/maindb';
import { userQueries } from './queries.users';
import { getUuidByUsername } from '../core/helpers/get.uuid.by.username';

// Type assertion for pool
const pool = pgPool as Pool;

// Interface for password change request
interface PasswordChangeRequest {
  username: string;
  currentPassword: string;
  newPassword: string;
  [key: string]: any;
}

// Interface for enhanced request
interface EnhancedRequest extends Request {
  body: PasswordChangeRequest;
}

// Interface for user password result
interface UserPasswordResult {
  user_id: string;
  hashed_password: string;
}

// Interface for update result
interface UpdateResult {
  username: string;
}

/**
 * Changes user password after validation
 * @param req Express request with password change data
 * @param res Express response
 * @returns Promise<void>
 */
const changeUserPassword = async (req: EnhancedRequest, res: Response): Promise<void> => {
   const { username, currentPassword, newPassword } = req.body;

   if (!username || !currentPassword || !newPassword) {
       console.log('Password change failed: Missing required fields');
       res.status(400).json({
           success: false,
           message: 'Username, current password and new password are required'
       });
       return;
   }

   console.log('Starting password change process for user:', username);

   // Проверка длины пароля
   if (newPassword.length < 8 || newPassword.length > 40) {
       console.log('Password change failed: Invalid password length');
       res.status(400).json({
           success: false,
           message: 'Password length must be between 8 and 40 characters'
       });
       return;
   }

   // Проверка регулярного выражения
   const regex = /^[a-zA-Zа-яА-Я0-9\p{P}]+$/u;
   if (!regex.test(newPassword)) {
       console.log('Password change failed: Invalid password format');
       res.status(400).json({
           success: false,
           message: 'Password must contain only letters, numbers, and punctuation marks'
       });
       return;
   }

   try {
       // Используем новый хелпер для получения UUID пользователя
       const userUUID = await getUuidByUsername(username);
       
       if (!userUUID) {
           console.log('Password change failed: User not found:', username);
           res.status(404).json({
               success: false,
               message: 'User not found'
           });
           return;
       }
       
       // Получение текущего хешированного пароля
       const userResult: QueryResult<UserPasswordResult> = await pool.query(
           userQueries.getUserPassword.text,
           [username]
       );

       if (userResult.rows.length === 0) {
           console.log('Password change failed: User not found:', username);
           res.status(404).json({
               success: false,
               message: 'User not found'
           });
           return;
       }

       // Проверка текущего пароля
       const hashedCurrentPassword = userResult.rows[0].hashed_password;
       const isMatch = await bcrypt.compare(currentPassword, hashedCurrentPassword);

       if (!isMatch) {
           console.log('Password change failed: Invalid current password for user:', username);
           res.status(400).json({
               success: false,
               message: 'Current password is incorrect'
           });
           return;
       }

       // Хеширование и обновление пароля
       const hashedNewPassword = await bcrypt.hash(newPassword, 10);
       
       const updateResult: QueryResult<UpdateResult> = await pool.query(
           userQueries.updatePassword.text,
           [hashedNewPassword, username]
       );

       if (updateResult.rows.length > 0) {
           console.log('Password successfully changed for user:', username);
           res.status(200).json({
               success: true,
               username: updateResult.rows[0].username
           });
       } else {
           console.log('Password change failed: User not found during update:', username);
           res.status(404).json({
               success: false,
               message: 'User not found'
           });
       }

   } catch (error) {
       console.error('Error during password change:', error);
       res.status(500).json({
           success: false,
           message: 'Failed to change password',
           details: error instanceof Error ? error.message : String(error)
       });
   }
};

// Export for ES modules only
export default changeUserPassword;