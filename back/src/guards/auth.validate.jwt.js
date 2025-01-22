// auth.validate.jwt
const jwt = require('jsonwebtoken');
const fs = require('fs');

console.log('read private key from file: success');

function validateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('JWT validation failed: Authorization header is missing');
    return res.status(401).json({
      message: 'Authorization header is missing'
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('JWT validation failed: Token is missing or invalid');
    return res.status(401).json({
      message: 'Token is missing or invalid'
    });
  }

  try {
    const decoded = jwt.verify(token, privateKey);
    // Расширяем информацию о пользователе в запросе
    req.user = {
      id: decoded.sub,  // Используем sub из JWT как id пользователя
      username: decoded.sub
    };
    
    console.log('JWT validation successful for user:', decoded.sub);
    console.log('Decoded user info:', req.user);  // Добавляем для отладки
    next();
  } catch (error) {
    console.log('JWT validation failed:', error.message);
    return res.status(401).json({
      message: 'Token is invalid or expired',
      details: error.message
    });
  }
}

module.exports = validateJWT;