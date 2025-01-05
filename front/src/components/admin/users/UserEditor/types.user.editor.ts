/**
 * types.user.editor.ts
 * Type definitions for the user editor component.
 *
 * This module defines TypeScript types and interfaces for:
 * - Component modes and states
 * - User account and profile data structures
 * - Form validation
 * - API interfaces
 */

/**
 * Перечисления
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
 * Интерфейс базовой информации пользователя (таблица app.users)
 */
export interface IUserAccount {
  user_id?: string                 // uuid, опционален т.к. генерируется при создании
  username: string                 // character varying(50)
  email: string                    // character varying(255)
  password: string                 // text (хранится как hashed_password)
  passwordConfirm: string          // только для валидации формы
  is_staff: boolean               // boolean
  account_status: AccountStatus    // app.account_status
  first_name: string              // character varying(50)
  middle_name: string | null      // character varying(50)
  last_name: string               // character varying(50)
  created_at?: Date               // timestamp with timezone
}

/**
 * Интерфейс профиля пользователя (таблица app.user_profiles)
 */
export interface IUserProfile {
  profile_id?: string             // uuid
  user_id?: string                // uuid связь с app.users
  phone_number: string | null     // character varying(15)
  address: string | null          // text
  company_name: string | null     // character varying(255)
  position: string | null         // character varying(255)
  gender: Gender | null           // app.gender
}

/**
 * Интерфейс для UI состояния
 */
export interface IEditorUIState {
  activeSection: 'account' | 'profile'
  showPassword: boolean
  isSubmitting: boolean
  hasInteracted: boolean
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

// Интерфейс для ответа API
export interface ICreateUserResponse {
  success: boolean
  message: string
  userId: string
  username: string
  email: string
}