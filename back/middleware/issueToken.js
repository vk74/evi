const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const uuidv4 = require('uuid').v4;


const privateKeyPath = './keys/private_key.pem'; // path to private key used to sign new JWT
const privateKey = fs.readFileSync(privateKeyPath, 'utf8'); // read private key from file
console.log('read private key from file: success');

const issueToken = (req, res) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const payload = {
        iss: 'ev2 webapp',
        sub: req.user.username,  // sub: username,
        aud: 'ev2 webapp registered users',
        jti: uuidv4(),
    };

    try {
        const token = jwt.sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn: '2h'
        });
        console.log('JWT successfully created and issued to the user');
        res.json({ success: true, token });
    } catch (error) {
        console.error('token creation error:', error.message);
        res.status(500).send('error creating token');
    }
};

module.exports = issueToken;