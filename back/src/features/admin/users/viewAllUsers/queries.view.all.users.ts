// Типы для SQL запросов
interface SQLQueries {
    getAllUsers: string;
}

// SQL запросы
export const queries: SQLQueries = {
    getAllUsers: `
        SELECT 
            user_id,
            username,
            email,
            is_staff,
            account_status,
            first_name,
            middle_name,
            last_name
        FROM app.users
        ORDER BY created_at DESC
    `
};