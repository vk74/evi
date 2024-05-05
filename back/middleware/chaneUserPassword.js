const bcrypt = require('bcrypt');
// const userdb = require('../db/userdb');
const pool = require('../db/userdb').pool;

const changeUserPassword = async ({ username, newPassword }) => {
    try {
      // хеширование нового пароля
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
  
      // обновление пароля пользователя в базе данных
      const updateResult = await pool.query(
        'UPDATE users SET hashed_password = $1 WHERE username = $2 RETURNING username',
        [hashedPassword, username]
      );
  
      if (updateResult.rows.length > 0) {
        console.log(`Пароль пользователя ${username} успешно обновлен.`);
        return { success: true, username: updateResult.rows[0].username }; // возвращаем первую строку с username
      } else {
        console.log(`Пользователь ${username} не найден.`);
        return { success: false, error: 'Пользователь не найден.' };
      }
    } catch (error) {
      console.error('Ошибка при смене пароля:', error.message);
      throw new Error('Ошибка при смене пароля: ' + error.message);
    }
  };

module.exports = changeUserPassword;