// types.action.services.ts
/**
 * Type definitions for action services like service.add.users.to.group.ts
 */

/**
 * Response from the add users to group service
 */
export interface AddUsersResponse {
  success: boolean;
  count: number;
  message?: string;
}

/**
 * Request body for add users to group API call
 */
export interface AddUsersToGroupRequest {
  groupId: string;
  userIds: string[];
  addedBy: string;
}

/**
 * Request body for change group owner API call
 */
export interface ChangeGroupOwnerRequest {
  groupId: string;      // ID of the group
  newOwnerId: string;   // ID of the new owner
  changedBy: string;    // ID of the user making the change
}

/**
 * Response from the change group owner service
 */
export interface ChangeGroupOwnerResponse {
  success: boolean;
  message?: string;
  oldOwnerId?: string;  // ID of the previous owner
}