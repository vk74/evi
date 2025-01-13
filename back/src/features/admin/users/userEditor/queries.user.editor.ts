/**
 * queries.user.editor.ts
 * SQL queries for user editor functionality
 */

interface SQLQueries {
    getUserById: string;
    getUserProfileById: string;
    updateUserById: string;
    updateUserProfileById: string;
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
    `,

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
    `

};



