// File purpose: connection to MAIN databse and integration methods to get, post, update data   

const { Pool } = require('pg');

// Create new database connections pool 
const pool = new Pool({
  user: 'config_user', // имя пользователя в PostgreSQL с правами работы в подключаемой базе данных
  host: 'localhost',     // хост, обычно localhost для локальной разработки
  database: 'main', // название базы данных
  password: 'P@ssw0rd',   // пароль для доступа к базе данных
  port: 5432,                  // порт, на котором работает PostgreSQL
});