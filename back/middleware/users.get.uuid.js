const { pool } = require('../db/maindb');

async function getUserUUID(req, res, next) {
  const client = await pool.connect();
  
  try {
    // Проверяем наличие username из предыдущего middleware (validateJWT)
    if (!req.user || !req.user.username) {
      throw new Error('User information not found in request');
    }

    const userQuery = 'SELECT user_id FROM app.users WHERE username = $1';
    const userResult = await client.query(userQuery, [req.user.username]);
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found in database');
    }
    
    // Добавляем UUID в объект req.user
    req.user.uuid = userResult.rows[0].user_id;
    console.log('User UUID middleware:', {
      username: req.user.username,
      uuid: req.user.uuid
    });
    
    next();

  } catch (error) {
    console.error('getUserUUID middleware error:', error);
    res.status(401).json({
      message: 'Error getting user UUID',
      error: error.message
    });
  } finally {
    client.release();
  }
}

module.exports = getUserUUID;