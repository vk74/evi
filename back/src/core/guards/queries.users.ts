/**
 * queries.users.ts - version 1.0.03
 * BACKEND predefined SQL queries for user operations
 * 
 * Contains prepared SQL queries for:
 * - User registration and validation
 * - Authentication
 * - Profile management
 * - Password management
 */

/**
 * Interface for SQL query definition
 */
interface SqlQuery {
  /** Name identifier for the query */
  name: string;
  /** SQL query text with parameter placeholders */
  text: string;
}

/**
 * Interface for all user-related queries
 */
interface UserQueriesCollection {
  // Registration queries
  checkUsername: SqlQuery;
  checkEmail: SqlQuery;
  checkPhone: SqlQuery;
  insertUser: SqlQuery;
  insertProfile: SqlQuery;
  insertAdminUserProfile: SqlQuery;
  insertUserWithNames: SqlQuery;
  insertAdminUserProfileWithoutNames: SqlQuery;
  
  // Authentication queries
  getUserForToken: SqlQuery;
  getUserPassword: SqlQuery;
  getUserStatus: SqlQuery;
  
  // Profile queries
  getProfile: SqlQuery;
  updateProfile: SqlQuery;
  
  // Password management
  updatePassword: SqlQuery;
  
  // Index signature for string-based access
  [queryName: string]: SqlQuery;
}

/**
 * Collection of predefined SQL queries for user operations
 */
export const userQueries: UserQueriesCollection = {
    // Регистрация
    checkUsername: {
        name: 'check-username',
        text: 'SELECT user_id FROM app.users WHERE username = $1'
    },
    checkEmail: {
        name: 'check-email',
        text: 'SELECT user_id FROM app.users WHERE email = $1'
    },
    checkPhone: {
        name: 'check-phone',
        text: 'SELECT user_id FROM app.user_profiles WHERE mobile_phone_number = $1'
    },
    // вставка данных со страницы самостоятельной регистрации пользователя (не все поля, часть данных пользователь может самостоятельно внести у себя в профиле, или их добавит админ)
    insertUser: {
        name: 'insert-user',
        text: `INSERT INTO app.users
            (username, hashed_password, email, created_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            RETURNING user_id`
    },
    // вставка данных со страницы самостоятельной регистрации пользователя (не все поля, часть данных пользователь может самостоятельно внести у себя в профиле, или их добавит админ)
    insertProfile: {
        name: 'insert-user-profile',
        text: `INSERT INTO app.user_profiles
            (user_id, first_name, last_name, mobile_phone_number, address)
            VALUES ($1, $2, $3, $4, $5)`
    },
    // вставка данных со страницы регистрации пользователя в административном модуле (все поля)
    insertAdminUserProfile: {
        name: 'insert-admin-user-profile',
        text: `INSERT INTO app.user_profiles
            (user_id, first_name, last_name, middle_name, gender, 
            mobile_phone_number, address, company_name, position)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
    },
    // Аутентификация
    getUserForToken: {
        name: 'get-user-for-token',
        text: `
            SELECT 
                u.user_id,
                u.username,
                u.role,
                u.account_status,
                up.first_name,
                up.last_name
            FROM app.users u
            LEFT JOIN app.user_profiles up ON u.user_id = up.user_id
            WHERE u.username = $1
        `
    },
    getUserPassword: {
        name: 'get-user-password',
        text: 'SELECT user_id, hashed_password FROM app.users WHERE username = $1'
    },
    getUserStatus: {
        name: 'get-user-status',
        text: 'SELECT account_status FROM app.users WHERE username = $1'
    },
    // Профиль пользователя
    getProfile: {
        name: 'get-user-profile',
        text: `SELECT
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
            WHERE u.username = $1`
    },
    updateProfile: {
        name: 'update-user-profile',
        text: `WITH user_update AS (
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
                        up.position`
    },
    // Смена пароля
    updatePassword: {
        name: 'update-user-password',
        text: `UPDATE app.users
            SET hashed_password = $1
            WHERE username = $2
            RETURNING username`
    },
    // Новый запрос для вставки пользователя с полями имени
    insertUserWithNames: {
        name: 'insert-user-with-names',
        text: `INSERT INTO app.users
            (username, hashed_password, email, first_name, last_name, middle_name, is_staff, account_status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
            RETURNING user_id`
    },
    
    insertAdminUserProfileWithoutNames: {
        name: 'insert-admin-user-profile-without-names',
        text: `INSERT INTO app.user_profiles
            (user_id, gender, mobile_phone_number, address, company_name, position)
            VALUES ($1, $2, $3, $4, $5, $6)`
    }
};