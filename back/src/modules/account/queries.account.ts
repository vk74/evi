/**
 * queries.account.ts - backend file
 * version: 1.0.0
 * SQL queries for account module operations.
 * Contains all SQL queries used by account module for user registration and profile management.
 * All queries use parameterized statements to prevent SQL injection.
 */

/**
 * User registration queries
 * Queries for user registration operations
 */
export const userRegistrationQueries = {
  /**
   * Check if username already exists
   * Used to validate uniqueness of username during registration
   */
  checkUsername: {
    text: `
      SELECT user_id 
      FROM app.users 
      WHERE username = $1
    `,
    values: ['username']
  },

  /**
   * Check if email already exists
   * Used to validate uniqueness of email during registration
   */
  checkEmail: {
    text: `
      SELECT user_id 
      FROM app.users 
      WHERE email = $1
    `,
    values: ['email']
  },

  /**
   * Check if phone number already exists
   * Used to validate uniqueness of phone number during registration
   */
  checkPhone: {
    text: `
      SELECT u.user_id 
      FROM app.users u
      WHERE u.mobile_phone_number = $1
    `,
    values: ['mobile_phone_number']
  },

  /**
   * Creates a new user record with basic information
   */
  insertUserWithNames: {
    text: `
      INSERT INTO app.users (
        username, 
        hashed_password, 
        email, 
        first_name, 
        last_name, 
        middle_name, 
        is_staff, 
        account_status,
        gender,
        mobile_phone_number
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING user_id
    `,
    values: [
      'username',      // $1
      'hashed_password', // $2
      'email',         // $3
      'first_name',    // $4
      'last_name',     // $5
      'middle_name',   // $6
      'is_staff',      // $7
      'account_status', // $8
      'gender',        // $9
      'mobile_phone_number' // $10
    ]
  },

};

/**
 * User profile queries
 * Queries for user profile operations
 */
export const userProfileQueries = {
  /**
   * Get user profile by user ID
   * Retrieves complete user profile information
   */
  getUserProfile: {
    text: `
      SELECT 
        user_id,
        username,
        email,
        first_name,
        last_name,
        middle_name,
        account_status,
        gender,
        mobile_phone_number
      FROM app.users
      WHERE user_id = $1
    `,
    values: ['user_id']
  },

  /**
   * Update user basic information
   * Updates user's basic profile data
   */
  updateUserBasicInfo: {
    text: `
      UPDATE app.users 
      SET 
        first_name = $2,
        last_name = $3,
        middle_name = $4,
        email = $5
      WHERE user_id = $1
    `,
    values: [
      'user_id',      // $1
      'first_name',   // $2
      'last_name',    // $3
      'middle_name',  // $4
      'email'         // $5
    ]
  },

  /**
   * Update user profile information
   * Updates user's additional profile data
   */
  updateUserProfile: {
    text: `
      UPDATE app.users 
      SET 
        gender = $2,
        mobile_phone_number = $3
      WHERE user_id = $1
    `,
    values: [
      'user_id',      // $1
      'gender',       // $2
      'mobile_phone_number' // $3
    ]
  },


  /**
   * Get user profile by username
   * Retrieves complete user profile information by username
   */
  getProfile: {
    text: `
      SELECT
        email,
        first_name,
        last_name,
        middle_name,
        mobile_phone_number,
        gender
      FROM app.users
      WHERE username = $1
    `,
    values: ['username']
  },

  /**
   * Update user profile by username
   * Updates user profile information using username
   */
  updateProfile: {
    text: `
      UPDATE app.users
      SET first_name = $1,
          last_name = $2,
          middle_name = $3,
          gender = $4,
          mobile_phone_number = $5
      WHERE username = $6
      RETURNING user_id, 
                first_name, 
                last_name, 
                middle_name, 
                gender, 
                mobile_phone_number
    `,
    values: [
      'first_name',   // $1
      'last_name',    // $2
      'middle_name',  // $3
      'gender',       // $4
      'mobile_phone_number', // $5
      'username'      // $6
    ]
  }
};

/**
 * Export all queries for easy access
 */
export const accountQueries = {
  registration: userRegistrationQueries,
  profile: userProfileQueries
};
