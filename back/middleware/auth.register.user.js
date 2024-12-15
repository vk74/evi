// auth.register.user: middleware для обработки данных учетной записи пользователя со страницы самостоятельной регистрации нового пользователя 

const bcrypt = require('bcrypt');
const { pool } = require('../db/maindb');
const { userQueries } = require('./queries.users');

const registerUser = async (req, res) => {
    try {
        const { username, password, name, surname, email, phone, address } = req.body;

        console.log("Received user registration data:", {
            username,
            name,
            surname,
            email,
            phone,
            address
        });

        // Validate required fields
        if (!username || !password || !name || !surname || !email) {
            console.log("Registration failed: required fields missing");
            return res.status(400).json({
                message: 'Все поля должны быть заполнены'
            });
        }

        // Check unique fields using prepared statements
        const uniqueChecks = [
            {
                query: userQueries.checkUsername,
                params: [username],
                errorMessage: 'this username is already registered by another user'
            },
            {
                query: userQueries.checkEmail,
                params: [email],
                errorMessage: 'this e-mail is already registered by another user'
            },
            {
                query: userQueries.checkPhone,
                params: [phone],
                errorMessage: 'this phone number is already registered by another user'
            }
        ];

        for (const check of uniqueChecks) {
            const result = await pool.query(check.query, check.params);
            if (result.rows.length > 0) {
                console.log(`Registration failed: ${check.errorMessage}`);
                return res.status(400).json({
                    message: check.errorMessage
                });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Start transaction
        await pool.query('BEGIN');

        try {
            // Insert user using prepared statement
            const userResult = await pool.query(
                userQueries.insertUser,
                [username, hashedPassword, email]
            );

            const userId = userResult.rows[0].user_id;

            // Insert profile using prepared statement
            await pool.query(
                userQueries.insertProfile,
                [userId, name, surname, phone, address]
            );

            await pool.query('COMMIT');

            console.log(`Registration successful: User "${username}" created with ID ${userId}`);

            return res.status(201).json({
                userId,
                username,
                email
            });

        } catch (error) {
            await pool.query('ROLLBACK');
            console.log("Registration failed: Database transaction error");
            throw error;
        }
    } catch (error) {
        console.error('New user registration error:', error);
        return res.status(500).json({
            message: 'New user registration error',
            details: error.message
        });
    }
};

module.exports = registerUser;