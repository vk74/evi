const bcrypt = require('bcrypt');
const { pool } = require('../db/maindb');

const registerUser = async (req, res) => {
    try {
        const { username, password, name, surname, email, phone, address } = req.body;
        const role = 'registered_user';
        const account_status = 'active';

        // Входящие данные
        console.log("Received user registration data:", { 
            username, 
            name, 
            surname, 
            email, 
            phone, 
            address 
        });

        // Проверка обязательных полей
        if (!username || !password || !name || !surname || !email) {
            console.log("Registration failed: required fields missing");
            return res.status(400).json({ message: 'Все поля должны быть заполнены' });
        }

        // Check unique fields
        const uniqueChecks = [
            {
                query: 'SELECT user_id FROM app.users WHERE username = $1',
                params: [username],
                errorMessage: 'this username is already registered by another user'
            },
            {
                query: 'SELECT user_id FROM app.users WHERE email = $1',
                params: [email],
                errorMessage: 'this e-mail is already registered by another user'
            },
            {
                query: 'SELECT user_id FROM app.user_profiles WHERE phone_number = $1',
                params: [phone],
                errorMessage: 'this phone number is already registered by another user'
            }
        ];

        for (const check of uniqueChecks) {
            const result = await pool.query(check.query, check.params);
            if (result.rows.length > 0) {
                console.log(`Registration failed: ${check.errorMessage}`);
                return res.status(400).json({ message: check.errorMessage });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query('BEGIN');

        try {
            const userResult = await pool.query(
                `INSERT INTO app.users (username, hashed_password, email, role, account_status, created_at) 
                 VALUES ($1, $2, $3, $4, $5, NOW()) 
                 RETURNING user_id`,
                [username, hashedPassword, email, role, account_status]
            );

            const userId = userResult.rows[0].user_id;

            await pool.query(
                `INSERT INTO app.user_profiles (user_id, first_name, last_name, phone_number, address) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [userId, name, surname, phone, address]
            );

            await pool.query('COMMIT');

            console.log(`Registration successful: User "${username}" created with ID ${userId}`);
            
            return res.status(201).json({ 
                userId, 
                username, 
                email, 
                role,
                account_status 
            });

        } catch (error) {
            await pool.query('ROLLBACK');
            console.log("Registration failed: Database transaction error");
            console.error(error);
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