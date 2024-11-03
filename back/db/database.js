const { Pool } = require('pg');

// Создание нового пула соединений с базой данных
const pool = new Pool({
  user: 'config_user', // ваше имя пользователя для PostgreSQL
  host: 'localhost',     // хост, обычно localhost для локальной разработки
  database: 'protodb', // название вашей базы данных
  password: 'P@ssw0rd',   // пароль для доступа к базе данных
  port: 5432,                  // порт, на котором работает PostgreSQL
});

// Функция для вставки данных в таблицу
const insertData = async (orgname, region, location, checkbox, radioOption, date) => {
  try {
    const result = await pool.query(
      'INSERT INTO submissions (orgname, region, location, checkbox, radioOption, date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [orgname, region, location, checkbox, radioOption, date]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Ошибка при вставке данных:', error);
    throw error;
  }
};

// Функция для получения списка локаций
const getLocations = async () => {
  const result = await pool.query('SELECT * FROM locations'); // Запрос к таблице locations
  return result.rows;
};

module.exports = {
  insertData,
  getLocations,
};