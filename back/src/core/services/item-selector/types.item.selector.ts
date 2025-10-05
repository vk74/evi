/**
 * types.item.selector.ts
 * BACKEND type definitions for item selector operations.
 */

export interface SearchParams {
  query: string;        // Search string entered by the user
  limit?: number;       // Maximum number of items to return (optional, defaults to maxItems)
}

export interface SearchResult {
  id: string;
  name: string;
  username: string;
  uuid: string;
}

export interface SearchResponse {
  success: boolean;
  items: SearchResult[];
  total: number;
}

// Error interfaces for consistent error handling
export interface ServiceError {
  code: string;         // Error code (e.g., 'INTERNAL_SERVER_ERROR')
  message: string;      // User-friendly error message
  details?: string;     // Optional detailed error information (e.g., for debugging)
}

export interface ValidationError extends ServiceError {
  code: 'VALIDATION_ERROR';
  field: string;        // Field that failed validation
}

export interface NotFoundError extends ServiceError {
  code: 'NOT_FOUND_ERROR';
  field: string;        // Resource that wasn't found
}

export interface PermissionError extends ServiceError {
  code: 'PERMISSION_ERROR';
}


// New interfaces for adding users to group feature
export interface AddUsersToGroupRequest {
  groupId: string;      // UUID of the group to add users to
  userIds: string[];    // Array of user UUIDs to add to the group
  addedBy?: string;     // UUID of the user performing the action (optional, can be taken from JWT)
}

export interface AddUsersToGroupResponse {
  success: boolean;     // Indicates if the operation was successful
  message: string;      // Descriptive message about the operation result
  count: number;        // Number of users successfully added to the group
}

// New interfaces for changing group owner feature
export interface ChangeGroupOwnerRequest {
  groupId: string;      // UUID of the group
  newOwnerId: string;   // UUID of the new owner
  changedBy?: string;   // UUID of the user performing the action (optional, can be taken from JWT)
}

export interface ChangeGroupOwnerResponse {
  success: boolean;     // Indicates if the operation was successful
  message: string;      // Descriptive message about the operation result
  oldOwnerId?: string;  // UUID of the previous owner (useful for UI updates)
}

// New interfaces for adding user to groups feature
export interface AddUserToGroupsRequest {
  userId: string;       // UUID of the user to add to groups
  groupIds: string[];   // Array of group UUIDs to add the user to
  addedBy?: string;     // UUID of the user performing the action (optional, can be taken from JWT)
}

export interface AddUserToGroupsResponse {
  success: boolean;     // Indicates if the operation was successful
  message: string;      // Descriptive message about the operation result
  count: number;        // Number of groups the user was successfully added to
}