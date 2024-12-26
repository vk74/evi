const bcrypt = require('bcrypt');
const { pool } = require('../db/maindb');
const { userQueries } = require('./queries.users');

const register = async (req, res) => {
    try {
        const {
            username,
            password,
            surname,    // будет last_name в БД
            name,      // будет first_name в БД
            email,
            phone,
            address
        } = req.body;

        // Проверка наличия обязательных полей
        const requiredFields = ['username', 'password', 'surname', 'name', 'email'];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                message: 'missing required fields: ' + missingFields.join(', ')
            });
        }

        // Проверка уникальности username
        const usernameResult = await pool.query(userQueries.checkUsername.text, [username]);
        if (usernameResult.rows.length > 0) {
            return res.status(400).json({
                message: 'this username is already registered by another user'
            });
        }

        // Проверка уникальности email
        const emailResult = await pool.query(userQueries.checkEmail.text, [email]);
        if (emailResult.rows.length > 0) {
            return res.status(400).json({
                message: 'this e-mail is already registered by another user'
            });
        }

        // Проверка уникальности телефона (только если он предоставлен)
        if (phone) {
            const phoneResult = await pool.query(userQueries.checkPhone.text, [phone]);
            if (phoneResult.rows.length > 0) {
                return res.status(400).json({
                    message: 'this phone number is already registered by another user'
                });
            }
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        // Начало транзакции
        await pool.query('BEGIN');

        try {
            // Вставка основных данных пользователя в app.users
            const userResult = await pool.query(
                userQueries.insertUserWithNames.text,
                [
                    username,         // $1
                    hashedPassword,   // $2
                    email,           // $3
                    name,            // $4 (first_name)
                    surname,         // $5 (last_name)
                    null,            // $6 (middle_name)
                    false,           // $7 (is_staff)
                    'active'         // $8 (account_status)
                ]
            );

            const userId = userResult.rows[0].user_id;

            // Вставка дополнительных данных в app.user_profiles
            await pool.query(
                userQueries.insertAdminUserProfileWithoutNames.text,
                [
                    userId,          // $1
                    null,            // $2 (gender)
                    phone || null,   // $3
                    address || null, // $4
                    null,            // $5 (company_name)
                    null            // $6 (position)
                ]
            );

            await pool.query('COMMIT');

            return res.status(201).json({
                message: 'user registration successful',
                userId
            });

        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            message: 'registration failed',
            details: error.message
        });
    }
};

module.exports = register;