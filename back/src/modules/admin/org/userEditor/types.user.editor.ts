/**
 * types.user.editor.ts - backend file
 * Type definitions for user management functionality on BACKEND.
 *
 * This module defines TypeScript types and interfaces for:
 * - Database models and operations
 * - API request/response interfaces
 * - Shared enums and types
 * - Validation and error handling
 */

/**
 * Shared enums (compatible with frontend)
 */
export enum AccountStatus {
    ACTIVE = 'active',
    DISABLED = 'disabled',
    REQUIRES_USER_ACTION = 'requires_user_action'
}

export enum Gender {
    MALE = 'm',
    FEMALE = 'f',
    NOT_DEFINED = 'n'
}

/**
 * Database interfaces
 * Representing the actual structure in PostgreSQL tables
 */
export interface DbUser {
    user_id: string           // uuid PRIMARY KEY
    username: string          // character varying(50)
    email: string            // character varying(255)
    hashed_password: string   // text
    is_staff: boolean        // boolean
    account_status: AccountStatus // app.account_status
    first_name: string       // character varying(50)
    middle_name: string | null // character varying(50)
    last_name: string        // character varying(50)
    created_at: Date         // timestamp with timezone
    is_active: boolean       // boolean
    mobile_phone_number: string | null  // character varying(15)
    gender: 'm' | 'f' | 'n' | null    // app.gender
}


/**
 * Update user account interface
 */
export interface UpdateUserRequest {
    user_id: string   // Обязательное поле для обновления
    // Поля таблицы app.users
    username?: string
    email?: string
    is_staff?: boolean
    account_status?: AccountStatus
    first_name?: string
    middle_name?: string
    last_name?: string
    
    mobile_phone_number?: string
    gender?: Gender
}

/**
 * API Response interfaces
 * Compatible with frontend expectations
 */
export interface ApiResponse {
    success: boolean
    message: string
}

export interface LoadUserResponse extends ApiResponse {
    data: {
        user: DbUser
        // profile field removed - all data is now in user
    }
}

/**
 * Error handling interfaces
 */
export interface ApiError {
    message: string
    code?: string
    details?: Record<string, unknown>
}

/**
 * Validation interfaces
 */
export interface UserValidationRules {
    username: {
        minLength: number
        maxLength: number
        pattern: RegExp
    }
    email: {
        maxLength: number
        pattern: RegExp
    }
    // Другие правила валидации можно добавить по мере необходимости
}

/**
 * Error handling interfaces
 */
export interface ServiceError {
    code?: string;
    message: string;
    details?: unknown;
}

/**
 * Create user interfaces
 */
export interface CreateUserRequest {
    // Basic user fields
    username: string
    password: string
    email: string
    first_name: string
    last_name: string
    middle_name?: string
    is_staff?: boolean
    account_status?: AccountStatus
  
    // Profile fields (now part of users table)
    gender?: 'm' | 'f' | 'n'
    mobile_phone_number?: string
}

export interface CreateUserResponse extends ApiResponse {
    userId: string
    username: string
    email: string
}

/**
 * Validation interfaces
 */
export interface ValidationError extends ServiceError {
    code: 'VALIDATION_ERROR' | 'REQUIRED_FIELD_ERROR' | string
    field?: string
}

export interface UniqueCheckError extends ServiceError {
    code: 'UNIQUE_CONSTRAINT_ERROR'
    field: string
}

export interface RequiredFieldError extends ValidationError {
    code: 'REQUIRED_FIELD_ERROR'
    field: string
}

/**
 * Remove user from groups interfaces
 */
export interface RemoveUserFromGroupsRequest {
    userId: string
    groupIds: string[]
}

export interface RemoveUserFromGroupsResponse extends ApiResponse {
    data: {
        removedCount: number
        removedGroupIds: string[]
    }
}