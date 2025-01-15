const jwt = require('jsonwebtoken');
const uuidv4 = require('uuid').v4;
const { pool } = require('../db/maindb');

const issueToken = async (req, res) => {
  if (!req.user) {
    console.log('Token issuance failed: No user data in request');
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  const client = await pool.connect();
  try {
    // Получаем UUID пользователя из базы данных
    const userQuery = 'SELECT user_id FROM app.users WHERE username = $1';
    const userResult = await client.query(userQuery, [req.user.username]);
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found in database');
    }

    const userUUID = userResult.rows[0].user_id;
    console.log('User authenticated, issuing token for:', req.user.username, 'UUID:', userUUID);

    const payload = {
      iss: 'ev2 app',
      sub: req.user.username,
      aud: 'ev2 app registered users',
      jti: uuidv4(),
      uid: userUUID
    };

    const token = jwt.sign(payload, global.privateKey, {
      algorithm: 'RS256',
      expiresIn: '30m'
    });

    console.log('JWT successfully created and issued to the user:', req.user.username);
    res.json({
      success: true,
      token
    });

  } catch (error) {
    console.error('Token creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating token',
      details: error.message
    });
  } finally {
    client.release();
  }
};

module.exports = issueToken;