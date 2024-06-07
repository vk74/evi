const pool = require('../db/maindb').pool;

async function updateUserProfile(req, res) {
  console.log('Received request for user profile data update');

  // Извлекаем имя пользователя из токена
  const username = req.user.username; 

  console.log('Decoded username:', username);

  if (!username) {
    console.error('Request does not contain username');
    return res.status(400).json({ message: 'Username is required' });
  }

  // Извлекаем данные из тела запроса
  const {
    first_name,
    last_name,
    middle_name,
    gender,
    phone_number,
    email,
    address,
    company_name,
    position
  } = req.body;

  console.log('Данные из тела запроса:', {
    first_name,
    last_name,
    middle_name,
    gender,
    phone_number,
    email,
    address,
    company_name,
    position
  });

  try {
    const query = `
      UPDATE user_profiles
      SET first_name = $1,
          last_name = $2,
          middle_name = $3,
          gender = $4,
          phone_number = $5,
          address = $6,
          company_name = $7,
          position = $8
      FROM users
      WHERE user_profiles.user_id = users.user_id
      AND users.username = $9
      RETURNING *;
    `;

    const values = [
      first_name,
      last_name,
      middle_name,
      gender,
      phone_number,
      address,
      company_name,
      position,
      username
    ];

    console.log('SQL запрос:', query);
    console.log('Значения для SQL запроса:', values);

    const { rows } = await pool.query(query, values);

    if (rows.length > 0) {
      console.log('Данные профиля успешно обновлены:', rows[0]);
      res.json(rows[0]); // Возвращаем обновленные данные профиля
    } else {
      console.error('Пользователь не найден');
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Ошибка при обновлении данных профиля:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = updateUserProfile;