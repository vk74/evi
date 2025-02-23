/**
 * types.group.editor.ts
 * Backend type definitions for group management endpoints.
 * 
 * This module contains TypeScript interfaces and types for:
 * - Group creation request validation
 * - API response structures
 * - Group status enumeration
 * - Error handling types
 * - Group fetch request and response structures
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
  group_name: string;
  group_status: GroupStatus;
  group_owner: string; // UUID of the owner
  group_description: string;
  group_email: string;
}

/**
 * Interface for group creation API responses
 */
export interface CreateGroupResponse {
  success: boolean;
  message: string;
  groupId: string; // UUID of the created group
  group_name: string;
}

/**
 * Interface for fetching group data by group ID
 */
export interface FetchGroupRequest {
  groupId: string; // UUID of the group to fetch
}

/**
 * Interface representing core data from app.groups
 */
export interface GroupBaseData {
  group_id: string; // UUID
  group_name: string;
  reserve_1: string | null;
  group_status: GroupStatus;
  group_owner: string; // UUID of the owner
  is_system: boolean;
}

/**
 * Interface representing detailed data from app.group_details
 */
export interface GroupDetailsData {
  group_id: string; // UUID (link to app.groups)
  group_description: string | null;
  group_email: string | null;
  group_created_at: Date;
  group_created_by: string | null; // UUID of the creator
  group_modified_at: Date | null;
  group_modified_by: string | null; // UUID of the modifier
  reserve_field_1: string | null;
  reserve_field_2: string | null;
  reserve_field_3: number | null;
}

/**
 * Interface representing the full group data structure
 * Combines data from app.groups and app.group_details
 */
export interface GroupData {
  group: GroupBaseData;
  details: GroupDetailsData | null; // Details can be null if not found in app.group_details
}

/**
 * Interface for group fetch API responses
 */
export interface FetchGroupResponse {
  success: boolean;
  message: string;
  data: GroupData | null;
}

/**
 * Generic API response structure
 */
export interface ApiResponse {
  success: boolean;
  message: string;
}

/**
 * Base error interface
 */
interface BaseError {
  message: string;
  field?: string;
  details?: unknown;
}

/**
 * Validation error interface
 * Used for field-level validation failures
 */
export interface ValidationError extends BaseError {
  code: 'VALIDATION_ERROR';
  field: string;
}

/**
 * Unique constraint error interface
 * Used when attempting to create a record with a value that must be unique
 */
export interface UniqueCheckError extends BaseError {
  code: 'UNIQUE_CONSTRAINT_ERROR';
  field: string;
}

/**
 * Required field error interface
 * Used when required fields are missing
 */
export interface RequiredFieldError extends BaseError {
  code: 'REQUIRED_FIELD_ERROR';
  field: string;
}

/**
 * Service error interface
 * Used for unexpected errors or internal server errors
 */
export interface ServiceError extends BaseError {
  code: 'INTERNAL_SERVER_ERROR';
  details: string;
}

/**
 * Union type of all possible service errors
 */
export type ServiceErrorType = 
  | ValidationError 
  | UniqueCheckError 
  | RequiredFieldError 
  | ServiceError;