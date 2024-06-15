const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const uuidv4 = require('uuid').v4;


const privateKeyPath = './keys/private_key.pem'; // path to private key used to sign new JWT
const privateKey = fs.readFileSync(privateKeyPath, 'utf8'); // read private key from file
//global.privateKey = privateKey;// Сделайте privateKey доступным глобально

console.log('read private key from file: success');

const issueToken = (req, res) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    console.log('User authenticated, issuing token for:', req.user.username);

    const payload = {
        iss: 'ev2 app',
        sub: req.user.username,  // sub: username,
        aud: 'ev2 app registered users',
        jti: uuidv4(),
    };

    try {
        const token = jwt.sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn: '2h'
        });
        console.log('JWT successfully created and issued to the user:', req.user.username);
        res.json({ success: true, token });
    } catch (error) {
        console.error('token creation error:', error.message);
        res.status(500).send('error creating token');
    }
};

module.exports = issueToken;