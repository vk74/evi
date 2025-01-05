// admin.users.usereditor.newuser.js
// File purpose: Middleware for handling new user creation from admin panel
// Processes user account data and profile information, validates input, and saves to database

const bcrypt = require('bcrypt');
const { pool } = require('../../../../db/maindb');
const { userQueries } = require('../../../../middleware/queries.users');

const adminNewUser = async (req, res) => {
    try {
        console.log('Starting new user creation from admin panel');
        
        const { 
            username, password, email, first_name, last_name,
            middle_name, gender, phone_number, address, 
            company_name, position, is_staff, account_status
        } = req.body;

        console.log('Received data for new user:', {
            username,
            email,
            phone_number: phone_number || 'not provided'
        });

        // Валидация обязательных полей
        const requiredFields = {
            username: 'название учетной записи',
            password: 'пароль',
            email: 'e-mail',
            first_name: 'имя',
            last_name: 'фамилия'
        };

        const missingFields = Object.entries(requiredFields)
            .filter(([field]) => !req.body[field])
            .map(([, label]) => label);

        if (missingFields.length > 0) {
            console.log('Required fields validation failed. Missing fields:', missingFields);
            throw {
                type: 'validation',
                message: 'ошибка создания учетной записи: отсутствуют обязательные поля'
            };
        }

        // Валидация пароля
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,40}$/;
        if (!passwordRegex.test(password)) {
            console.log('Password validation failed');
            return res.status(400).json({
                message: 'пароль должен содержать буквы и цифры, длина от 8 до 40 символов'
            });
        }

        // Начало проверок уникальности
        console.log('Starting uniqueness checks for user:', {
            username,
            email,
            phone_number: phone_number || 'not provided'
        });

        console.log('Using SQL queries:', {
            username_query: userQueries.checkUsername.text,
            email_query: userQueries.checkEmail.text,
            phone_query: userQueries.checkPhone.text
        });

        // Проверка уникальности полей
        const uniqueChecks = [
            {
                query: userQueries.checkUsername.text,
                params: [username],
                field: 'название учетной записи',
                message: 'уже используется другим пользователем'
            },
            {
                query: userQueries.checkEmail.text,
                params: [email],
                field: 'e-mail',
                message: 'уже используется другим пользователем'
            }
        ];

        // Добавляем проверку телефона только если он указан
        if (phone_number) {
            console.log('Adding phone number check');
            uniqueChecks.push({
                query: userQueries.checkPhone.text,
                params: [phone_number],
                field: 'номер телефона',
                message: 'уже используется другим пользователем'
            });
        }

        // Выполняем все проверки уникальности
        for (const check of uniqueChecks) {
            console.log(`Running uniqueness check for ${check.field}`, {
                query: check.query,
                params: check.params
            });
            
            const result = await pool.query(check.query, check.params);
            console.log(`Check result for ${check.field}:`, {
                rowCount: result.rows.length,
                rows: result.rows
            });

            if (result.rows.length > 0) {
                console.log(`Uniqueness check failed for ${check.field}`);
                return res.status(400).json({
                    message: `${check.field} ${check.message}`
                });
            }
            console.log(`${check.field} is unique`);
        }

        // Если все проверки пройдены, переходим к хешированию пароля
        console.log('All uniqueness checks passed, proceeding to password hashing');
        const hashedPassword = await bcrypt.hash(password, 10);

        // Начало транзакции
        console.log('Starting database transaction');
        await pool.query('BEGIN');

        try {
            // Сохранение данных пользователя (включая поля имени и статус)
            const userResult = await pool.query(
                userQueries.insertUserWithNames.text,
                [
                    username,        // $1
                    hashedPassword,  // $2
                    email,          // $3
                    first_name,     // $4
                    last_name,      // $5
                    middle_name,    // $6
                    is_staff,       // $7
                    account_status  // $8
                ]
            );
            const userId = userResult.rows[0].user_id;
            console.log(`Created user account with ID: ${userId}`);

            // Сохранение профиля пользователя (без полей имени)
            await pool.query(
                userQueries.insertAdminUserProfileWithoutNames.text,
                [
                    userId,         // $1
                    gender,         // $2
                    phone_number,   // $3
                    address,        // $4
                    company_name,   // $5
                    position        // $6
                ]
            );
            console.log('Created full user profile from admin panel');

            await pool.query('COMMIT');
            console.log('Transaction committed successfully');

            const successResponse = {
                success: true,
                message: 'учетная запись пользователя создана',
                userId,
                username,
                email
            };
            console.log('Sending success response to frontend:', successResponse);
            return res.status(201).json(successResponse);

        } catch (error) {
            await pool.query('ROLLBACK');
            console.log('Transaction rolled back due to error:', error);
            throw error;
        }

    } catch (error) {
        console.error('Admin new user creation error:', error);
        
        if (error.type === 'validation') {
            return res.status(400).json({
                message: error.message
            });
        }
        
        return res.status(500).json({
            message: 'ошибка создания учетной записи',
            details: error.message
        });
    }
};

module.exports = adminNewUser;