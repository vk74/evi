/**
 * types.all.users.ts
 * Type definitions for the user management system.
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
  requires_action = 'requires_action'
}

/**
 * User interface
 * Defines the structure of user data returned by the API
 * Contains essential user information excluding sensitive data
 */
export interface IUser {
  user_id: string;        // UUID пользователя
  email: string;          // Email пользователя
  is_staff: boolean;      // Флаг является ли пользователь staff
  account_status: AccountStatus; // Статус аккаунта из схемы app
  first_name: string;     // Имя
  middle_name?: string;   // Отчество (опционально)
  last_name: string;      // Фамилия
}

/**
 * API Response interface
 * Defines the structure of the response from the users endpoint
 * Includes array of users and total count for potential future pagination
 */
export interface IUsersResponse {
  users: IUser[];         // Array of user records
  total: number;         // Total number of users in the system
}

/**
 * Error handling type
 * Defines the structure of error responses
 * Used for consistent error handling across the users endpoint
 */
export type UserError = {
  code: string;           // Error code identifier
  message: string;        // Human-readable error message
  details?: unknown;      // Additional error context (optional)
}