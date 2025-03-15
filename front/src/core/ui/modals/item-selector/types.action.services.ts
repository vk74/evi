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