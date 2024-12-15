/**
 * types.view.all.users.ts
 * Type definitions for the user management sub-module.
 * 
 * Functionality:
 * - Defines types and interfaces for user data structure
 * - Provides account status enumeration matching PostgreSQL app schema
 * - Defines API response interfaces for user data
 * - Contains error handling types for the users endpoint
 */

/**
 * Account status enumeration
 * Matches PostgreSQL app.account_status type
 * Available statuses:
 * - active: user can access the system
 * - disabled: user access is temporarily suspended
 * - requires_action: user needs to complete additional steps
 */
export enum AccountStatus {
  active = 'active',
  disabled = 'disabled',
  requires_user_action = 'requires_user_action'
}

export interface IUser {
  user_id: string;        // UUID пользователя
  user_name: string;
  email: string;          // Email пользователя
  is_staff: boolean;      // Флаг является ли пользователь staff
  account_status: AccountStatus; // Статус аккаунта из схемы app
  first_name: string;     // Имя
  middle_name?: string;   // Отчество (опционально)
  last_name: string;      // Фамилия
}

export interface IUsersResponse {
  users: IUser[];         // Array of user records
  total: number;         // Total number of users in the system
}

export type UserError = {
  code: string;           // Error code identifier
  message: string;        // Human-readable error message
  details?: unknown;      // Additional error context (optional)
}