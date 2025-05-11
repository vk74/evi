/**
 * services.editor.ts - version 1.0.01
 * BACKEND middleware for processing service editor data
 * 
 * This file is a candidate for deletion after re-creation of services module
 * 
 * Receives data from frontend service editor module, validates it through validation module,
 * and saves it to the database in a transaction across services and service_details tables
 */

import { Request, Response } from 'express';
import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../db/maindb';
import { validateServiceData, ValidationError } from './services.editor.validator';

// Type assertion for pool
const pool = pgPool as Pool;

// Interface for user info in request
interface UserInfo {
  username: string;
  uuid: string;
  [key: string]: any;
}

// Interface for enhanced request with user info
interface EnhancedRequest extends Request {
  user?: UserInfo;
  body: ServiceData;
}

// Interface for service data structure
interface ServiceData {
  name: string;
  status: string;
  visibility: string;
  shortDescription?: string;
  priority: number;
  fullDescription?: string;
  purpose?: string;
  comments?: string;
  [key: string]: any;
}

// Interface for service query result
interface ServiceResult {
  service_id: string;
  [key: string]: any;
}

/**
 * Processes service editor data, validates it and saves to database
 * @param req Express request with service data
 * @param res Express response
 * @returns Promise<void>
 */
async function serviceEditor(req: EnhancedRequest, res: Response): Promise<void> {
    const client = await pool.connect();
    console.log('Database connection established');
    
    try {
        // Валидация входящих данных
        try {
            await validateServiceData({
                name: req.body.name,
                status: req.body.status,
                visibility: req.body.visibility,
                shortDescription: req.body.shortDescription,
                priority: req.body.priority,
                fullDescription: req.body.fullDescription,
                purpose: req.body.purpose,
                comments: req.body.comments
            });
        } catch (validationError) {
            // Если произошла ошибка валидации, возвращаем 400 Bad Request
            console.log('Validation error:', (validationError as ValidationError).message);
            res.status(400).json({
                message: 'Ошибка валидации данных',
                error: (validationError as ValidationError).message,
                field: (validationError as ValidationError).field
            });
            return;
        }

        await client.query('BEGIN');
        console.log('Transaction started');

        // Используем UUID пользователя, полученный ранее через getUserUUID
        const userId = req.user?.uuid;
        
        if (!userId) {
            throw new Error('User UUID not found in request');
        }
        
        console.log('User info from request:', req.user);
        console.log('Using user UUID from middleware:', userId);

        // Создаем запись в таблице services
        const servicesQuery = `
            INSERT INTO app.services (
                service_id,
                service_name,
                service_status,
                service_visibility,
                service_description_short
            ) VALUES (
                gen_random_uuid(),
                $1, $2, $3, $4
            )
            RETURNING service_id`;

        const servicesValues = [
            req.body.name,
            req.body.status,
            req.body.visibility,
            req.body.shortDescription || null
        ];

        console.log('Services table values to insert:', {
            name: req.body.name,
            status: req.body.status,
            visibility: req.body.visibility,
            shortDescription: req.body.shortDescription
        });

        const serviceResult: QueryResult<ServiceResult> = await client.query(servicesQuery, servicesValues);
        const serviceId = serviceResult.rows[0].service_id;
        console.log('Successfully inserted into services table, generated service_id:', serviceId);

        // Создаем запись в таблице service_details
        const detailsQuery = `
            INSERT INTO app.service_details (
                service_id,
                service_priority,
                service_description_long,
                service_purpose,
                service_comments,
                service_created_by,
                service_created_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP
            )`;

        const detailsValues = [
            serviceId,
            req.body.priority,
            req.body.fullDescription || null,
            req.body.purpose || null,
            req.body.comments || null,
            userId
        ];

        console.log('Service_details table values to insert:', {
            serviceId: serviceId,
            priority: req.body.priority,
            fullDescription: req.body.fullDescription,
            purpose: req.body.purpose,
            comments: req.body.comments,
            createdBy: userId
        });

        await client.query(detailsQuery, detailsValues);
        console.log('Successfully inserted into service_details table');

        await client.query('COMMIT');
        console.log('Transaction committed successfully');

        res.status(201).json({
            message: 'данные сервиса успешно записаны',
            serviceId: serviceId
        });

    } catch (error) {
        console.error('Error during service creation:', error);
        await client.query('ROLLBACK');
        console.log('Transaction rolled back due to error');
        
        // Определяем тип ответа в зависимости от типа ошибки
        if (error instanceof ValidationError) {
            res.status(400).json({
                message: 'Ошибка валидации данных',
                error: error.message,
                field: error.field
            });
        } else {
            res.status(500).json({
                message: 'Ошибка при записи данных сервиса',
                error: error instanceof Error ? error.message : String(error)
            });
        }
    } finally {
        console.log('Releasing database connection');
        client.release();
    }
}

// Placeholder для будущих методов
/*
async function updateVisualization(req: EnhancedRequest, res: Response): Promise<void> {
    // TODO: Реализация обновления визуализации
}
async function updateAccess(req: EnhancedRequest, res: Response): Promise<void> {
    // TODO: Реализация обновления прав доступа
}
async function updateManagement(req: EnhancedRequest, res: Response): Promise<void> {
    // TODO: Реализация обновления данных управления
}
*/

// Export using ES modules only
export { serviceEditor };