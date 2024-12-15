// 16.11.2024 промежуточное ПО, пока не используется.

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const uuidv4 = require('uuid').v4;

const privateKeyPath = './keys/private_key.pem'; // путь к приватному ключу, используемому для подписи новых JWT
const privateKey = fs.readFileSync(privateKeyPath, 'utf8'); // чтение приватного ключа из файла
console.log('read private key from file: success');

const extendToken = (req, res) => {
  const oldToken = req.headers.authorization?.split(' ')[1];

  if (!oldToken) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(oldToken, privateKey, { algorithms: ['RS256'] });

    const payload = {
      iss: decoded.iss,
      sub: decoded.sub,
      aud: decoded.aud,
      jti: uuidv4(),
    };

    const newToken = jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      expiresIn: '1h'
    });

    console.log('JWT successfully extended and issued to the user');
    res.json({ success: true, token: newToken });
  } catch (error) {
    console.error('Token extension error:', error.message);
    res.status(500).send('Error extending token');
  }
};

module.exports = extendToken;