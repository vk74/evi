/**
 * File: service.return.multiple.usernames.ts
 * Version: 1.0.0
 * Description: FRONTEND service for returning multiple selected users from ItemSelector
 * Purpose: Returns multiple selected users for use in forms, validates data, handles errors
 * Frontend file
 * Created: 2024-12-19
 * Last updated: 2024-12-19
 */
import { ActionResult } from './types.item.selector';
import { SearchResult } from './types.search.services';
import { useUiStore } from '@/core/state/uistate';

// Define interfaces for the selected users
interface SelectedUser {
  uuid: string;
  name: string;
  [key: string]: any;
}

// Logger for tracking operations
const logger = {
  info: (message: string, meta?: object) => console.log(`[ReturnMultipleUsernamesService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => console.error(`[ReturnMultipleUsernamesService] ${message}`, error || ''),
};

/**
 * Returns multiple selected users for use in forms.
 * @param userIds - Array of user UUIDs selected in ItemSelector
 * @param searchResults - Array of search results from the search service
 * @returns Promise with response containing the selected users
 */
async function returnMultipleUsernames(userIds: string[], searchResults?: SearchResult[]): Promise<ActionResult> {
  const uiStore = useUiStore();

  // Validate input parameters
  if (!userIds || userIds.length === 0) {
    const errorMessage = 'No users selected';
    logger.error(errorMessage);
    uiStore.showErrorSnackbar(errorMessage);
    return { success: false, message: errorMessage };
  }

  logger.info('Users selected for return', { selectedUserIds: userIds, count: userIds.length });

  try {
    // Find the selected users in search results
    const selectedUsers: SelectedUser[] = [];
    
    if (searchResults && searchResults.length > 0) {
      // Find users in search results by UUID
      for (const userId of userIds) {
        const foundUser = searchResults.find(user => user.uuid === userId);
        
        if (foundUser) {
          selectedUsers.push({
            name: foundUser.name || 'Unknown User',
            ...foundUser // Include all other properties including uuid
          });
          logger.info('Found user in search results', { user: foundUser });
        } else {
          // Create fallback for user not found in search results
          selectedUsers.push({
            uuid: userId,
            name: `User ${userId.substring(0, 8)}`, // Fallback name based on UUID
          });
          logger.info('User not found in search results, using fallback', { userId });
        }
      }
    } else {
      // Create fallbacks for all users if no search results
      for (const userId of userIds) {
        selectedUsers.push({
          uuid: userId,
          name: `User ${userId.substring(0, 8)}`, // Fallback name based on UUID
        });
      }
      logger.info('No search results available, using fallbacks for all users');
    }

    logger.info('Users return successful', { selectedUsers, count: selectedUsers.length });

    // Return success response with the selected users data
    return {
      success: true,
      message: `${selectedUsers.length} users returned successfully`,
      selectedItems: selectedUsers,
      users: selectedUsers, // Alternative property name for compatibility
      count: selectedUsers.length
    };
  } catch (error) {
    // Log error
    logger.error('Error returning users', error);

    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred while returning users';
    
    uiStore.showErrorSnackbar(errorMessage);

    // Return error response
    return { success: false, message: errorMessage };
  }
}

export default returnMultipleUsernames; 