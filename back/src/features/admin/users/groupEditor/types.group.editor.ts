/**
 * types.group.editor.ts 
 * Backend type definitions for group management endpoints.
 * 
 * This module contains TypeScript interfaces and types for:
 * - Group creation request validation
 * - API response structures
 * - Group status enumeration
 * - Error handling types
 * 
 * These types are used by the backend API endpoints to ensure
 * type safety and validation of incoming requests from the frontend.
 */

/**
 * Available group statuses
 */
export enum GroupStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
  ARCHIVED = 'archived'
}

/**
* Interface for validating incoming group creation requests
*/
export interface CreateGroupRequest {
  group_name: string
  group_status: GroupStatus
  group_owner: string
  group_description: string
  group_email: string
}

/**
* Interface for group creation API responses
*/
export interface CreateGroupResponse {
  success: boolean
  message: string
  groupId: string
  group_name: string
}

/**
* Generic API response structure
*/
export interface ApiResponse {
  success: boolean
  message: string
}

/**
* Base error interface
*/
interface BaseError {
  message: string
  field?: string
  details?: unknown
}

/**
* Validation error interface
* Used for field-level validation failures
*/
export interface ValidationError extends BaseError {
  code: 'VALIDATION_ERROR'
  field: string
}

/**
* Unique constraint error interface
* Used when attempting to create a record with a value that must be unique
*/
export interface UniqueCheckError extends BaseError {
  code: 'UNIQUE_CONSTRAINT_ERROR'
  field: string
}

/**
* Required field error interface
* Used when required fields are missing
*/
export interface RequiredFieldError extends BaseError {
  code: 'REQUIRED_FIELD_ERROR'
  field: string
}

/**
* Service error interface
* Used for unexpected errors or internal server errors
*/
export interface ServiceError extends BaseError {
  code: 'INTERNAL_SERVER_ERROR'
  details: string
}

/**
* Union type of all possible service errors
*/
export type ServiceErrorType = 
  | ValidationError 
  | UniqueCheckError 
  | RequiredFieldError 
  | ServiceError;