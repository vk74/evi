/*
  File version: 1.1.0
  This is a backend file. The file provides connection to the main database (maindb) and exports a connection pool.
  FRONTEND/BACKEND note: Backend file: maindb.ts. Purpose: Initialize PG pool using env-driven configuration.
  Logic: Prefer DATABASE_URL if provided; otherwise use PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE. Optional SSL via PGSSL/PGSSLMODE.
*/

import { Pool, PoolConfig } from 'pg';

// Optional SSL config helper
function getSslConfig(): boolean | { rejectUnauthorized: boolean } | undefined {
	const sslMode = process.env.PGSSL || process.env.PGSSLMODE;
	if (!sslMode) return undefined;
	// Accept common truthy values
	const isRequire = ['require', 'true', '1'].includes(String(sslMode).toLowerCase());
	if (!isRequire) return undefined;
	const rejectUnauthorized = String(process.env.PGSSLREJECTUNAUTHORIZED || 'true').toLowerCase() !== 'false';
	return { rejectUnauthorized };
}

// Prefer full DATABASE_URL if provided, else build from individual vars
const connectionString = process.env.DATABASE_URL;

let pool: Pool;
if (connectionString) {
	pool = new Pool({
		connectionString,
		ssl: getSslConfig()
	});
} else {
	const poolConfig: PoolConfig = {
		user: process.env.PGUSER || 'app_service',
		host: process.env.PGHOST || 'localhost',
		database: process.env.PGDATABASE || 'maindb',
		password: process.env.PGPASSWORD || 'P@ssw0rd',
		port: parseInt(process.env.PGPORT || '5432', 10),
		ssl: getSslConfig()
	};
	pool = new Pool(poolConfig);
}

// Export the pool for use in other modules using ES modules syntax
export { pool };