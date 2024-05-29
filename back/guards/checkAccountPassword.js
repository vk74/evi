const bcrypt = require('bcrypt');
const userdb = require('../db/maindb');
const pool = require('../db/maindb').pool;

const checkAccountPassword = async (req, res, next) => {
    const { username, password } = req.body;
    try {
        const userResult = await pool.query('SELECT username, hashed_password FROM users WHERE username = $1', [username]);
        if (userResult.rows.length === 0) {
            return res.status(401).send('User not found');
        }

        const { hashed_password } = userResult.rows[0];
        const isValid = await bcrypt.compare(password, hashed_password);

        if (isValid) {
            req.user = { username }; // Добавляем информацию о пользователе в объект запроса
            next(); // Передаем управление следующему обработчику
        } else {
            res.status(401).send('Invalid password');
        }
    } catch (error) {
        console.error('Error checking account password:', error.message);
        res.status(500).send('Server error during authentication');
    }
};

module.exports = checkAccountPassword;