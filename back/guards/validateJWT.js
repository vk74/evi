const jwt = require('jsonwebtoken');
const fs = require('fs');

const privateKeyPath = './keys/private_key.pem'; // путь к закрытому ключу
const privateKey = fs.readFileSync(privateKeyPath, 'utf8'); // чтение закрытого ключа из файла

console.log('read private key from file: success');

function validateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header is missing' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token is missing or invalid' });
  }

  try {
    const decoded = jwt.verify(token, privateKey);
    console.log('Decoded token:', decoded); // Логируем декодированный токен для отладки
    req.user = { username: decoded.sub }; // Извлекаем имя пользователя и назначаем req.user.username
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token is invalid or expired' });
  }
}

module.exports = validateJWT;