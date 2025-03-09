/**
 * queries.change.password.ts
 * SQL queries for password-related operations.
 * Contains queries for both self change and admin reset scenarios.
 */

// SQL queries for password change operations
export const passwordChangeQueries = {
  getUserPasswordByUuid: `
    SELECT hashed_password, username
    FROM users
    WHERE user_id = $1
  `,

  updatePasswordByUuid: `
    UPDATE users
    SET hashed_password = $1
    WHERE user_id = $2
    RETURNING user_id, username
  `,

  checkUserExists: `
    SELECT EXISTS (
      SELECT 1 FROM users 
      WHERE user_id = $1
    ) as exists
  `,

  validateUserIdentity: `
    SELECT EXISTS (
      SELECT 1 FROM users 
      WHERE user_id = $1 AND username = $2
    ) as exists
  `
};