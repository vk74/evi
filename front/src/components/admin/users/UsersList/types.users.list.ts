/**
 * Types.users.list.ts
 * FRONTEND type definitions for the user management frontend module.
 * Version: 1.0.0
 * 
 * This module provides TypeScript types and interfaces for:
 * - User data structure and properties
 * - State management store interfaces
 * - API request and response types
 * - Pagination, sorting and filtering parameters
 * - Cache structure
 * 
 * Used by:
 * - UsersList.vue component
 * - State.users.list.ts store
 * - Service.fetch.users.ts service
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
}

/**
 * Available items per page options
 */
export type ItemsPerPageOption = 25 | 50 | 100;

/**
 * Sorting parameters interface
 */
export interface ISortParams {
    sortBy: string;
    sortDesc: boolean;
}

/**
 * Search parameters
 */
export interface ISearchParams {
    search: string;
}

/**
 * Combined query parameters for API requests
 */
export interface IFetchUsersParams extends IPaginationParams, ISortParams, ISearchParams {
    forceRefresh?: boolean;
}

/**
 * API response interface
 */
export interface IUsersResponse {
    users: IUser[];
    total: number;
}

/**
 * Cache entry structure
 */
export interface CacheEntry {
    users: IUser[];
    totalItems: number;
    timestamp: number;
    query: IFetchUsersParams;
}

/**
 * Table header interface
 */
export interface TableHeader {
    title: string;
    key: string;
    width?: string;
    sortable?: boolean;
}

/**
 * API error response
 */
export interface IApiError {
    code: string;
    message: string;
    details?: any;
}

/**
 * Cache statistics
 */
export interface CacheStats {
    size: number;
    hits: number;
    misses: number;
    hitRatio: number;
}
