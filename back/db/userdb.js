// File purpose: connection to USERDB databse and run functions related to user accounts  
//Separate DB is required to handle users personal data differently from business data, possibly to have specific procedures for compliance etc.

const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// create new pool of connections with users database
const pool = new Pool({
  user: 'config_user',    // username in PostgreSQL to perform designated operations
  host: 'localhost',      // host where Postgres is installed
  database: 'userdb',     // DB name for connection
  password: 'P@ssw0rd',   // password for username above
  port: 5432,             // port of PostgreSQL
});

module.exports = {
  pool
};