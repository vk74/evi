// Типы для SQL запросов queries.view.all.users.ts
interface SQLQueries {
    getAllUsers: string;
    deleteSelectedUsers: string; 
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
    `,
    
    deleteSelectedUsers: `
      DELETE FROM app.users 
      WHERE user_id = ANY($1::uuid[])
      RETURNING user_id
    `
  };

