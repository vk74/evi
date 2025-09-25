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
 * - Group update request and response structures
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
 * Interface for validating incoming group update requests
 */
export interface UpdateGroupRequest {
  group_id: string; // UUID of the group to update
  group_name?: string; // Optional, with validation rules
  group_status?: GroupStatus; // Optional
  group_owner?: string; // Optional, UUID of the owner
  group_description?: string; // Optional
  group_email?: string; // Optional
  modified_by: string; // UUID of the user performing the update (from req.user)
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
 * Interface for group update API responses
 */
export interface UpdateGroupResponse {
  success: boolean;
  message: string;
  groupId: string; // UUID of the updated group
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
 * Used when attempting to create or update a record with a value that must be unique
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
 * Not found error interface
 * Used when a resource (e.g., group) is not found
 */
export interface NotFoundError extends BaseError {
  code: 'NOT_FOUND';
}

/**
 * Service error interface
 * Used for unexpected errors or internal server errors
 */
export interface ServiceError extends BaseError {
  code: 'INTERNAL_SERVER_ERROR';
  details: string | undefined; // Изменено с "string" на "string | undefined"
}

/**
 * Interface for fetching group members request
 */
export interface FetchGroupMembersRequest {
  groupId: string; // UUID of the group to fetch members for
}

/**
 * Interface representing a group member 
 */
export interface GroupMember {
  user_id: string; // UUID of the user
  username: string;
  name: string; // User's display name
  email?: string; // Optional email address
  role?: string; // Optional role in the group
}

/**
 * Interface for group members API responses
 */
export interface FetchGroupMembersResponse {
  success: boolean;
  message: string;
  data: {
    members: GroupMember[];
    total: number;
  } | null;
}

/**
 * Interface for removing group members request
 */
export interface RemoveGroupMembersRequest {
  groupId: string;      // UUID of the group
  userIds: string[];    // Array of user UUIDs to remove
}

/**
 * Interface for removing group members response
 */
export interface RemoveGroupMembersResponse {
  success: boolean;
  message: string;
  data?: {
    removedCount: number;
    removedUserIds: string[];
  };
}

/**
 * Union type of all possible service errors
 */
export type ServiceErrorType = 
  | ValidationError 
  | UniqueCheckError 
  | RequiredFieldError 
  | NotFoundError 
  | ServiceError;

/**
 * Interface for adding users to group request
 */
export interface AddUsersToGroupRequest {
  groupId: string;      // UUID of the group
  userIds: string[];    // Array of user UUIDs to add
}

/**
 * Interface for changing group owner request
 */
export interface ChangeGroupOwnerRequest {
  groupId: string;      // UUID of the group
  newOwnerId: string;   // UUID of the new owner
}

/**
 * Interface for deleting group request
 */
export interface DeleteGroupRequest {
  groupId: string;      // UUID of the group to delete
}

/**
 * Interface for loading group request
 */
export interface LoadGroupRequest {
  groupId: string;      // UUID of the group to load
}

/**
 * Interface for searching users request
 */
export interface SearchUsersRequest {
  searchTerm: string;   // Search term for username or name
  limit?: number;       // Optional limit for results
}