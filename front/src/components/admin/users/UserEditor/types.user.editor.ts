/**
 * types.user.editor.ts
 * Type definitions for the user editor component.
 * 
 * This module defines TypeScript types and interfaces for:
 * - Component props and modes
 * - User account and profile data structures
 * - Form states and validation
 * - API interfaces
 */

/**
 * Editor mode discriminated union
 */
export type CreateMode = {
    mode: 'create'
}

export type EditMode = {
    mode: 'edit'
    userId: string
}

export type EditorMode = CreateMode | EditMode

/**
 * Account status enumeration
 */
export enum AccountStatus {
    ACTIVE = 'active',
    DISABLED = 'disabled',
    REQUIRES_USER_ACTION = 'requires_user_action'
}

/**
 * Gender enumeration
 */
export enum Gender {
    MALE = 'male',
    FEMALE = 'female'
}

/**
 * Интерфейс базовой информации пользователя (таблица app.users)
 */
export interface IUserAccount {
    user_id?: string               // uuid, опционален т.к. генерируется при создании
    username: string               // character varying(50)
    email: string                  // character varying(255)
    password: string               // text (хранится как hashed_password)
    passwordConfirm?: string       // только для валидации формы
    is_staff: boolean             // boolean
    account_status: AccountStatus  // app.account_status
    first_name: string            // character varying(50)
    middle_name: string | null    // character varying(50)
    last_name: string             // character varying(50)
    created_at?: Date             // timestamp with timezone
}

/**
 * Интерфейс профиля пользователя (таблица app.user_profiles)
 */
export interface IUserProfile {
    profile_id?: string           // uuid
    user_id?: string             // uuid связь с app.users
    phone_number: string | null   // character varying(15)
    address: string | null        // text
    company_name: string | null   // character varying(255)
    position: string | null       // character varying(255)
    gender: Gender | null         // app.gender
    reserve1?: string | null      // character varying(50)
    reserve2?: string | null      // character varying(50) 
    reserve3?: string | null      // character varying(50)
}

/**
 * Form validation states interface
 */
export interface IFormValidation {
    isAccountFormValid: boolean
    isProfileFormValid: boolean
    hasInteracted: boolean
    showRequiredFieldsWarning: boolean
    isSubmitting: boolean
}

/**
 * Section definition
 */
export interface ISection {
    id: 'account' | 'profile'
    title: string
}

/**
 * API request interface
 */
export interface ICreateUserRequest {
    username: string
    email: string
    password: string
    account_status: AccountStatus
    is_staff: boolean
    first_name: string
    last_name: string
    middle_name: string | null
    gender: 'm' | 'f' | null
    phone_number: string | null
    address: string | null
    company_name: string | null
    position: string | null
}

/**
 * API response interface
 */
export interface IApiResponse {
    success: boolean
    message?: string
    userId?: string
}

// Результат валидации отдельного поля
export interface IValidationResult {
    isValid: boolean
    errors: string[]
}

// Результат валидации формы целиком
export interface IFormValidationResult {
    isValid: boolean
    fieldResults: {
        [key: string]: IValidationResult
    }
}

// Результат проверки обязательных полей
export interface IRequiredFieldsResult {
    isComplete: boolean
    emptyFields: string[]
}

/**
 * Validation result interface for editor
 */
export interface IEditorValidationResult {
    requiredFieldsComplete: boolean
    userInputsValidated: boolean
    details: {
        requiredFields: IRequiredFieldsResult
        account: IFormValidationResult
        profile: IFormValidationResult
    }
}