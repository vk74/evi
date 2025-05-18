/**
 * types.users.list.ts - backend file
 * version: 1.0.0
 * 
 * Type definitions for the users management sub-module.
 * Defines types and interfaces for user data structure.
 * Provides user account status enumeration matching PostgreSQL app schema.
 * Defines API response interfaces for user data.
 * Contains error handling types for the users endpoint.
 */

/**
 * User account status enumeration
 * Matches PostgreSQL app.account_status type
 */
export enum AccountStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
  PENDING = 'pending',
  BLOCKED = 'blocked'
}

/**
 * Core user interface matching backend data structure
 */
export interface IUser {
  user_id: string;           // UUID пользователя
  username: string;          // Имя пользователя для входа
  email: string;             // Email пользователя
  is_staff: boolean;         // Флаг администратора
  account_status: AccountStatus; // Статус аккаунта
  first_name: string;        // Имя
  middle_name: string | null; // Отчество (может быть null)
  last_name: string;         // Фамилия
  created_at: string;        // Дата создания аккаунта
}

/**
 * API response interface for users list
 */
export interface IUsersResponse {
  users: IUser[];            // Array of user records
  total: number;             // Total number of users in the system
}

/**
 * Error type for user operations
 */
export type UserError = {
  code: string;              // Error code identifier
  message: string;           // Human-readable error message
  details?: unknown;         // Additional error context (optional)
};

/**
 * Interface for SQL queries related to users
 */
export interface SQLQueries {
  getAllUsers: string;       // Query to fetch all users
  deleteSelectedUsers: string; // Query to delete specified users
}

/**
 * Payload type for delete users operation
 */
export interface DeleteUsersPayload {
  userIds: string[];         // Array of user UUIDs to delete
}
