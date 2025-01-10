/**
 * queries.user.editor.ts
 * SQL queries for user editor functionality
 */

interface SQLQueries {
    getUserById: string;
    getUserProfileById: string;
}

export const queries: SQLQueries = {
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
    `
};