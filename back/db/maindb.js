// File purpose: connection to MAIN databse and methods to get, post, update data   

const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// create new pool of connections with users database
const pool = new Pool({
  user: 'config_user',    // username in PostgreSQL to perform designated operations
  host: 'localhost',      // host where Postgres is installed
  database: 'maindb',     // DB name for connection
  password: 'P@ssw0rd',   // password for username above
  port: 5432,             // port of PostgreSQL
});

module.exports = {
  pool
};