/**
 * service.register.user.ts - version 1.0.02
 * BACKEND service for user registration
 * 
 * Processes user registration requests:
 * - Validates required fields
 * - Checks uniqueness of username, email, and phone
 * - Hashes password
 * - Stores user data in database (transaction)
 * - Returns success/error response
 * File: service.register.user.ts
 */

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../../core/db/maindb';
import { userRegistrationQueries } from './queries.account';
import fabricEvents from '../../core/eventBus/fabric.events';
import { ACCOUNT_REGISTRATION_EVENTS } from './events.account';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { ACCOUNT_SERVICE_EVENTS } from './events.account';

// Type assertion for pool
const pool = pgPool as Pool;

// Interface for registration request body
interface RegistrationRequest {
  username: string;
  password: string;
  surname: string; // will be last_name in DB
  name: string;    // will be first_name in DB
  email: string;
  phone?: string;  // optional
  address?: string; // optional
  [key: string]: any; // for any additional fields
}

interface EnhancedRequest extends Request {
  body: RegistrationRequest;
}

/**
 * Handles user registration
 * @param req Express request with registration data
 * @param res Express response
 * @returns Promise<void>
 */
const registerUser = async (req: EnhancedRequest, res: Response): Promise<void> => {
    try {
        const {
            username,
            password,
            surname,    // будет last_name в БД
            name,      // будет first_name в БД
            email,
            phone,
            address
        } = req.body;

        // Проверка наличия обязательных полей
        const requiredFields = ['username', 'password', 'surname', 'name', 'email'];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            res.status(400).json({
                message: 'missing required fields: ' + missingFields.join(', ')
            });
            return;
        }

        // Проверка уникальности username
        const usernameResult: QueryResult = await pool.query(userRegistrationQueries.checkUsername.text, [username]);
        if (usernameResult.rows.length > 0) {
            res.status(400).json({
                message: 'this username is already registered by another user'
            });
            return;
        }

        // Проверка уникальности email
        const emailResult: QueryResult = await pool.query(userRegistrationQueries.checkEmail.text, [email]);
        if (emailResult.rows.length > 0) {
            res.status(400).json({
                message: 'this e-mail is already registered by another user'
            });
            return;
        }

        // Проверка уникальности телефона (только если он предоставлен)
        if (phone) {
            const phoneResult: QueryResult = await pool.query(userRegistrationQueries.checkPhone.text, [phone]);
            if (phoneResult.rows.length > 0) {
                res.status(400).json({
                    message: 'this phone number is already registered by another user'
                });
                return;
            }
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        // Начало транзакции
        await pool.query('BEGIN');

        try {
            // Вставка основных данных пользователя в app.users
            const userResult: QueryResult = await pool.query(
                userRegistrationQueries.insertUserWithNames.text,
                [
                    username,         // $1
                    hashedPassword,   // $2
                    email,           // $3
                    name,            // $4 (first_name)
                    surname,         // $5 (last_name)
                    null,            // $6 (middle_name)
                    false,           // $7 (is_staff)
                    'active'         // $8 (account_status)
                ]
            );

            const userId = userResult.rows[0].user_id;

            // Вставка дополнительных данных в app.user_profiles
            await pool.query(
                userRegistrationQueries.insertAdminUserProfileWithoutNames.text,
                [
                    userId,          // $1
                    null,            // $2 (gender)
                    phone || null,   // $3
                    address || null, // $4
                    null,            // $5 (company_name)
                    null            // $6 (position)
                ]
            );

            await pool.query('COMMIT');

            // Log successful registration
            await fabricEvents.createAndPublishEvent({
                eventName: ACCOUNT_REGISTRATION_EVENTS.REGISTRATION_SUCCESS.eventName,
                req,
                payload: {
                    userId,
                    username,
                    email,
                    timestamp: new Date().toISOString()
                }
            });

            res.status(201).json({
                message: 'user registration successful',
                userId
            });
            return;

        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        await createAndPublishEvent({
          eventName: ACCOUNT_SERVICE_EVENTS.REGISTER_USER_ERROR.eventName,
          payload: {
            registrationData: {
              username: req.body.username,
              email: req.body.email,
              phone: req.body.phone
            },
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          errorData: error instanceof Error ? error.message : undefined
        });
        
        // Log failed registration
        await fabricEvents.createAndPublishEvent({
            eventName: ACCOUNT_REGISTRATION_EVENTS.REGISTRATION_FAILED.eventName,
            req,
            payload: {
                username: req.body.username,
                email: req.body.email,
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString()
            },
            errorData: error instanceof Error ? error.message : String(error)
        });
        
        res.status(500).json({
            message: 'registration failed',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};

// Export for ES modules only
export default registerUser; 