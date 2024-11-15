const { pool } = require('../db/maindb');

/**
 * Общие вспомогательные функции
 */

// Получение UUID пользователя по его имени
async function getUserUUID(client, username) {
  const userQuery = 'SELECT user_id FROM app.users WHERE username = $1';
  const userResult = await client.query(userQuery, [username]);
  
  if (userResult.rows.length === 0) {
    throw new Error('User not found in database');
  }
  
  const userId = userResult.rows[0].user_id;
  console.log('Found user UUID:', userId);
  return userId;
}

/**
 * Сохранение данных секции "Описание"
 */
async function createService(req, res) {
  const client = await client.connect();
  console.log('Database connection established');

  try {
    await client.query('BEGIN');
    console.log('Transaction started');

    // Получаем UUID пользователя
    const userId = await getUserUUID(client, req.user.username);
    console.log('User info from request:', req.user);
    console.log('User ID from request:', userId);

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
      message: 'Сервис успешно создан',
      serviceId: serviceId
    });

  } catch (error) {
    console.error('Error during service creation:', error);
    await client.query('ROLLBACK');
    console.log('Transaction rolled back due to error');
    
    res.status(500).json({
      message: 'Ошибка при создании сервиса',
      error: error.message
    });

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
  createService
  // updateVisualization,
  // updateAccess,
  // updateManagement
};