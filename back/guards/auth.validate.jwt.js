const jwt = require('jsonwebtoken');
const fs = require('fs');
// const privateKeyPath = './keys/private_key.pem';
// const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

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
            user_id: decoded.user_id,  // Добавляем user_id если он есть в токене
            username: decoded.sub 
        };
        
        console.log('JWT validation successful for user:', decoded.sub);
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