const express = require('express');
const router = express.Router();
const pool = require('../db/maindb'); // Подкорректируйте путь к вашему файлу подключения к базе данных

// Middleware для получения профиля пользователя по имени пользователя
router.get('/', async (req, res) => {
  const username = req.user.username; // Предполагается, что имя пользователя хранится в объекте запроса

  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }

  try {
    const query = `
      SELECT
        u.email,
        up.first_name,
        up.last_name,
        up.middle_name,
        up.phone_number,
        up.address,
        up.company_name,
        up.position,
        up.gender
      FROM users u
      JOIN user_profiles up ON u.user_id = up.user_id
      WHERE u.username = $1;
    `;

    const { rows } = await pool.query(query, [username]);
    if (rows.length > 0) {
      console.log('Данные профиля найдены:', rows[0]);
      res.json(rows[0]); // Возвращаем данные профиля
    } else {
      console.log('Пользователь не найден');
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;