/**
 * @file types.user.editor.ts
 * Version: 1.0.0
 * Type definitions for the user editor component.
 * Frontend file that defines TypeScript types and interfaces for user editor functionality.
 *
 * This module defines TypeScript types and interfaces for:
 * - Component modes and states
 * - User account and profile data structures
 * - Form validation
 * - API interfaces
 */

/**
 * Enums
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
 * Interface for user information (app.users table)
 */
export interface IUserAccount {
  user_id?: string                 // uuid, optional as it's generated during creation
  username: string                 // character varying(50)
  email: string                    // character varying(255)
  password: string                 // text (stored as hashed_password)
  passwordConfirm: string          // only for form validation
  is_staff: boolean                // boolean
  account_status: string           // app.account_status
  first_name: string               // character varying(50)
  middle_name: string              // character varying(50)
  last_name: string                // character varying(50)
  created_at?: Date                // timestamp with timezone
  is_active?: boolean              // boolean
  mobile_phone_number?: string     // character varying(15)
  gender?: 'm' | 'f' | 'n'         // app.gender
  is_system?: boolean              // boolean - system user flag
}


/**
 * Interface for UI state
 */
export interface IEditorUIState {
  activeSection: 'details' | 'groups';
  showPassword: boolean;
  isSubmitting: boolean;
  hasInteracted: boolean;
  isFormChanged: boolean;  // for tracking form changes
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
}

export interface IUpdateUserRequest {
  user_id: string   // Required field for updates
  username?: string
  email?: string
  account_status?: string
  is_staff?: boolean
  first_name?: string
  last_name?: string
  middle_name?: string
  gender?: 'm' | 'f' | 'n'
  mobile_phone_number?: string
}

// Type for update data without user_id (for API requests)
export interface IUpdateUserRequestData {
  username?: string
  email?: string
  account_status?: string
  is_staff?: boolean
  first_name?: string
  last_name?: string
  middle_name?: string
  gender?: 'm' | 'f' | 'n'
  mobile_phone_number?: string
}

// Interface for a single group membership item in user editor
export interface IUserGroupMembership {
  group_id: string
  group_name: string
  group_status: 'active' | 'disabled' | 'archived'
  is_system: boolean
  owner_username?: string
}

// Response for fetching groups of a user with pagination
export interface IFetchUserGroupsResponse extends IApiResponse {
  data?: {
    items: IUserGroupMembership[]
    total: number
  }
}

// Interface for API response
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

// Base API response interface
export interface IApiResponse {
  success: boolean;
  message: string;
}

// Interface for API response when loading user
export interface ILoadUserResponse extends IApiResponse {
  data: {
    user: IUserAccount;
  };
}

// Interface for API error
export interface IApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Interface for user editor store state
 */
export interface UserEditorState {
  mode: EditorMode;
  account: IUserAccount;
  originalData?: {
    account: IUserAccount;
  };
  ui: IEditorUIState;
  groups: {
    selectedGroups: string[];
  };
}

// In types.user.editor.ts add:
export interface UserEditorStoreGetters {
  isEditMode: () => boolean;
  hasChanges: () => boolean;
  getChangedFields: () => Partial<ICreateUserRequest>;
}