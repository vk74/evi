/*
  File version: 1.0.0
  This is a backend file. The file provides connection to the main database (maindb) and exports a connection pool.
  It is used throughout the application for database operations including user authentication, profile management,
  and service-related queries.
*/

import { Pool, PoolConfig } from 'pg';

// Configuration for the database connection pool
const poolConfig: PoolConfig = {
  user: 'app_service',    // username in PostgreSQL to perform predefined operations
  host: 'localhost',      // host where Postgres is installed
  database: 'maindb',     // DB name for connection
  password: 'P@ssw0rd',   // password for username above
  port: 5432,             // port of PostgreSQL
};

// Create new pool of connections with the main database
const pool = new Pool(poolConfig);

// Export the pool for use in other modules
export { pool };

// For compatibility with CommonJS require() syntax
export default { pool };