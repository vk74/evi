const jwt = require('jsonwebtoken');
const uuidv4 = require('uuid').v4;

const issueToken = (req, res) => {
    if (!req.user) {
        console.log('Token issuance failed: No user data in request');
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }
    
    console.log('User authenticated, issuing token for:', req.user.username);
    const payload = {
        iss: 'ev2 app',
        sub: req.user.username,
        aud: 'ev2 app registered users',
        jti: uuidv4(),
    };
    
    try {
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
    }
};

module.exports = issueToken;