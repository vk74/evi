/**
 * types.user.editor.ts - used in frontend
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
  MALE = 'm',
  FEMALE = 'f',
  NOTDEFINED = 'n'
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
  is_staff: boolean                // boolean
  account_status: string           // app.account_status
  first_name: string               // character varying(50)
  middle_name: string              // character varying(50)
  last_name: string                // character varying(50)
  created_at?: Date                // timestamp with timezone
}

/**
 * Интерфейс профиля пользователя (таблица app.user_profiles)
 */
export interface IUserProfile {
  profile_id?: string             // uuid
  user_id?: string                // uuid связь с app.users
  mobile_phone_number: string     // character varying(15)
  address: string                 // 
  company_name: string            // character varying(255)
  position: string                // character varying(255)
  gender: string                  // app.gender
}

/**
 * Интерфейс для UI состояния
 */
export interface IEditorUIState {
  activeSection: 'account' | 'profile';
  showPassword: boolean;
  isSubmitting: boolean;
  hasInteracted: boolean;
  isFormChanged: boolean;  // для отслеживания изменений формы
}

/**
 * API request interface
 */
export interface ICreateUserRequest {
  username: string
  email: string
  password: string
  account_status: string // AccountStatus
  is_staff: boolean
  first_name: string
  last_name: string
  middle_name: string 
  gender: 'm' | 'f' | 'n' // null
  mobile_phone_number: string 
  address: string 
  company_name: string 
  position: string 
}

export interface IUpdateUserRequest {
  user_id: string   // Обязательное поле для обновления
  username?: string
  email?: string
  account_status?: string
  is_staff?: boolean
  first_name?: string
  last_name?: string
  middle_name?: string
  gender?: 'm' | 'f' | 'n'
  mobile_phone_number?: string
  address?: string
  company_name?: string
  position?: string
}

// Интерфейс для ответа API
export interface ICreateUserResponse {
  success: boolean
  message: string
  userId: string
  username: string
  email: string
}

/**
 * API response interfaces 
 */

// Базовый интерфейс ответа API
export interface IApiResponse {
  success: boolean;
  message: string;
}

// Интерфейс ответа API при загрузке пользователя
export interface ILoadUserResponse extends IApiResponse {
  data: {
    user: IUserAccount;
    profile: IUserProfile;
  };
}

// Интерфейс ошибки API
export interface IApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Интерфейс состояния хранилища редактора пользователей
 */
export interface UserEditorState {
  mode: EditorMode;
  account: IUserAccount;
  profile: IUserProfile;
  originalData?: {
    account: IUserAccount;
    profile: IUserProfile;
  };
  ui: IEditorUIState;
}

// В types.user.editor.ts добавим:
export interface UserEditorStoreGetters {
  isEditMode: () => boolean;
  hasChanges: () => boolean;
  getChangedFields: () => Partial<ICreateUserRequest>;
}