/**
 * @file userType.ts
 * 
 * Определение типов и интерфейсов для работы с данными пользователей.
 * Используется в компонентах управления пользователями и соответствующих сервисах.
 * 
 * Основные типы:
 * - User: структура данных пользователя из БД
 * - AccountStatus: возможные статусы учетной записи
 */

/** Допустимые значения статуса учетной записи пользователя */
export type AccountStatus = 'active' | 'disabled' | 'requires_action';

/** 
 * Интерфейс, описывающий структуру данных пользователя
 * @property user_id - Уникальный идентификатор пользователя (UUID)
 * @property username - Логин пользователя
 * @property email - Email пользователя
 * @property is_staff - Флаг администратора
 * @property account_status - Текущий статус учетной записи
 * @property created_at - Дата и время создания учетной записи
 */
export interface User {
  user_id: string;
  username: string;
  email: string;
  is_staff: boolean;
  account_status: AccountStatus;
  created_at: string;
}