/**
 * queries.user.editor.ts
 * SQL queries for user editor functionality in admin panel.
 * Includes queries for CRUD operations and validation checks.
 */

// Query type definitions
interface SQLQuery {
    name: string;
    text: string;
  }
  
  interface UserEditorQueries {
    // Get user data
    getUserById: string;
    getUserProfileById: string;
    
    // Update user data
    updateUserById: string;
    updateUserProfileById: string;
    
    // Create user validation
    checkUsername: SQLQuery;
    checkEmail: SQLQuery;
    checkPhone: SQLQuery;
    
    // Create user operations
    insertUser: SQLQuery;
    insertUserProfile: SQLQuery;
  }
  
  // Query definitions
  export const queries: UserEditorQueries = {
    // Get user data
    getUserById: `
      SELECT
        user_id,
        username,
        email,
        is_staff,
        account_status,
        first_name,
        middle_name,
        last_name,
        created_at
      FROM app.users
      WHERE user_id = $1::uuid
    `,
    
    getUserProfileById: `
      SELECT
        profile_id,
        user_id,
        mobile_phone_number,
        address,
        company_name,
        position,
        gender
      FROM app.user_profiles
      WHERE user_id = $1::uuid
    `,
  
    // Update queries
    updateUserById: `
      UPDATE app.users
      SET
        username = COALESCE($2, username),
        email = COALESCE($3, email),
        is_staff = COALESCE($4, is_staff),
        account_status = COALESCE($5, account_status),
        first_name = COALESCE($6, first_name),
        middle_name = COALESCE($7, middle_name),
        last_name = COALESCE($8, last_name)
      WHERE user_id = $1::uuid
      RETURNING *
    `,
  
    updateUserProfileById: `
      UPDATE app.user_profiles
      SET
        mobile_phone_number = COALESCE($2, mobile_phone_number),
        address = COALESCE($3, address),
        company_name = COALESCE($4, company_name),
        position = COALESCE($5, position),
        gender = COALESCE($6, gender)
      WHERE user_id = $1::uuid
      RETURNING *
    `,
  
    // Validation queries
    checkUsername: {
      name: 'check-username',
      text: `
        SELECT user_id 
        FROM app.users 
        WHERE username = $1
      `
    },
  
    checkEmail: {
      name: 'check-email',
      text: `
        SELECT user_id 
        FROM app.users 
        WHERE email = $1
      `
    },
  
    checkPhone: {
      name: 'check-phone',
      text: `
        SELECT user_id 
        FROM app.user_profiles 
        WHERE mobile_phone_number = $1
      `
    },
  
    // Insert queries
    insertUser: {
      name: 'insert-user',
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
          created_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP
        )
        RETURNING user_id
      `
    },
  
    insertUserProfile: {
      name: 'insert-user-profile',
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
      `
    }
  };