const bcrypt = require('bcrypt');
const pool = require('../db/maindb').pool;

const changeUserPassword = async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  if (!username || !currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'Username, current password and new password are required.' });
  }

  console.log('Начало процесса смены пароля');
  console.log('username:', username);
  console.log('currentPassword:', currentPassword);
  console.log('newPassword:', newPassword);

  // Проверка длины пароля
  if (newPassword.length < 8 || newPassword.length > 40) {
    console.log('Ошибка: Длина пароля должна быть от 8 до 40 символов.');
    return res.status(400).json({ success: false, error: 'Password length must be between 8 and 40 characters.' });
  }

  // Проверка регулярного выражения
  const regex = /^[a-zA-Zа-яА-Я0-9\p{P}]+$/u;
  if (!regex.test(newPassword)) {
    console.log('Ошибка: Пароль должен содержать только буквы, цифры и знаки препинания.');
    return res.status(400).json({ success: false, error: 'Password must contain only letters, numbers, and punctuation marks.' });
  }

  try {
    console.log('Начало проверки текущего пароля');
    // Получение текущего хешированного пароля из базы данных
    const userResult = await pool.query('SELECT hashed_password FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      console.log(`Пользователь ${username} не найден.`);
      return res.status(404).json({ success: false, error: 'Пользователь не найден.' });
    }

    const hashedCurrentPassword = userResult.rows[0].hashed_password;
    const isMatch = await bcrypt.compare(currentPassword, hashedCurrentPassword);
    if (!isMatch) {
      console.log('Ошибка: Текущий пароль неверный.');
      return res.status(400).json({ success: false, error: 'Текущий пароль неверный.' });
    }

    console.log('Начало хеширования нового пароля');
    // Хеширование нового пароля
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);
    console.log('Хеширование завершено');

    // Обновление пароля пользователя в базе данных
    console.log('Начало обновления пароля в базе данных');
    const updateResult = await pool.query(
      'UPDATE users SET hashed_password = $1 WHERE username = $2 RETURNING username',
      [hashedNewPassword, username]
    );

    console.log('Результат обновления:', updateResult);

    if (updateResult.rows.length > 0) {
      console.log(`Пароль пользователя ${username} успешно обновлен.`);
      return res.status(200).json({ success: true, username: updateResult.rows[0].username });
    } else {
      console.log(`Пользователь ${username} не найден.`);
      return res.status(404).json({ success: false, error: 'Пользователь не найден.' });
    }
  } catch (error) {
    console.error('Ошибка при смене пароля:', error.message);
    return res.status(500).json({ success: false, error: 'Ошибка при смене пароля: ' + error.message });
  }
};

module.exports = changeUserPassword;