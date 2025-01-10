/**
 * types.user.editor.ts
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
    MALE = 'male',
    FEMALE = 'female'
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
}

export interface DbUserProfile {
    profile_id: string       // uuid PRIMARY KEY
    user_id: string         // uuid FOREIGN KEY
    mobile_phone_number: string | null  // character varying(15)
    address: string | null   // text
    company_name: string | null // character varying(255)
    position: string | null  // character varying(255)
    gender: Gender | null    // app.gender
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
        profile: DbUserProfile
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