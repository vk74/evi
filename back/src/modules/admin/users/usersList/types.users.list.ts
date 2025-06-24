/**
 * @file protoTypes.users.list.ts
 * Version: 1.0.0
 * BACKEND type definitions for the prototype user management sub-module with server-side processing.
 * 
 * Functionality:
 * - Defines types and interfaces for user data structure
 * - Provides account status enumeration matching PostgreSQL app schema
 * - Defines API response interfaces for user data
 * - Contains error handling types for the users endpoint
 * - Defines query parameter types for fetching users
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

/**
 * Core user interface matching backend data structure
 */
export interface IUser {
  user_id: string;        // UUID пользователя
  username: string;
  email: string;          // Email пользователя
  is_staff: boolean;      // Флаг является ли пользователь staff
  account_status: AccountStatus; // Статус аккаунта из схемы app
  first_name: string;     // Имя
  middle_name?: string;   // Отчество (опционально)
  last_name: string;      // Фамилия
}

/**
 * API response interface for users list
 */
export interface IUsersResponse {
  users: IUser[];         // Array of user records
  total: number;          // Total number of users matching query
}

/**
 * Frontend query parameters interface
 */
export interface IUsersFetchParams {
  page: number;           // Current page (1-based)
  itemsPerPage: number;   // Items per page (limit)
  search?: string;        // Search query string
  sortBy?: string;        // Field to sort by
  sortDesc?: boolean;     // Sort direction
  forceRefresh?: boolean; // Flag to force cache refresh
}

/**
 * Error type for API responses
 */
export type UserError = {
  code: string;           // Error code identifier
  message: string;        // Human-readable error message
  details?: unknown;      // Additional error context (optional)
}

/**
 * Interface for delete users request
 */
export interface IDeleteUsersRequest {
  userIds: string[];      // Array of UUIDs to delete
}

/**
 * Interface for delete users response
 */
export interface IDeleteUsersResponse {
  success: boolean;
  deletedCount: number;   // Number of successfully deleted records
}

/**
 * Database column names for sorting
 */
export type SortableColumn = 'user_id' | 'username' | 'email' | 'first_name' | 
                            'last_name' | 'is_staff' | 'account_status' | 'created_at';

/**
 * Valid search fields
 */
export type SearchableField = 'user_id' | 'username' | 'email' | 'first_name' | 'last_name';
