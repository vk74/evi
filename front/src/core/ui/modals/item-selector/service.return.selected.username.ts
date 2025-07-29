/**
 * @file service.return.selected.username.ts
 * FRONTEND service for returning the selected user's name from ItemSelector.
 * 
 * Functionality:
 * - Returns the selected user's name for use in forms
 * - Validates the received data
 * - Handles errors during the operation
 * - Provides logging for key operations
 */
import { ActionResult } from './types.item.selector';
import { SearchResult } from './types.search.services';
import { useUiStore } from '@/core/state/uistate';

// Define interfaces for the selected user
interface SelectedUser {
  uuid: string;
  name: string;
  username?: string;
  [key: string]: any;
}

// Logger for tracking operations
const logger = {
  info: (message: string, meta?: object) => console.log(`[ReturnSelectedUsernameService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => console.error(`[ReturnSelectedUsernameService] ${message}`, error || ''),
};

/**
 * Returns the selected user's name for use in forms.
 * @param userIds - Array of user UUIDs selected in ItemSelector (should contain only one item)
 * @param searchResults - Array of search results from the search service
 * @returns Promise with response containing the selected user's name
 */
async function returnSelectedUsername(userIds: string[], searchResults?: SearchResult[]): Promise<ActionResult> {
  const uiStore = useUiStore();

  // Validate input parameters
  if (!userIds || userIds.length === 0) {
    const errorMessage = 'No user selected';
    logger.error(errorMessage);
    uiStore.showErrorSnackbar(errorMessage);
    return { success: false, message: errorMessage };
  }

  // Ensure only one user is selected (ItemSelector should be configured with maxItems=1)
  if (userIds.length > 1) {
    const errorMessage = 'Only one user can be selected';
    logger.error(errorMessage);
    uiStore.showErrorSnackbar(errorMessage);
    return { success: false, message: errorMessage };
  }

  // Get the selected user ID (the only item in the array)
  const selectedUserId = userIds[0];

  logger.info('User selected for username return', { selectedUserId });

  try {
    // Find the selected user in search results
    let selectedUser: SelectedUser | null = null;
    
    if (searchResults && searchResults.length > 0) {
      // Find the user in search results by UUID
      const foundUser = searchResults.find(user => user.uuid === selectedUserId);
      
      if (foundUser) {
        selectedUser = {
          name: foundUser.name || foundUser.username || 'Unknown User',
          username: foundUser.username,
          ...foundUser // Include all other properties including uuid
        };
        logger.info('Found user in search results', { selectedUser });
      }
    }
    
    // If user not found in search results, create a fallback
    if (!selectedUser) {
      selectedUser = {
        uuid: selectedUserId,
        name: `User ${selectedUserId.substring(0, 8)}`, // Fallback name based on UUID
      };
      logger.info('User not found in search results, using fallback', { selectedUser });
    }

    logger.info('Username return successful', { selectedUser });

    // Return success response with the selected user data
    return {
      success: true,
      message: 'Username returned successfully',
      selectedUser: selectedUser,
      user: selectedUser // Alternative property name for compatibility
    };
  } catch (error) {
    // Log error
    logger.error('Error returning username', error);

    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred while returning username';
    
    uiStore.showErrorSnackbar(errorMessage);

    // Return error response
    return { 
      success: false, 
      message: errorMessage 
    };
  }
}

export default returnSelectedUsername; 