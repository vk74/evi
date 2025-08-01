/**
 * File: service.return.selected.group.ts
 * Version: 1.0.0
 * Description: FRONTEND service for returning the selected group's name from ItemSelector
 * Purpose: Returns the selected group's name for use in forms, validates data, handles errors
 * Frontend file
 */
import { ActionResult } from './types.item.selector';
import { SearchResult } from './types.search.services';
import { useUiStore } from '@/core/state/uistate';

// Define interfaces for the selected group
interface SelectedGroup {
  uuid: string;
  name: string;
  [key: string]: any;
}

// Logger for tracking operations
const logger = {
  info: (message: string, meta?: object) => console.log(`[ReturnSelectedGroupService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => console.error(`[ReturnSelectedGroupService] ${message}`, error || ''),
};

/**
 * Returns the selected group's name for use in forms.
 * @param groupIds - Array of group UUIDs selected in ItemSelector (should contain only one item)
 * @param searchResults - Array of search results from the search service
 * @returns Promise with response containing the selected group's name
 */
async function returnSelectedGroup(groupIds: string[], searchResults?: SearchResult[]): Promise<ActionResult> {
  const uiStore = useUiStore();

  // Validate input parameters
  if (!groupIds || groupIds.length === 0) {
    const errorMessage = 'No group selected';
    logger.error(errorMessage);
    uiStore.showErrorSnackbar(errorMessage);
    return { success: false, message: errorMessage };
  }

  // Ensure only one group is selected (ItemSelector should be configured with maxItems=1)
  if (groupIds.length > 1) {
    const errorMessage = 'Only one group can be selected';
    logger.error(errorMessage);
    uiStore.showErrorSnackbar(errorMessage);
    return { success: false, message: errorMessage };
  }

  // Get the selected group ID (the only item in the array)
  const selectedGroupId = groupIds[0];

  logger.info('Group selected for name return', { selectedGroupId });

  try {
    // Find the selected group in search results
    let selectedGroup: SelectedGroup | null = null;
    
    if (searchResults && searchResults.length > 0) {
      // Find the group in search results by UUID
      const foundGroup = searchResults.find(group => group.uuid === selectedGroupId);
      
      if (foundGroup) {
        selectedGroup = {
          name: foundGroup.name || 'Unknown Group',
          ...foundGroup // Include all other properties including uuid
        };
        logger.info('Found group in search results', { selectedGroup });
      }
    }
    
    // If group not found in search results, create a fallback
    if (!selectedGroup) {
      selectedGroup = {
        uuid: selectedGroupId,
        name: `Group ${selectedGroupId.substring(0, 8)}`, // Fallback name based on UUID
      };
      logger.info('Group not found in search results, using fallback', { selectedGroup });
    }

    logger.info('Group name return successful', { selectedGroup });

    // Return success response with the selected group data
    return {
      success: true,
      message: 'Group name returned successfully',
      selectedGroup: selectedGroup,
      group: selectedGroup // Alternative property name for compatibility
    };
  } catch (error) {
    // Log error
    logger.error('Error returning group name', error);

    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred while returning group name';
    
    uiStore.showErrorSnackbar(errorMessage);

    // Return error response
    return { 
      success: false, 
      message: errorMessage 
    };
  }
}

export default returnSelectedGroup; 