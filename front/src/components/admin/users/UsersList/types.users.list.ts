/**
 * types.users.list.ts
 * Type definitions for the user management frontend module.
 * 
 * This module provides TypeScript types and interfaces for:
 * - User data structure and properties
 * - State management store interfaces
 * - API response types
 * - Pagination and sorting parameters
 * - Error handling types
 * 
 * Used by:
 * - UsersList.vue component
 * - state.users.list.ts store
 * - service.view.all.users.ts service
 */

/**
 * Account status enumeration
 * Matches PostgreSQL app.account_status type
 */
export enum AccountStatus {
    ACTIVE = 'active',
    DISABLED = 'disabled',
    REQUIRES_ACTION = 'requires_user_action'
}

/**
 * Core user interface matching backend data structure
 */
export interface IUser {
    user_id: string;
    username: string;
    email: string;
    is_staff: boolean;
    account_status: AccountStatus;
    first_name: string;
    middle_name: string;
    last_name: string;
}

/**
 * Pagination parameters interface
 */
export interface IPaginationParams {
    page: number;
    itemsPerPage: number;
    totalItems: number;
}

/**
 * Available items per page options
 */
export type ItemsPerPageOption = 10 | 25 | 50 | 100;

/**
 * Sorting parameters interface
 */
export interface ISortParams {
    sortBy: keyof IUser | '';
    sortDesc: boolean;
}

/**
 * API response interface
 */
export interface IUsersResponse {
    users: IUser[];
    total: number;
}

/**
 * JWT token validation interface
 */
export interface IJWTValidation {
    isValid: boolean;
    expiresIn: number;  // Время в секундах до истечения токена
}

/**
 * Интерфейс заголовка таблицы
 */
export interface TableHeader {
    title: string
    key: string
    width?: string
}