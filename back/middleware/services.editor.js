// services.editor.js
// получает данные из фронтэнда, модуля service editor, отправляет в модуль валидации и записывает в базу

const { pool } = require('../db/maindb');
const { validateServiceData, ValidationError } = require('./services.editor.validator');

async function serviceEditor(req, res) {
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
            console.log('Validation error:', validationError.message);
            return res.status(400).json({
                message: 'Ошибка валидации данных',
                error: validationError.message,
                field: validationError.field
            });
        }

        await client.query('BEGIN');
        console.log('Transaction started');

        // Используем UUID пользователя, полученный ранее через getUserUUID
        const userId = req.user.uuid;
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

        const serviceResult = await client.query(servicesQuery, servicesValues);
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
                message: 'Ошибка при создании сервиса',
                error: error.message
            });
        }
    } finally {
        console.log('Releasing database connection');
        client.release();
    }
}

// Placeholder для будущих методов
/*
async function updateVisualization(req, res) {
    // TODO: Реализация обновления визуализации
}
async function updateAccess(req, res) {
    // TODO: Реализация обновления прав доступа
}
async function updateManagement(req, res) {
    // TODO: Реализация обновления данных управления
}
*/

module.exports = {
    serviceEditor
};