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
      SELECT up.user_id 
      FROM app.user_profiles up
      WHERE up.mobile_phone_number = $1
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
        account_status
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
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
      'account_status' // $8
    ]
  },

  /**
   * Insert user profile without names
   * Creates a user profile record with additional information
   */
  insertAdminUserProfileWithoutNames: {
    text: `
      INSERT INTO app.user_profiles (
        user_id, 
        gender, 
        mobile_phone_number, 
        address, 
        company_name, 
        position
      ) 
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    values: [
      'user_id',      // $1
      'gender',       // $2
      'mobile_phone_number', // $3
      'address',      // $4
      'company_name', // $5
      'position'      // $6
    ]
  }
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
        u.user_id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.middle_name,
        u.account_status,
        up.gender,
        up.mobile_phone_number,
        up.address,
        up.company_name,
        up.position
      FROM app.users u
      LEFT JOIN app.user_profiles up ON u.user_id = up.user_id
      WHERE u.user_id = $1
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
      UPDATE app.user_profiles 
      SET 
        gender = $2,
        mobile_phone_number = $3,
        address = $4,
        company_name = $5,
        position = $6
      WHERE user_id = $1
    `,
    values: [
      'user_id',      // $1
      'gender',       // $2
      'mobile_phone_number', // $3
      'address',      // $4
      'company_name', // $5
      'position'      // $6
    ]
  },

  /**
   * Insert user profile if not exists
   * Creates user profile record if it doesn't exist
   */
  insertUserProfileIfNotExists: {
    text: `
      INSERT INTO app.user_profiles (
        user_id, 
        gender, 
        mobile_phone_number, 
        address, 
        company_name, 
        position
      ) 
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id) DO NOTHING
    `,
    values: [
      'user_id',      // $1
      'gender',       // $2
      'mobile_phone_number', // $3
      'address',      // $4
      'company_name', // $5
      'position'      // $6
    ]
  },

  /**
   * Get user profile by username
   * Retrieves complete user profile information by username
   */
  getProfile: {
    text: `
      SELECT
        u.email,
        u.first_name,
        u.last_name,
        u.middle_name,
        up.mobile_phone_number,
        up.address,
        up.company_name,
        up.position,
        up.gender
        FROM app.users u
        LEFT JOIN app.user_profiles up ON u.user_id = up.user_id
        WHERE u.username = $1
    `,
    values: ['username']
  },

  /**
   * Update user profile by username
   * Updates user profile information using username
   */
  updateProfile: {
    text: `
      WITH user_update AS (
        UPDATE app.users
        SET first_name = $1,
            last_name = $2,
            middle_name = $3
        WHERE username = $9
        RETURNING user_id
      )
      UPDATE app.user_profiles up
      SET gender = $4,
          mobile_phone_number = $5,
          address = $6,
          company_name = $7,
          position = $8
      FROM user_update
      WHERE up.user_id = user_update.user_id
      RETURNING up.user_id, 
                $1 as first_name, 
                $2 as last_name, 
                $3 as middle_name, 
                up.gender, 
                up.mobile_phone_number, 
                up.address, 
                up.company_name, 
                up.position
    `,
    values: [
      'first_name',   // $1
      'last_name',    // $2
      'middle_name',  // $3
      'gender',       // $4
      'mobile_phone_number', // $5
      'address',      // $6
      'company_name', // $7
      'position',     // $8
      'username'      // $9
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
