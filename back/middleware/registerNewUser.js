const registerNewUser = async (userData) => {
    const { username, password, name, surname, email, phone, address } = userData;
    const role = 'registered_user'; // assign default role to new user
  
    // password hashing
    const hashedPassword = await bcrypt.hash(password, 10);
  
    try {
      // one transaction for data insert into 2 tables
      await pool.query('BEGIN');
  
      // insert into 'users' table
      const userResult = await pool.query(
        'INSERT INTO users (username, hashed_password, email, role, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING user_id',
        [username, hashedPassword, email, role]
      );
      const userId = userResult.rows[0].user_id;
  
      // insert into 'user_profiles' table
      await pool.query(
        'INSERT INTO user_profiles (user_id, first_name, last_name, phone_number, address) VALUES ($1, $2, $3, $4, $5)',
        [userId, name, surname, phone, address]
      );
  
      await pool.query('COMMIT');
  
      return { userId, username, email, role };
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  };

module.exports = registerNewUser;