/*
  File version: 1.0.0
  This is a backend file. The file provides database connection pooling and utility functions for interacting with the PostgreSQL database. 
  It includes methods for inserting data into the 'submissions' table and retrieving data from the 'locations' table.
*/

import { Pool } from 'pg';

// Creating a new connection pool for the PostgreSQL database
const pool = new Pool({
  user: 'app_service', // PostgreSQL username
  host: 'localhost', // Host, usually localhost for local development
  database: 'protodb', // Database name
  password: 'P@ssw0rd', // Password for database access
  port: 5432, // Port on which PostgreSQL is running
});

/**
 * Inserts data into the 'submissions' table.
 * @param orgname - Organization name
 * @param region - Region
 * @param location - Location
 * @param checkbox - Checkbox value
 * @param radioOption - Selected radio option
 * @param date - Date of submission
 * @returns The inserted row from the 'submissions' table
 */
export const insertData = async (
  orgname: string,
  region: string,
  location: string,
  checkbox: boolean,
  radioOption: string,
  date: string
): Promise<any> => {
  try {
    const result = await pool.query(
      'INSERT INTO submissions (orgname, region, location, checkbox, radioOption, date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [orgname, region, location, checkbox, radioOption, date]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error inserting data:', error);
    throw error;
  }
};

/**
 * Retrieves all rows from the 'locations' table.
 * @returns An array of rows from the 'locations' table
 */
export const getLocations = async (): Promise<any[]> => {
  try {
    const result = await pool.query('SELECT * FROM locations');
    return result.rows;
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
};