/**
 * service.register.user.ts - version 1.0.04
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
import { getValidationRule } from '@/core/validation/service.load.validation.settings';
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
            phone
        } = req.body;

        // Проверка наличия обязательных полей
        const requiredFields = ['username', 'password', 'surname', 'name', 'email'];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            // Emit failure events with clear reason
            await fabricEvents.createAndPublishEvent({
                eventName: ACCOUNT_REGISTRATION_EVENTS.REGISTRATION_FAILED.eventName,
                req,
                payload: {
                    username,
                    email,
                    phone: phone || null,
                    reason: 'missing_required_fields',
                    missing: missingFields,
                    timestamp: new Date().toISOString()
                }
            });
            await createAndPublishEvent({
                eventName: ACCOUNT_SERVICE_EVENTS.REGISTER_USER_ERROR.eventName,
                payload: {
                    registrationData: { username, email, phone },
                    error: 'missing required fields',
                    reason: 'missing_required_fields',
                    missing: missingFields
                }
            });
            res.status(400).json({
                message: 'missing required fields: ' + missingFields.join(', ')
            });
            return;
        }

        // Проверка уникальности username
        const usernameResult: QueryResult = await pool.query(userRegistrationQueries.checkUsername.text, [username]);
        if (usernameResult.rows.length > 0) {
            await fabricEvents.createAndPublishEvent({
                eventName: ACCOUNT_REGISTRATION_EVENTS.REGISTRATION_FAILED.eventName,
                req,
                payload: {
                    username,
                    email,
                    phone: phone || null,
                    reason: 'duplicate_username',
                    timestamp: new Date().toISOString()
                }
            });
            await createAndPublishEvent({
                eventName: ACCOUNT_SERVICE_EVENTS.REGISTER_USER_ERROR.eventName,
                payload: {
                    registrationData: { username, email, phone },
                    error: 'this username is already registered by another user',
                    reason: 'duplicate_username'
                }
            });
            res.status(400).json({
                message: 'this username is already registered by another user'
            });
            return;
        }

        // Проверка уникальности email
        const emailResult: QueryResult = await pool.query(userRegistrationQueries.checkEmail.text, [email]);
        if (emailResult.rows.length > 0) {
            await fabricEvents.createAndPublishEvent({
                eventName: ACCOUNT_REGISTRATION_EVENTS.REGISTRATION_FAILED.eventName,
                req,
                payload: {
                    username,
                    email,
                    phone: phone || null,
                    reason: 'duplicate_email',
                    timestamp: new Date().toISOString()
                }
            });
            await createAndPublishEvent({
                eventName: ACCOUNT_SERVICE_EVENTS.REGISTER_USER_ERROR.eventName,
                payload: {
                    registrationData: { username, email, phone },
                    error: 'this e-mail is already registered by another user',
                    reason: 'duplicate_email'
                }
            });
            res.status(400).json({
                message: 'this e-mail is already registered by another user'
            });
            return;
        }

        // Проверка уникальности телефона (только если он предоставлен)
        if (phone) {
            // Дополнительная проверка телефона по маске на бэкенде
            try {
                const rule = await getValidationRule('telephoneNumber', req);
                let pattern: RegExp | null = null;
                if (rule && (rule as any).regex) {
                    const rx = (rule as any).regex;
                    pattern = rx instanceof RegExp ? rx : new RegExp(String(rx));
                }
                if (pattern) {
                    const matches = pattern.test(phone);
                    if (!matches) {
                        await fabricEvents.createAndPublishEvent({
                            eventName: ACCOUNT_REGISTRATION_EVENTS.REGISTRATION_FAILED.eventName,
                            req,
                            payload: {
                                username,
                                email,
                                reason: 'invalid_phone_format',
                                timestamp: new Date().toISOString()
                            }
                        });
                        res.status(400).json({ message: 'invalid phone number format' });
                        return;
                    }
                }
            } catch (e) {
                // Не прерываем регистрацию при ошибке получения правила; продолжаем с уникальностью
            }

            const phoneResult: QueryResult = await pool.query(userRegistrationQueries.checkPhone.text, [phone]);
            if (phoneResult.rows.length > 0) {
                await fabricEvents.createAndPublishEvent({
                    eventName: ACCOUNT_REGISTRATION_EVENTS.REGISTRATION_FAILED.eventName,
                    req,
                    payload: {
                        username,
                        email,
                        phone,
                        reason: 'duplicate_phone',
                        timestamp: new Date().toISOString()
                    }
                });
                await createAndPublishEvent({
                    eventName: ACCOUNT_SERVICE_EVENTS.REGISTER_USER_ERROR.eventName,
                    payload: {
                        registrationData: { username, email, phone },
                        error: 'this phone number is already registered by another user',
                        reason: 'duplicate_phone'
                    }
                });
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
            // Emit detailed failure reason if available (e.g., unique violations)
            const pgCode = (error as any)?.code;
            const constraint = (error as any)?.constraint as string | undefined;
            let reason = 'db_error';
            if (pgCode === '23505') {
                if (constraint && /username/i.test(constraint)) reason = 'duplicate_username';
                else if (constraint && /email/i.test(constraint)) reason = 'duplicate_email';
                else if (constraint && /(phone|mobile)/i.test(constraint)) reason = 'duplicate_phone';
                else reason = 'duplicate';
            }
            await fabricEvents.createAndPublishEvent({
                eventName: ACCOUNT_REGISTRATION_EVENTS.REGISTRATION_FAILED.eventName,
                req,
                payload: {
                    username,
                    email,
                    phone: phone || null,
                    reason,
                    constraint: constraint || null,
                    pgCode: pgCode || null,
                    timestamp: new Date().toISOString()
                }
            });
            // Attach structured info for connection handler
            (error as any).code = (error as any)?.code || (pgCode === '23505' ? 'VALIDATION_ERROR' : 'INTERNAL_SERVER_ERROR');
            (error as any).reason = reason;
            (error as any).constraint = constraint;
            (error as any).pgCode = pgCode;
            throw error;
        }

    } catch (error) {
        // Map unique constraint violations to clear reasons and 400 responses
        const pgCode = (error as any)?.code;
        const constraint = (error as any)?.constraint as string | undefined;

        if (pgCode === '23505') {
            let reason = 'duplicate';
            let message = 'duplicate value';
            if (constraint) {
                if (/username/i.test(constraint)) {
                    reason = 'duplicate_username';
                    message = 'this username is already registered by another user';
                } else if (/email/i.test(constraint)) {
                    reason = 'duplicate_email';
                    message = 'this e-mail is already registered by another user';
                } else if (/phone|mobile/i.test(constraint)) {
                    reason = 'duplicate_phone';
                    message = 'this phone number is already registered by another user';
                }
            }

            await fabricEvents.createAndPublishEvent({
                eventName: ACCOUNT_REGISTRATION_EVENTS.REGISTRATION_FAILED.eventName,
                req,
                payload: {
                    username: req.body.username,
                    email: req.body.email,
                    phone: req.body.phone || null,
                    reason,
                    constraint: constraint || null,
                    timestamp: new Date().toISOString()
                }
            });

            await createAndPublishEvent({
                eventName: ACCOUNT_SERVICE_EVENTS.REGISTER_USER_ERROR.eventName,
                payload: {
                    registrationData: {
                        username: req.body.username,
                        email: req.body.email,
                        phone: req.body.phone
                    },
                    error: message,
                    reason,
                    constraint: constraint || null
                },
                errorData: error instanceof Error ? error.message : undefined
            });

            res.status(400).json({ message });
            return;
        }

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
                phone: req.body.phone || null,
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