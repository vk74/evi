const bcrypt = require('bcrypt');
const { pool } = require('../db/maindb'); // Import pool connection for the user database

const registerNewUser = async (req, res) => {
  try {
    const { username, password, name, surname, email, phone, address } = req.body;
    const role = 'registered_user'; // Assign default role to new user

    // Debug output
    console.log("Received data:", { username, password, name, surname, email, phone, address });

    // Validate required fields
    if (!username || !password || !name || !surname || !email) {
      return res.status(400).json({ message: 'Все поля должны быть заполнены' });
    }

    // Check if email is already in use
    const emailCheckResult = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (emailCheckResult.rows.length > 0) {
      console.error('New user registration process error: the e-mail is already registered by another user');
      return res.status(400).json({ message: 'this e-mail is already registered by another user' });
    }

    // Check if phone number is already in use
    const phoneCheckResult = await pool.query('SELECT user_id FROM user_profiles WHERE phone_number = $1', [phone]);
    if (phoneCheckResult.rows.length > 0) {
      console.error('New user registration process error: the phone number is already registered by another user');
      return res.status(400).json({ message: 'this phone number is already registered by another user' });
    }

    // Password hashing
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Hashed password:", hashedPassword);

    // One transaction for data insert into 2 tables
    await pool.query('BEGIN');

    // Insert into 'users' table
    const userResult = await pool.query(
      'INSERT INTO users (username, hashed_password, email, role, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING user_id',
      [username, hashedPassword, email, role]
    );
    const userId = userResult.rows[0].user_id;

    // Insert into 'user_profiles' table
    await pool.query(
      'INSERT INTO user_profiles (user_id, first_name, last_name, phone_number, address) VALUES ($1, $2, $3, $4, $5)',
      [userId, name, surname, phone, address]
    );

    await pool.query('COMMIT');

    return res.status(201).json({ userId, username, email, role });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('New user registration error:', error);
    return res.status(500).json({ message: 'New user registration error:' });
  }
};

module.exports = registerNewUser;