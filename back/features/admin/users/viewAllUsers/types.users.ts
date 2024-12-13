// /back/features/admin/users/viewallusers/types/viewallusers.types.ts

// Интерфейс для пользователя из БД
export interface IUserDB {
  user_id: string;
  username: string;
  email: string;
  hashed_password: string;
  is_staff: boolean;
  account_status: string; // изменено с enum на string, так как не знаем точных значений
  first_name: string;
  middle_name: string | null;
  last_name: string;
  created_at: Date;
}

// Интерфейс для ответа API (без sensitive данных)
export interface IUserResponse {
  id: string;
  username: string;
  email: string;
  isStaff: boolean;
  accountStatus: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
}

// Типы для ответов API
export type UsersSuccessResponse = {
  users: IUserResponse[];
}

export type UserError = {
  code: string;
  message: string;
  details?: unknown;
}

export type UsersErrorResponse = {
  error: UserError;
}

export type UsersApiResponse = UsersSuccessResponse | UsersErrorResponse;