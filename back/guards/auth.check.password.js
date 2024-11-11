const bcrypt = require('bcrypt');
const { pool } = require('../db/maindb');

const checkAccountPassword = async (req, res, next) => {
    const { username, password } = req.body;
    
    try {
        console.log("Password check for user:", username);
        
        const userResult = await pool.query(
            'SELECT user_id, username, hashed_password FROM app.users WHERE username = $1', 
            [username]
        );

        if (userResult.rows.length === 0) {
            console.log("Password check failed: User not found");
            return res.status(401).json({ message: 'User not found' });
        }

        const { user_id, hashed_password } = userResult.rows[0];
        const isValid = await bcrypt.compare(password, hashed_password);

        if (isValid) {
            console.log("Password check successful for user:", username);
            // Добавляем больше информации о пользователе в объект запроса
            req.user = { 
                user_id,
                username 
            }; 
            next();
        } else {
            console.log("Password check failed: Invalid password for user:", username);
            res.status(401).json({ message: 'Invalid password' });
        }
    } catch (error) {
        console.error('Error checking account password:', error.message);
        res.status(500).json({ 
            message: 'Server error during authentication',
            details: error.message 
        });
    }
};

module.exports = checkAccountPassword;